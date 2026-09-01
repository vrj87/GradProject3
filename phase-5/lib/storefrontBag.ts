import type { ProductRecord } from "./schemas";

export const STOREFRONT_ORIGIN =
  process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3000";

export const COACH_BAG_SOURCE = "shortlist-coach";

/** Closest storefront SKU so /bag and checkout resolve a real catalogue line. */
export const COACH_TO_STOREFRONT: Record<string, { productId: string; size: string }> = {
  "p-kurta-anarkali": { productId: "w-kurta-1", size: "M" },
  "p-kurta-straight": { productId: "w-kurta-2", size: "M" },
  "p-kurta-festive": { productId: "w-kurta-6", size: "M" },
  "p-kurta-chikankari": { productId: "w-kurta-10", size: "M" },
  "p-kurta-printed": { productId: "w-kurta-4", size: "M" },
  "p-kurta-silk": { productId: "w-kurta-7", size: "M" },
  "p-sneaker-white": { productId: "w-sneaker-1", size: "UK 6" },
  "p-sneaker-chunky": { productId: "w-sneaker-4", size: "UK 6" },
  "p-dress-midi": { productId: "w-dress-5", size: "M" },
  "p-dress-wrap": { productId: "w-dress-4", size: "M" },
  "p-dress-bodycon": { productId: "w-dress-2", size: "M" },
  "p-top-shirt": { productId: "w-top-3", size: "M" },
  "p-heels-block": { productId: "w-heel-4", size: "UK 6" },
  "p-flats-juti": { productId: "w-heel-8", size: "UK 6" },
  "p-bag-sling": { productId: "w-bag-2", size: "OS" },
  "p-earrings-jhumka": { productId: "w-ear-1", size: "OS" }
};

/** Storefront hanger ids → coach catalog ids, so the room can hand a pair over. */
export function coachIdFromStorefront(id: string): string | undefined {
  if (COACH_TO_STOREFRONT[id]) return id;
  const found = Object.entries(COACH_TO_STOREFRONT).find(([, mapped]) => mapped.productId === id);
  return found?.[0];
}

export function resolvePairIds(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const ids: string[] = [];
  for (const token of raw.replace(/%2C/gi, ",").split(",")) {
    const mapped = coachIdFromStorefront(token.trim());
    if (mapped && !ids.includes(mapped)) ids.push(mapped);
    if (ids.length === 3) break;
  }
  return ids;
}

export interface CoachBagSnapshot {
  brand: string;
  name: string;
  image?: string;
  price: number;
}

export interface CoachBagMessage {
  source: typeof COACH_BAG_SOURCE;
  type: "add-to-bag";
  productId: string;
  size: string;
  snapshot: CoachBagSnapshot;
}

function defaultSize(category: ProductRecord["category"]): string {
  if (category === "footwear") return "UK 6";
  if (category === "accessories") return "OS";
  return "M";
}

export function coachBagPayload(product: ProductRecord): CoachBagMessage {
  const mapped = COACH_TO_STOREFRONT[product.id];
  return {
    source: COACH_BAG_SOURCE,
    type: "add-to-bag",
    productId: mapped?.productId ?? `coach:${product.id}`,
    size: mapped?.size ?? defaultSize(product.category),
    snapshot: {
      brand: product.brand,
      name: product.name,
      image: product.imageUrl,
      price: product.priceInr
    }
  };
}

function parentOrigin(): string {
  if (typeof window === "undefined") return STOREFRONT_ORIGIN;
  if (window.parent === window) return window.location.origin;
  try {
    if (document.referrer) return new URL(document.referrer).origin;
  } catch {
    /* ignore */
  }
  return STOREFRONT_ORIGIN;
}

/** Tell the Studio storefront to put this SKU in `myntra-bag`. No-op when Coach is not iframed. */
export function notifyStorefrontBag(product: ProductRecord) {
  if (typeof window === "undefined") return;
  const payload = coachBagPayload(product);
  const targets = new Set([
    parentOrigin(),
    STOREFRONT_ORIGIN,
    "http://localhost:3000",
    "http://127.0.0.1:3000"
  ]);
  for (const origin of targets) {
    window.parent.postMessage(payload, origin);
  }
}

export function storefrontBagHref(product: ProductRecord, includeAdd = false): string {
  const payload = coachBagPayload(product);
  const url = new URL("/bag", STOREFRONT_ORIGIN);
  if (includeAdd) {
    url.searchParams.set("add", payload.productId);
    url.searchParams.set("size", payload.size);
    url.searchParams.set("brand", payload.snapshot.brand);
    url.searchParams.set("name", payload.snapshot.name);
    url.searchParams.set("price", String(payload.snapshot.price));
    if (payload.snapshot.image) url.searchParams.set("image", payload.snapshot.image);
  }
  return url.toString();
}
