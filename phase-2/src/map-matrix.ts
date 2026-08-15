import { evidenceLabel, supportingMatches, TEMPLATE_ROWS, bestMatch } from "./match.js";
import type { MatrixRow, RankedTheme, Theme } from "./types.js";

export { TEMPLATE_ROWS };

export function fillMatrix(ranking: RankedTheme[], themes: Theme[]): MatrixRow[] {
  const themeById = new Map(themes.map((theme) => [theme.id, theme]));
  const used = new Set<string>();
  const rows: MatrixRow[] = [];

  for (const template of TEMPLATE_ROWS) {
    if (template.excluded) {
      const extras = ranking.filter((row) => row.priceFlag || row.barrierType === "price");
      extras.forEach((row) => used.add(row.themeId));
      rows.push({
        opportunityArea: template.opportunityArea,
        themeId: extras[0]?.themeId ?? null,
        supportingThemeIds: extras.slice(1).map((row) => row.themeId),
        impactOnW2P: "—",
        feasibility: "Excluded (monetary)",
        evidenceStrength: "—",
        frequency: "—",
        score: "—",
        metricNode: template.metricNode,
        rank: "Exclude",
        status: "excluded",
        matchReason: "Assignment constraint — no coupons, cashback, or price-drop alerts"
      });
      continue;
    }

    const match = bestMatch(template, ranking, used);
    if (!match) {
      rows.push({
        opportunityArea: template.opportunityArea,
        themeId: template.themeIds[0] ?? null,
        supportingThemeIds: [],
        impactOnW2P: "unobserved",
        feasibility: "unobserved",
        evidenceStrength: "none — not in Phase 1 ranking",
        frequency: "—",
        score: "—",
        metricNode: template.metricNode,
        rank: "—",
        status: "unobserved",
        matchReason: "No Phase 1 theme mapped — cell left empty, not guessed"
      });
      continue;
    }

    used.add(match.theme.themeId);
    const support = supportingMatches(template, ranking, match.theme.themeId);
    support.forEach((row) => used.add(row.themeId));
    const theme = themeById.get(match.theme.themeId);

    rows.push({
      opportunityArea: template.opportunityArea,
      themeId: match.theme.themeId,
      supportingThemeIds: support.map((row) => row.themeId),
      impactOnW2P: match.theme.impactOnW2P,
      feasibility: match.theme.nonMonetaryFeasibility,
      evidenceStrength: evidenceLabel(theme),
      frequency: match.theme.estimatedFrequency,
      score: match.theme.score,
      metricNode: match.theme.metricNode,
      rank: match.theme.rank,
      status: "filled",
      matchReason:
        match.score >= 100
          ? `Exact theme id ${match.theme.themeId}`
          : `Mapped ${match.theme.themeId} (match ${match.score})`
    });
  }

  for (const extra of ranking) {
    if (used.has(extra.themeId)) continue;
    const theme = themeById.get(extra.themeId);
    rows.push({
      opportunityArea: extra.label,
      themeId: extra.themeId,
      supportingThemeIds: [],
      impactOnW2P: extra.impactOnW2P,
      feasibility: extra.priceFlag
        ? "Excluded if incentive-led"
        : extra.nonMonetaryFeasibility,
      evidenceStrength: evidenceLabel(theme),
      frequency: extra.estimatedFrequency,
      score: extra.score,
      metricNode: extra.metricNode,
      rank: extra.rank,
      status: extra.priceFlag ? "excluded" : "filled",
      matchReason: "Additional engine theme — not in the Part 2 template"
    });
  }

  return rows;
}
