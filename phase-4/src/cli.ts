import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { evaluateDecisionTree } from "./decision-tree.js";
import {
  docsDir,
  phase1DiscoveryDir,
  phase2DataDir,
  phase3SurveyDir,
  phase4DataDir
} from "./paths.js";
import { buildProblemDefinition } from "./problem.js";
import { renderPhase4Report, renderProblemSnippet } from "./report.js";
import { computeSignals } from "./signals.js";
import type {
  Nomination,
  PipelineStats,
  RankedTheme,
  SurveyResponse,
  SurveySummary,
  Theme
} from "./types.js";

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(file, "utf8")) as T;
}

async function requireFile(file: string, label: string, fix: string): Promise<void> {
  try {
    await access(file);
  } catch {
    throw new Error(`A-M01: ${label} is missing at ${file}. ${fix}`);
  }
}

async function main() {
  const discovery = phase1DiscoveryDir();
  const survey = phase3SurveyDir();
  const phase2 = phase2DataDir();
  const out = phase4DataDir();
  await mkdir(out, { recursive: true });

  const rankingPath = path.join(discovery, "opportunity-ranking.json");
  const themesPath = path.join(discovery, "themes.json");
  const statsPath = path.join(discovery, "pipeline-stats.json");
  const nominationPath = path.join(phase2, "nomination.json");
  const responsesPath = path.join(survey, "survey-responses.json");
  const summaryPath = path.join(survey, "survey-summary.json");

  const runPhase1 = "Run Phase 1 (`npm run phase1:1c`) before Phase 4.";
  const runPhase2 = "Run Phase 2 (`npm run phase2:rank`) before Phase 4.";
  const runPhase3 = "Run Phase 3 (`npm run survey --prefix Phase-1`) before Phase 4.";

  await requireFile(rankingPath, "opportunity-ranking.json", runPhase1);
  await requireFile(themesPath, "themes.json", runPhase1);
  await requireFile(statsPath, "pipeline-stats.json", runPhase1);
  await requireFile(nominationPath, "nomination.json", runPhase2);
  await requireFile(responsesPath, "survey-responses.json", runPhase3);
  await requireFile(summaryPath, "survey-summary.json", runPhase3);

  const ranking = await readJson<RankedTheme[]>(rankingPath);
  const themes = await readJson<Theme[]>(themesPath);
  const stats = await readJson<PipelineStats>(statsPath);
  const nomination = await readJson<Nomination>(nominationPath);
  const responses = await readJson<SurveyResponse[]>(responsesPath);
  const summary = await readJson<SurveySummary>(summaryPath);

  if (responses.length === 0) {
    throw new Error("A-M01: survey-responses.json is empty — Phase 4 cannot lock a problem without primary evidence.");
  }
  if (ranking.length === 0) {
    throw new Error("A-M01: opportunity-ranking.json is empty — nothing to reconcile against.");
  }

  const inputs = { ranking, themes, stats, nomination, responses, summary };
  const signals = computeSignals(responses, summary, ranking);
  const tree = evaluateDecisionTree(signals, nomination);
  const problem = buildProblemDefinition(inputs, signals, tree);

  await writeFile(path.join(out, "signals.json"), JSON.stringify(signals, null, 2));
  await writeFile(path.join(out, "decision-tree.json"), JSON.stringify(tree, null, 2));
  await writeFile(
    path.join(out, "problem-definition.json"),
    JSON.stringify(problem, null, 2)
  );
  await writeFile(
    path.join(out, "segment-contract.json"),
    JSON.stringify(problem.segmentContract, null, 2)
  );
  await writeFile(path.join(out, "segment.contract.ts"), problem.segmentContract.source);
  await writeFile(path.join(out, "report.html"), renderPhase4Report(problem, signals));
  await writeFile(
    path.join(out, "problem-definition-snippet.md"),
    renderProblemSnippet(problem, signals)
  );
  await writeFile(
    path.join(out, "phase4-stats.json"),
    JSON.stringify(
      {
        generatedAt: problem.generatedAt,
        respondents: signals.respondents,
        inSegment: signals.segment.inSegment.count,
        inSegmentTarget: signals.segment.target,
        inSegmentTargetMet: signals.segment.targetMet,
        nominationNode: nomination.metricNode,
        surveyTopNode: signals.surveyTopNode,
        forkedFromNomination: nomination.metricNode !== signals.surveyTopNode,
        outcome: tree.outcome,
        incentiveMvpAllowed: tree.incentiveMvpAllowed,
        priceHeldConstant: signals.instrument.priceHeldConstant,
        monetaryUnlocks: signals.unlockSwitch.monetary.count,
        monetaryUnlocksWhoResearch: signals.unlockSwitch.researchesAnyway.count,
        valueConfidenceDemand: signals.valueConfidence.demand.count,
        exitCriteriaMet: problem.exitCriteria.met,
        readyForPhase5: problem.readyForPhase5,
        caveatCount: problem.caveats.length
      },
      null,
      2
    )
  );

  const lock = path.join(docsDir(), "problem-definition.md");
  let lockPresent = true;
  try {
    await access(lock);
  } catch {
    lockPresent = false;
  }

  console.log(`Problem: ${problem.headline}`);
  console.log(
    `Nomination node ${nomination.metricNode} → survey node ${signals.surveyTopNode}${
      nomination.metricNode === signals.surveyTopNode ? "" : " (forked)"
    }`
  );
  console.log(
    `Unlock switch: ${signals.unlockSwitch.monetary.count} asked for a discount, ${signals.unlockSwitch.researchesAnyway.count} of them research anyway, ${signals.unlockSwitch.askedPriceJudgement.count} asked for a price verdict`
  );
  console.log(
    `In segment: ${signals.segment.inSegment.count}/${signals.respondents} (target ${signals.segment.target}) — ${signals.segment.targetMet ? "met" : "not met"}`
  );
  console.log(`Decision tree: ${tree.outcome} · incentive MVP allowed: ${tree.incentiveMvpAllowed}`);
  console.log(`readyForPhase5: ${problem.readyForPhase5} · exit criteria met: ${problem.exitCriteria.met}`);
  if (!lockPresent) {
    console.log(`note: docs/problem-definition.md is missing — paste data/problem-definition-snippet.md into it.`);
  }
  console.log(`artefacts: ${out}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
