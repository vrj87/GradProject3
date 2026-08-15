import type { RankedOpportunity, Theme } from "@myntra/discovery-core";

const IMPACT: Record<string, number> = { high: 1, medium: 0.6, low: 0.3 };

export function rankOpportunities(themes: Theme[]): RankedOpportunity[] {
  const scored = themes.map((theme) => {
    const score =
      0.4 * (IMPACT[theme.impactOnW2P] ?? 0) +
      0.4 * (IMPACT[theme.nonMonetaryFeasibility] ?? 0) +
      0.2 * theme.estimatedFrequency;
    return {
      themeId: theme.id,
      label: theme.label,
      barrierType: theme.barrierType,
      metricNode: theme.metricNode,
      impactOnW2P: theme.impactOnW2P,
      nonMonetaryFeasibility: theme.nonMonetaryFeasibility,
      estimatedFrequency: theme.estimatedFrequency,
      score: Number(score.toFixed(3)),
      rank: 0,
      priceFlag: theme.barrierType === "price"
    };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const impactDelta = (IMPACT[b.impactOnW2P] ?? 0) - (IMPACT[a.impactOnW2P] ?? 0);
    if (impactDelta !== 0) return impactDelta;
    return (IMPACT[b.nonMonetaryFeasibility] ?? 0) - (IMPACT[a.nonMonetaryFeasibility] ?? 0);
  });

  return scored.map((row, index) => ({ ...row, rank: index + 1 }));
}
