import type { Nomination, PipelineStats, RankedTheme, Theme } from "./types.js";

export function nominate(
  ranking: RankedTheme[],
  themes: Theme[],
  stats: PipelineStats
): Nomination {
  const priceTop = ranking.some((row) => row.rank === 1 && row.priceFlag);
  const eligible = ranking.filter(
    (row) => !row.priceFlag && row.nonMonetaryFeasibility !== "low"
  );
  const winner = eligible[0] ?? null;
  const theme = winner
    ? themes.find((item) => item.id === winner.themeId)
    : undefined;

  const nodes = new Set(eligible.slice(0, 3).map((row) => row.metricNode));
  const hints = new Set(eligible.slice(0, 3).flatMap((row) => {
    const match = themes.find((item) => item.id === row.themeId);
    return match?.segmentHints ?? [];
  }));

  const hasFit = winner?.barrierType === "fit" || hints.has("S2");
  const hasCompare = nodes.has("decide") || hints.has("S4");

  let interviewSegment = "TBD — insufficient non-price themes";
  let segmentRationale =
    "No eligible non-monetary theme ranked. Do not default to S2 ∩ S4.";

  if (winner && hasFit && hasCompare) {
    interviewSegment = "S2 ∩ S4";
    segmentRationale =
      "Top non-price themes include both Resolve (fit) and Decide (compare).";
  } else if (winner && hasFit) {
    interviewSegment = "S2";
    segmentRationale =
      "Ranking supports fit-anxious stallers (S2). Compare/S4 is not evidenced — do not lock S2 ∩ S4.";
  } else if (winner && hasCompare) {
    interviewSegment = "S4";
    segmentRationale =
      "Ranking supports overloaded comparers (S4). Fit/S2 is not in the top eligible set.";
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
  for (const row of ranking.filter((item) => item.priceFlag)) {
    notPursuing.push(`${row.label} (price-flagged, rank ${row.rank})`);
  }

  const caveats: string[] = [];
  if (!stats.readyForPhase2) {
    caveats.push(
      `Phase 1 readyForPhase2 is false (${stats.validatedThemeCount} themes; Q gaps: ${stats.researchQuestionGaps.join(", ") || "none"}). Nomination is provisional.`
    );
  }
  if (!hasCompare) {
    caveats.push(
      "Decide-node / comparison paralysis was not observed in Phase 1 ranking. Probe in interviews; do not claim compare MVP is validated."
    );
  }

  return {
    highestPotentialOpportunity: winner
      ? `${winner.label} → ${winner.metricNode}`
      : "None — no eligible non-monetary theme",
    themeId: winner?.themeId ?? null,
    metricNode: winner?.metricNode ?? null,
    interviewSegment,
    segmentRationale,
    explicitlyNotPursuing: [...new Set(notPursuing)],
    priceFlagged: priceTop,
    caveats,
    readyForPhase3: Boolean(winner) && stats.readyForPhase2
  };
}
