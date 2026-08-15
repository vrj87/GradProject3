import { isPriceTheme } from "./match.js";
import type { InterviewSeed, Nomination, PipelineStats, RankedTheme, Theme } from "./types.js";

const BRIEF_QUESTIONS: Array<{ id: number; prompt: string; researchQuestionIds: number[] }> = [
  { id: 1, prompt: "Why did you save each item?", researchQuestionIds: [1, 8] },
  { id: 2, prompt: "Do you still intend to buy it? What changed?", researchQuestionIds: [8, 9] },
  {
    id: 3,
    prompt: "What is stopping you this week even if the price stayed the same?",
    researchQuestionIds: [2, 4]
  },
  {
    id: 4,
    prompt: "What would need to be true to purchase without waiting for a sale?",
    researchQuestionIds: [2, 3, 7]
  },
  { id: 5, prompt: "What information are you still missing?", researchQuestionIds: [3, 6, 7] },
  {
    id: 6,
    prompt: "Are you considering alternatives — on Myntra or elsewhere?",
    researchQuestionIds: [5, 6]
  },
  {
    id: 7,
    prompt: "What did you do outside the app before deciding?",
    researchQuestionIds: [6, 7]
  },
  {
    id: 8,
    prompt: "How do you compare multiple wishlisted items today?",
    researchQuestionIds: [5, 10]
  }
];

function eligibleThemes(ranking: RankedTheme[]): RankedTheme[] {
  return ranking
    .filter(
      (row) =>
        !isPriceTheme(row) &&
        row.nonMonetaryFeasibility !== "low"
    )
    .sort((a, b) => a.rank - b.rank);
}

function hasCompareEvidence(eligible: RankedTheme[]): boolean {
  return eligible.some(
    (row) => row.metricNode === "decide" && row.barrierType === "compare"
  );
}

function hasFitEvidence(eligible: RankedTheme[], winner: RankedTheme | null): boolean {
  if (winner?.barrierType === "fit" || winner?.metricNode === "resolve") {
    if (winner.barrierType === "fit") return true;
  }
  return eligible.some((row) => row.barrierType === "fit");
}

function interviewSeeds(themes: Theme[], winner: RankedTheme | null): InterviewSeed[] {
  return BRIEF_QUESTIONS.map((question) => {
    const linked = themes.filter(
      (theme) =>
        theme.barrierType !== "price" &&
        (theme.researchQuestionIds ?? []).some((id) => question.researchQuestionIds.includes(id))
    );
    const ids = linked.map((theme) => theme.id);
    if (winner && !ids.includes(winner.themeId)) {
      ids.unshift(winner.themeId);
    }
    return {
      briefQuestion: question.id,
      prompt: question.prompt,
      linkedThemeIds: [...new Set(ids)].slice(0, 4),
      researchQuestionIds: question.researchQuestionIds
    };
  });
}

export function nominate(
  ranking: RankedTheme[],
  themes: Theme[],
  stats: PipelineStats
): Nomination {
  const priceTop = ranking.some((row) => row.rank === 1 && isPriceTheme(row));
  const eligible = eligibleThemes(ranking);
  const winner = eligible[0] ?? null;
  const theme = winner ? themes.find((item) => item.id === winner.themeId) : undefined;

  const fit = hasFitEvidence(eligible, winner);
  const compare = hasCompareEvidence(eligible);

  let interviewSegment = "TBD — insufficient non-price themes";
  let segmentRationale =
    "No eligible non-monetary theme ranked. Do not default to S2 ∩ S4.";

  if (winner && fit && compare) {
    interviewSegment = "S2 ∩ S4";
    segmentRationale =
      "Top non-price themes include both Resolve (fit) and Decide (compare). Recruit S2 ∩ S4; do not lock P1 until Phase 4.";
  } else if (winner && fit) {
    interviewSegment = "S2";
    segmentRationale =
      "Ranking supports fit-anxious stallers (S2). Compare/S4 is not evidenced — do not lock S2 ∩ S4.";
  } else if (winner && compare) {
    interviewSegment = "S4";
    segmentRationale =
      "Ranking supports overloaded comparers (S4). Fit/S2 is not in the eligible set.";
  } else if (winner) {
    interviewSegment = theme?.segmentHints.join(" / ") || "From theme segmentHints";
    segmentRationale = `Nominated from ${winner.label} (${winner.metricNode}).`;
  }

  const notPursuing = [
    "Price-drop / sale alerts (monetary — excluded by assignment constraint)"
  ];
  if (priceTop) {
    notPursuing.unshift(
      "Do not treat a #1 price theme as the MVP — flag only, no incentive solution"
    );
  }
  for (const row of ranking.filter((item) => isPriceTheme(item))) {
    notPursuing.push(`${row.label} (price-flagged, rank ${row.rank})`);
  }

  const caveats: string[] = [];
  if (!stats.readyForPhase2) {
    caveats.push(
      `Phase 1 readyForPhase2 is false (${stats.validatedThemeCount} themes; Q gaps: ${stats.researchQuestionGaps.join(", ") || "none"}). Nomination is provisional.`
    );
  }
  if (!compare) {
    caveats.push(
      "Decide-node / comparison paralysis was not observed in Phase 1 ranking. Probe in interviews; do not claim compare MVP is validated."
    );
  }
  if (stats.metricNodeGaps?.length) {
    caveats.push(`Phase 1 metric node gaps: ${stats.metricNodeGaps.join(", ")}.`);
  }
  if (!winner) {
    caveats.push("No non-monetary theme passed eligibility — do not invent a nomination.");
  }

  const supportingThemeIds = eligible
    .slice(1, 4)
    .filter((row) => row.metricNode === winner?.metricNode || row.barrierType === winner?.barrierType)
    .map((row) => row.themeId);

  const subMetricsMoved: string[] = [];
  if (winner?.metricNode === "resolve") {
    subMetricsMoved.push("Uncertainty resolution rate", "Cart-add rate (from wishlist)");
  }
  if (winner?.metricNode === "decide" || compare) {
    subMetricsMoved.push("Shortlist-to-decision rate");
  }
  if (winner?.metricNode === "revisit") {
    subMetricsMoved.push("Revisit rate (30d)", "Time-to-first revisit");
  }
  subMetricsMoved.push("Active intent rate vs bookmark");

  return {
    highestPotentialOpportunity: winner
      ? `${winner.label} → ${winner.metricNode}`
      : "None — no eligible non-monetary theme",
    themeId: winner?.themeId ?? null,
    metricNode: winner?.metricNode ?? null,
    score: winner?.score ?? null,
    interviewSegment,
    segmentRationale,
    supportingThemeIds,
    subMetricsMoved: [...new Set(subMetricsMoved)],
    explicitlyNotPursuing: [...new Set(notPursuing)],
    priceFlagged: priceTop,
    caveats,
    interviewSeeds: interviewSeeds(themes, winner),
    readyForPhase3: Boolean(winner) && stats.readyForPhase2
  };
}
