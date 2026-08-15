import { writeFile } from "node:fs/promises";
import path from "node:path";
import {
  chunkReviews,
  discoveryDir,
  normalizeCorpus,
  type PipelineStats,
  type RawReview
} from "@myntra/discovery-core";
import { extractThemes } from "./analyze.js";
import { ARTEFACT_FILES, ensureDirs, writeJson } from "./io.js";
import { rankOpportunities } from "./rank.js";
import { renderReport } from "./report.js";
import { scrapeAll } from "./scrape/index.js";
import { researchQuestionGaps, validateThemes } from "./validate.js";

export async function runScrape(): Promise<RawReview[]> {
  await ensureDirs();
  const { reviews, results } = await scrapeAll();
  for (const result of results) {
    const extra = result.error ? ` (soft-fail: ${result.error})` : "";
    console.log(`  ${result.source}: ${result.reviews.length} reviews${extra}`);
  }
  await writeJson(ARTEFACT_FILES.raw, reviews);
  return reviews;
}

export async function runRefresh(): Promise<PipelineStats> {
  await ensureDirs();
  console.log("1/5 scrape + merge");
  const raw = await runScrape();

  console.log("2/5 normalize");
  const normalized = normalizeCorpus(raw);
  await writeJson(ARTEFACT_FILES.normalized, normalized.kept);

  console.log("3/5 chunk");
  const chunks = chunkReviews(normalized.kept);
  await writeJson(ARTEFACT_FILES.chunks, chunks);

  console.log("4/5 extract + validate");
  const { themes, method } = await extractThemes(normalized.kept, chunks);
  const { validated, results } = validateThemes(themes, normalized.kept);
  await writeJson(ARTEFACT_FILES.themes, validated);
  await writeJson(ARTEFACT_FILES.validation, results);

  console.log("5/5 rank");
  const ranking = rankOpportunities(validated);
  await writeJson(ARTEFACT_FILES.ranking, ranking);

  const sourceCoverage: Record<string, number> = {};
  for (const review of raw) {
    sourceCoverage[review.source] = (sourceCoverage[review.source] ?? 0) + 1;
  }

  const gaps = researchQuestionGaps(validated);
  const readyForPhase2 = validated.length >= 8 && gaps.length === 0;

  const stats: PipelineStats = {
    rawCount: raw.length,
    normalizedCount: normalized.kept.length,
    droppedMinWords: normalized.droppedMinWords,
    droppedIrrelevant: normalized.droppedIrrelevant,
    droppedDuplicates: normalized.droppedDuplicates,
    chunkCount: chunks.length,
    sourceCoverage,
    partialCoverage: Object.entries(sourceCoverage)
      .filter(([, count]) => count === 0)
      .map(([name]) => name),
    extractionMethod: method,
    validatedThemeCount: validated.length,
    rejectedThemeCount: results.filter((row) => !row.passed).length,
    researchQuestionGaps: gaps,
    readyForPhase2,
    generatedAt: new Date().toISOString()
  };

  await writeJson(ARTEFACT_FILES.stats, stats);
  const reportPath = path.join(discoveryDir(), ARTEFACT_FILES.report);
  await writeFile(reportPath, renderReport(validated, ranking, stats), "utf8");

  console.log(`readyForPhase2: ${stats.readyForPhase2}`);
  console.log(`artefacts: ${discoveryDir()}`);
  return stats;
}
