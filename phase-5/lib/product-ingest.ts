import { CATALOG, findCatalogProduct } from "./catalog";
import { sanitizeReviewText } from "./guardrails";
import { ProductRecordSchema, type Category, type ProductRecord } from "./schemas";

/**
 * Three-tier ingest from 5b. Tier 1 parses a public Myntra page, tier 2 serves
 * the demo catalog, tier 3 hands off to the collect UI. Appendix D requires an
 * allowlist and private-IP blocking, so tier 1 refuses anything else.
 */

const ALLOWED_HOSTS = ["myntra.com", "www.myntra.com", "m.myntra.com"];

export class IngestError extends Error {
  constructor(
    message: string,
    readonly status = 400
  ) {
    super(message);
    this.name = "IngestError";
  }
}

function isPrivateHost(hostname: string): boolean {
  if (/^(localhost|.*\.local|.*\.internal)$/i.test(hostname)) return true;
  if (/^\[?::1\]?$/.test(hostname)) return true;
  if (/^0x/i.test(hostname)) return true;
  const ipv4 = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!ipv4) return false;
  const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 192 && b === 168) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 169 && b === 254) ||
    a >= 224
  );
}

/** SSRF gate. Throws unless the URL is an https Myntra product page. */
export function assertAllowedUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new IngestError("That is not a valid URL.");
  }
  if (url.protocol !== "https:") {
    throw new IngestError("Only https URLs are accepted.");
  }
  if (isPrivateHost(url.hostname)) {
    throw new IngestError("Private and loopback addresses are blocked.");
  }
  if (!ALLOWED_HOSTS.includes(url.hostname.toLowerCase())) {
    throw new IngestError(`Only myntra.com product pages are allowed, received ${url.hostname}.`);
  }
  return url;
}

function inferCategory(text: string): Category {
  if (/kurta|saree|lehenga|salwar|anarkali|ethnic|dupatta|churidar/i.test(text)) return "ethnic";
  if (/shoe|sneaker|sandal|heel|jutti|flat|boot|footwear/i.test(text)) return "footwear";
  if (/bag|earring|jhumka|watch|belt|scarf|jewel/i.test(text)) return "accessories";
  return "western";
}

function jsonLdBlocks(html: string): unknown[] {
  const blocks: unknown[] = [];
  const pattern = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html))) {
    try {
      blocks.push(JSON.parse(match[1]!.trim()));
    } catch {
      // A malformed block is skipped rather than failing the whole parse.
    }
  }
  return blocks;
}

function firstProductNode(blocks: unknown[]): Record<string, unknown> | null {
  const queue = [...blocks];
  while (queue.length) {
    const node = queue.shift();
    if (Array.isArray(node)) {
      queue.push(...node);
      continue;
    }
    if (node && typeof node === "object") {
      const record = node as Record<string, unknown>;
      const type = record["@type"];
      if (type === "Product" || (Array.isArray(type) && type.includes("Product"))) return record;
      if (record["@graph"]) queue.push(record["@graph"]);
    }
  }
  return null;
}

function priceFrom(node: Record<string, unknown>): number | null {
  const offers = node.offers as Record<string, unknown> | Array<Record<string, unknown>> | undefined;
  const offer = Array.isArray(offers) ? offers[0] : offers;
  const raw = offer?.price ?? offer?.lowPrice ?? node.price;
  const value = Number(String(raw ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(value) && value > 0 ? Math.round(value) : null;
}

/** Tier 1 parse. Exported for tests — no network involved. */
export function parseProductHtml(html: string, url: string): ProductRecord | null {
  const node = firstProductNode(jsonLdBlocks(html));
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);

  const name = (node?.name as string) || sanitizeReviewText(titleMatch?.[1] ?? "", 120);
  if (!name) return null;

  const brandNode = node?.brand as Record<string, unknown> | string | undefined;
  const brand =
    (typeof brandNode === "string" ? brandNode : (brandNode?.name as string)) ||
    name.split(" ")[0] ||
    "Unknown";
  const price = node ? priceFrom(node) : null;
  if (price === null) return null;

  const image = Array.isArray(node?.image) ? (node?.image[0] as string) : (node?.image as string);
  const slug = new URL(url).pathname.split("/").filter(Boolean).pop() ?? "ingested";

  return ProductRecordSchema.parse({
    id: `ingested-${slug}`.slice(0, 64),
    sourceUrl: url,
    name: sanitizeReviewText(name, 120),
    brand: sanitizeReviewText(brand, 60),
    category: inferCategory(`${name} ${url}`),
    priceInr: price,
    imageUrl: typeof image === "string" ? image : undefined,
    // A public page gives no usable review corpus, so tier 3 fills this in.
    reviews: []
  });
}

export type IngestTier = "url-parse" | "demo-catalog" | "manual-enrich";

export interface IngestResult {
  tier: IngestTier;
  product: ProductRecord;
  needsEnrichment: boolean;
  note: string;
}

export interface IngestInput {
  url?: string;
  catalogId?: string;
}

export async function ingestProduct(
  input: IngestInput,
  deps: { fetchImpl?: typeof fetch; timeoutMs?: number } = {}
): Promise<IngestResult> {
  if (input.catalogId) {
    const product = findCatalogProduct(input.catalogId);
    if (!product) throw new IngestError(`Unknown catalog id: ${input.catalogId}`, 404);
    return {
      tier: "demo-catalog",
      product,
      needsEnrichment: false,
      note: "Served from the seeded demo catalog with its review corpus."
    };
  }

  if (!input.url) throw new IngestError("Provide either a url or a catalogId.");

  const url = assertAllowedUrl(input.url);
  const fetchImpl = deps.fetchImpl ?? fetch;
  const timeoutMs = deps.timeoutMs ?? Number(process.env.PRODUCT_INGEST_TIMEOUT_MS ?? 8000);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(url.toString(), {
      signal: controller.signal,
      headers: { "user-agent": "GradProject3-Phase5-Demo/1.0 (+research prototype)" }
    });
    if (!response.ok) throw new Error(`status ${response.status}`);

    const parsed = parseProductHtml(await response.text(), url.toString());
    if (!parsed) throw new Error("no product data in page");

    return {
      tier: "url-parse",
      product: parsed,
      needsEnrichment: true,
      note: "Parsed from the public page. It has no reviews yet, so the coach will read low confidence until reviews are added in the collect UI."
    };
  } catch {
    // Appendix E: Myntra HTML changes, so a blocked or changed page falls back
    // to the catalog rather than failing the demo.
    const guess = CATALOG.find((item) => item.category === inferCategory(url.toString())) ?? CATALOG[0]!;
    return {
      tier: "demo-catalog",
      product: guess,
      needsEnrichment: true,
      note: `Could not read that page, so the closest demo SKU (${guess.name}) was substituted. Tier 3 is the collect UI at NEXT_PUBLIC_COLLECT_URL.`
    };
  } finally {
    clearTimeout(timer);
  }
}
