import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const discovery = path.join(root, "data", "discovery");
const phase2 = path.resolve(root, "../phase-2/data");

function discoveryApi(): Plugin {
  return {
    name: "discovery-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === "/api/phase2") {
          try {
            const [matrix, nomination] = await Promise.all([
              readFile(path.join(phase2, "filled-matrix.json"), "utf8"),
              readFile(path.join(phase2, "nomination.json"), "utf8")
            ]);
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({
                matrix: JSON.parse(matrix),
                nomination: JSON.parse(nomination)
              })
            );
          } catch {
            res.statusCode = 404;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Run npm run phase2:rank first." }));
          }
          return;
        }
        if (req.url !== "/api/discovery") return next();
        try {
          const [themes, ranking, stats] = await Promise.all([
            readFile(path.join(discovery, "themes.json"), "utf8"),
            readFile(path.join(discovery, "opportunity-ranking.json"), "utf8"),
            readFile(path.join(discovery, "pipeline-stats.json"), "utf8")
          ]);
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              themes: JSON.parse(themes),
              ranking: JSON.parse(ranking),
              stats: JSON.parse(stats)
            })
          );
        } catch {
          res.statusCode = 404;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Run npm run discovery:refresh first." }));
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), discoveryApi()],
  server: { port: 3000, host: true }
});
