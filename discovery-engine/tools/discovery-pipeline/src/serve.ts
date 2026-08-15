import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ARTEFACT_FILES, discoveryDir } from "@myntra/discovery-core";

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

  if (req.method === "GET" && url.pathname === "/api/discovery") {
    try {
      const [themes, ranking, stats] = await Promise.all([
        readFile(path.join(discoveryDir(), ARTEFACT_FILES.themes), "utf8"),
        readFile(path.join(discoveryDir(), ARTEFACT_FILES.ranking), "utf8"),
        readFile(path.join(discoveryDir(), ARTEFACT_FILES.stats), "utf8")
      ]);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          themes: JSON.parse(themes),
          ranking: JSON.parse(ranking),
          stats: JSON.parse(stats)
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
