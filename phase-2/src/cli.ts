import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fillMatrix } from "./map-matrix.js";
import { nominate } from "./nominate.js";
import { phase1DiscoveryDir, phase2DataDir } from "./paths.js";
import { renderPhase2Report } from "./report.js";
import type { PipelineStats, RankedTheme, Theme } from "./types.js";

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(file, "utf8")) as T;
}

async function main() {
  const src = phase1DiscoveryDir();
  const out = phase2DataDir();
  await mkdir(out, { recursive: true });

  const ranking = await readJson<RankedTheme[]>(
    path.join(src, "opportunity-ranking.json")
  );
  const themes = await readJson<Theme[]>(path.join(src, "themes.json"));
  const stats = await readJson<PipelineStats>(path.join(src, "pipeline-stats.json"));

  const matrix = fillMatrix(ranking, themes);
  const nomination = nominate(ranking, themes, stats);
  const generatedAt = new Date().toISOString();

  await writeFile(path.join(out, "filled-matrix.json"), JSON.stringify(matrix, null, 2));
  await writeFile(
    path.join(out, "nomination.json"),
    JSON.stringify({ ...nomination, generatedAt, phase1Ready: stats.readyForPhase2 }, null, 2)
  );
  await writeFile(
    path.join(out, "phase2-stats.json"),
    JSON.stringify(
      {
        generatedAt,
        source: src,
        filledRows: matrix.filter((row) => row.status === "filled").length,
        unobservedRows: matrix.filter((row) => row.status === "unobserved").length,
        readyForPhase3: nomination.readyForPhase3
      },
      null,
      2
    )
  );
  await writeFile(path.join(out, "report.html"), renderPhase2Report(matrix, nomination, stats));

  console.log(`Highest-potential: ${nomination.highestPotentialOpportunity}`);
  console.log(`Interview segment: ${nomination.interviewSegment}`);
  console.log(`readyForPhase3: ${nomination.readyForPhase3}`);
  console.log(`artefacts: ${out}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
