import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fillMatrix } from "./map-matrix.js";
import { buildMetricTree } from "./metric-tree.js";
import { nominate } from "./nominate.js";
import { phase1DiscoveryDir, phase2DataDir } from "./paths.js";
import { renderPhase2Report, renderProblemstatementSnippet } from "./report.js";
import type { PipelineStats, RankedTheme, Theme } from "./types.js";

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(file, "utf8")) as T;
}

async function requireFile(file: string, label: string): Promise<void> {
  try {
    await access(file);
  } catch {
    throw new Error(
      `A-M01: ${label} is missing at ${file}. Run Phase 1 (\`npm run 1c\` or \`npm run 1d\`) before Phase 2.`
    );
  }
}

async function main() {
  const src = phase1DiscoveryDir();
  const out = phase2DataDir();
  await mkdir(out, { recursive: true });

  const rankingPath = path.join(src, "opportunity-ranking.json");
  const themesPath = path.join(src, "themes.json");
  const statsPath = path.join(src, "pipeline-stats.json");
  await requireFile(rankingPath, "opportunity-ranking.json");
  await requireFile(themesPath, "themes.json");
  await requireFile(statsPath, "pipeline-stats.json");

  const ranking = await readJson<RankedTheme[]>(rankingPath);
  const themes = await readJson<Theme[]>(themesPath);
  const stats = await readJson<PipelineStats>(statsPath);

  if (!Array.isArray(ranking) || ranking.length === 0) {
    throw new Error("A-M01: opportunity-ranking.json is empty — cannot fill the Part 2 matrix.");
  }

  const matrix = fillMatrix(ranking, themes);
  const tree = buildMetricTree(ranking, themes);
  const nomination = nominate(ranking, themes, stats);
  const generatedAt = new Date().toISOString();

  await writeFile(path.join(out, "filled-matrix.json"), JSON.stringify(matrix, null, 2));
  await writeFile(
    path.join(out, "nomination.json"),
    JSON.stringify({ ...nomination, generatedAt, phase1Ready: stats.readyForPhase2 }, null, 2)
  );
  await writeFile(path.join(out, "metric-tree.json"), JSON.stringify(tree, null, 2));
  await writeFile(
    path.join(out, "phase2-stats.json"),
    JSON.stringify(
      {
        generatedAt,
        source: src,
        extractionMethod: stats.extractionMethod,
        filledRows: matrix.filter((row) => row.status === "filled").length,
        unobservedRows: matrix.filter((row) => row.status === "unobserved").length,
        excludedRows: matrix.filter((row) => row.status === "excluded").length,
        uncoveredNodes: tree.uncoveredNodes,
        bookmarkSeparated: tree.bookmarkSeparated,
        readyForPhase3: nomination.readyForPhase3,
        phase1Ready: stats.readyForPhase2
      },
      null,
      2
    )
  );
  await writeFile(path.join(out, "report.html"), renderPhase2Report(matrix, nomination, stats, tree));
  await writeFile(
    path.join(out, "problemstatement-snippet.md"),
    renderProblemstatementSnippet(matrix, nomination)
  );

  console.log(`Highest-potential: ${nomination.highestPotentialOpportunity}`);
  console.log(`Interview segment: ${nomination.interviewSegment}`);
  console.log(`readyForPhase3: ${nomination.readyForPhase3}`);
  console.log(`matrix: ${matrix.filter((row) => row.status === "filled").length} filled · ${matrix.filter((row) => row.status === "unobserved").length} unobserved`);
  console.log(`artefacts: ${out}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
