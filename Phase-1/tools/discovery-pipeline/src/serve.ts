import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ARTEFACT_FILES, discoveryDir, publicReviewUrl } from "@myntra/discovery-core";

const PORT = Number(process.env.REPORT_PORT ?? 3001);

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);

  if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/report")) {
    try {
      const html = await readFile(
        path.join(discoveryDir(), ARTEFACT_FILES.report),
        "utf8"
      );
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(html);
    } catch {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Run npm run discovery:refresh first.");
    }
    return;
  }

  if (req.method === "GET" && url.pathname.startsWith("/api/discovery/download/")) {
    const kind = url.pathname.replace("/api/discovery/download/", "");
    const artefact =
      kind === "raw"
        ? ARTEFACT_FILES.raw
        : kind === "normalized"
          ? ARTEFACT_FILES.normalized
          : null;
    if (!artefact) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Unknown download type." }));
      return;
    }
    try {
      const body = await readFile(path.join(discoveryDir(), artefact), "utf8");
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${artefact}"`
      });
      res.end(body);
    } catch {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Run npm run discovery:refresh first." }));
    }
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/discovery") {
    try {
      const [themes, ranking, stats, normalized] = await Promise.all([
        readFile(path.join(discoveryDir(), ARTEFACT_FILES.themes), "utf8"),
        readFile(path.join(discoveryDir(), ARTEFACT_FILES.ranking), "utf8"),
        readFile(path.join(discoveryDir(), ARTEFACT_FILES.stats), "utf8"),
        readFile(path.join(discoveryDir(), ARTEFACT_FILES.normalized), "utf8")
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
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          themes: themeRows,
          ranking: JSON.parse(ranking),
          stats: JSON.parse(stats),
          voices
        })
      );
    } catch {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Run npm run discovery:refresh first." }));
    }
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log(`Discovery report: http://localhost:${PORT}`);
});
