import type {
  NormalizedReview,
  Theme,
  ThemeValidationResult
} from "@myntra/discovery-core";
import { MONETARY_TERMS } from "@myntra/discovery-core";

export function validateThemes(
  themes: Theme[],
  reviews: NormalizedReview[]
): { validated: Theme[]; results: ThemeValidationResult[] } {
  const byId = new Map(reviews.map((review) => [review.id, review]));
  const validated: Theme[] = [];
  const results: ThemeValidationResult[] = [];

  for (const theme of themes) {
    const reasons: string[] = [];
    let confidence = theme.confidence;

    if (theme.quotes.length < 2) {
      reasons.push("minQuotes: need at least 2 quotes");
    }

    const linked = theme.quotes.filter((quote) => byId.has(quote.reviewId));
    if (linked.length !== theme.quotes.length) {
      reasons.push("quoteLinkage: one or more quotes do not resolve to a reviewId");
    }

    const sources = new Set(theme.quotes.map((quote) => quote.source));
    if (sources.size < 2 && confidence === "high") {
      confidence = "medium";
      reasons.push("multiSource: capped confidence at medium");
    }

    if (!theme.researchQuestionIds?.length) {
      reasons.push("researchMap: need at least one researchQuestionId");
    }

    if (!theme.actionableInsight || theme.actionableInsight.trim().length < 20) {
      reasons.push("actionability: insight must be at least 20 characters");
    }

    const insight = theme.actionableInsight?.toLowerCase() ?? "";
    if (MONETARY_TERMS.some((term) => insight.includes(term))) {
      reasons.push("monetary: insight proposes a discount-style intervention");
    }

    const fatal = reasons.some(
      (reason) =>
        reason.startsWith("minQuotes") ||
        reason.startsWith("quoteLinkage") ||
        reason.startsWith("researchMap") ||
        reason.startsWith("actionability") ||
        reason.startsWith("monetary")
    );

    const next: Theme = { ...theme, confidence, quotes: linked };
    results.push({
      themeId: theme.id,
      label: theme.label,
      passed: !fatal,
      confidence,
      reasons
    });
    if (!fatal) validated.push(next);
  }

  return { validated, results };
}

export function researchQuestionGaps(themes: Theme[]): number[] {
  const covered = new Set(themes.flatMap((theme) => theme.researchQuestionIds));
  return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter((id) => !covered.has(id));
}
