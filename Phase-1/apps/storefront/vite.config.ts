import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { publicReviewUrl } from "./src/lib/sourceUrls";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const discovery = path.join(root, "data", "discovery");
const phase2 = path.resolve(root, "../phase-2/data");

const DOWNLOAD_ARTEFACTS: Record<string, string> = {
  raw: "raw-reviews.json",
  normalized: "normalized-reviews.json"
};

function discoveryApi(): Plugin {
  return {
    name: "discovery-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? "/", "http://localhost");
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
  plugins: [react(), discoveryApi()],
  server: { port: 3000, host: true }
});
