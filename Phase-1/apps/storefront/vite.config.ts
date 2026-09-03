import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { loadEnvFiles } from "../../tools/discovery-pipeline/src/load-env";
import { runCoachInsights } from "./src/lib/coachHttp";
import { coachLlmStatus } from "./src/lib/generateCoachInsights";
import { mergeOrderLists, type PlacedOrder } from "./src/lib/placedOrders";
import { publicReviewUrl } from "./src/lib/sourceUrls";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const discovery = path.join(root, "data", "discovery");
const phase2 = path.resolve(root, "../phase-2/data");
const ordersFile = path.join(root, "data", "storefront", "orders.json");
const publicDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "public");

function readRequestBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

async function loadSharedOrders(): Promise<PlacedOrder[]> {
  try {
    const raw = await readFile(ordersFile, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as PlacedOrder[]) : [];
  } catch {
    return [];
  }
}

async function saveSharedOrders(orders: PlacedOrder[]): Promise<PlacedOrder[]> {
  await mkdir(path.dirname(ordersFile), { recursive: true });
  await writeFile(ordersFile, `${JSON.stringify(orders, null, 2)}\n`, "utf8");
  return orders;
}

function json(res: ServerResponse, body: unknown, status = 200) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

async function handleSharedOrders(req: IncomingMessage, res: ServerResponse) {
  if (req.method === "GET") {
    json(res, { orders: await loadSharedOrders() });
    return;
  }
  if (req.method === "PUT") {
    let incoming: unknown;
    try {
      incoming = JSON.parse(await readRequestBody(req));
    } catch {
      json(res, { error: "Body must be JSON." }, 400);
      return;
    }
    const list = Array.isArray(incoming)
      ? (incoming as PlacedOrder[])
      : Array.isArray((incoming as { orders?: unknown })?.orders)
        ? ((incoming as { orders: PlacedOrder[] }).orders)
        : null;
    if (!list) {
      json(res, { error: "Expected an orders array." }, 400);
      return;
    }
    const merged = mergeOrderLists(await loadSharedOrders(), list);
    json(res, { orders: await saveSharedOrders(merged) });
    return;
  }
  json(res, { error: "Method not allowed." }, 405);
}

async function syncPublicData(): Promise<void> {
  const targets: Array<[string, string]> = [
    [path.join(discovery, "themes.json"), "discovery/themes.json"],
    [path.join(discovery, "opportunity-ranking.json"), "discovery/opportunity-ranking.json"],
    [path.join(discovery, "pipeline-stats.json"), "discovery/pipeline-stats.json"],
    [path.join(discovery, "normalized-reviews.json"), "discovery/normalized-reviews.json"],
    [path.join(discovery, "raw-reviews.json"), "discovery/raw-reviews.json"],
    [path.join(phase2, "filled-matrix.json"), "phase2/filled-matrix.json"],
    [path.join(phase2, "nomination.json"), "phase2/nomination.json"],
    [path.join(phase2, "metric-tree.json"), "phase2/metric-tree.json"],
    [path.join(phase2, "phase2-stats.json"), "phase2/phase2-stats.json"]
  ];
  await mkdir(path.join(publicDir, "discovery"), { recursive: true });
  await mkdir(path.join(publicDir, "phase2"), { recursive: true });
  for (const [from, rel] of targets) {
    try {
      await copyFile(from, path.join(publicDir, rel));
    } catch {
      /* artefact may not exist yet */
    }
  }
}

function copyArtefacts(): Plugin {
  return {
    name: "copy-discovery-artefacts",
    async buildStart() {
      await syncPublicData();
    }
  };
}

const DOWNLOAD_ARTEFACTS: Record<string, string> = {
  raw: "raw-reviews.json",
  normalized: "normalized-reviews.json"
};

async function handleCoachInsights(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "POST") {
    json(res, { error: "Method not allowed." }, 405);
    return;
  }
  let incoming: unknown;
  try {
    incoming = JSON.parse(await readRequestBody(req));
  } catch {
    json(res, { error: "Body must be JSON." }, 400);
    return;
  }
  const result = await runCoachInsights(incoming);
  if ("error" in result) {
    json(res, result, 400);
    return;
  }
  json(res, result);
}

function discoveryApi(): Plugin {
  return {
    name: "discovery-api",
    configureServer(server) {
      loadEnvFiles();
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? "/", "http://localhost");
        if (url.pathname === "/api/orders") {
          await handleSharedOrders(req, res);
          return;
        }
        if (url.pathname === "/api/coach/status") {
          json(res, coachLlmStatus());
          return;
        }
        if (url.pathname === "/api/coach/insights") {
          await handleCoachInsights(req, res);
          return;
        }
        const staticMatch = url.pathname.match(/^\/(discovery|phase2)\/[\w.-]+\.json$/);
        if (staticMatch) {
          try {
            const body = await readFile(path.join(publicDir, url.pathname.slice(1)));
            res.setHeader("Content-Type", "application/json");
            res.end(body);
            return;
          } catch {
            /* fall through to public dir / SPA */
          }
        }
        const downloadMatch = url.pathname.match(/^\/api\/discovery\/download\/([^/]+)$/);
        if (downloadMatch) {
          const artefact = DOWNLOAD_ARTEFACTS[downloadMatch[1] ?? ""];
          if (!artefact) {
            res.statusCode = 404;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Unknown download type." }));
            return;
          }
          try {
            const body = await readFile(path.join(discovery, artefact), "utf8");
            res.setHeader("Content-Type", "application/json");
            res.setHeader("Content-Disposition", `attachment; filename="${artefact}"`);
            res.end(body);
          } catch {
            res.statusCode = 404;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Scrape data is not available right now." }));
          }
          return;
        }
        if (url.pathname === "/api/phase2") {
          try {
            const [matrix, nomination, tree, stats] = await Promise.all([
              readFile(path.join(phase2, "filled-matrix.json"), "utf8"),
              readFile(path.join(phase2, "nomination.json"), "utf8"),
              readFile(path.join(phase2, "metric-tree.json"), "utf8").catch(() => "null"),
              readFile(path.join(phase2, "phase2-stats.json"), "utf8").catch(() => "null")
            ]);
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({
                matrix: JSON.parse(matrix),
                nomination: JSON.parse(nomination),
                tree: tree === "null" ? null : JSON.parse(tree),
                stats: stats === "null" ? null : JSON.parse(stats)
              })
            );
          } catch {
            res.statusCode = 404;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "This view is not available right now." }));
          }
          return;
        }
        if (url.pathname !== "/api/discovery") return next();
        try {
          const [themes, ranking, stats, normalized] = await Promise.all([
            readFile(path.join(discovery, "themes.json"), "utf8"),
            readFile(path.join(discovery, "opportunity-ranking.json"), "utf8"),
            readFile(path.join(discovery, "pipeline-stats.json"), "utf8"),
            readFile(path.join(discovery, "normalized-reviews.json"), "utf8")
          ]);
          const voices = (JSON.parse(normalized) as Array<{
            id: string;
            text: string;
            source: string;
            sourceId?: string;
            url?: string;
            rating?: number | null;
            scrapedAt: string;
            wishlistRelevant: boolean;
          }>)
            .filter((row) => row.wishlistRelevant)
            .map((row) => ({
              id: row.id,
              text: row.text.replace(/`/g, "").trim(),
              source: row.source,
              rating: row.rating ?? null,
              gatheredAt: row.scrapedAt,
              url: publicReviewUrl({
                source: row.source,
                sourceId: row.sourceId,
                url: row.url,
                reviewId: row.id
              })
            }));
          const themeRows = (
            JSON.parse(themes) as Array<{
              quotes?: Array<{ source: string; url?: string; reviewId: string }>;
            }>
          ).map((theme) => ({
            ...theme,
            quotes: (theme.quotes ?? []).map((quote) => ({
              ...quote,
              url: publicReviewUrl({
                source: quote.source,
                url: quote.url,
                reviewId: quote.reviewId
              })
            }))
          }));
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              themes: themeRows,
              ranking: JSON.parse(ranking),
              stats: JSON.parse(stats),
              voices
            })
          );
        } catch {
          res.statusCode = 404;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Shopper stories are not available right now." }));
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), copyArtefacts(), discoveryApi()],
  envDir: root,
  server: { port: 3000, host: true }
});
