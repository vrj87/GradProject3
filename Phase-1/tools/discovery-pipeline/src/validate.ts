import type {
  MetricNode,
  NormalizedReview,
  Theme,
  ThemeValidationResult
} from "@myntra/discovery-core";
import {
  MONETARY_TERMS,
  quoteGroundedInReview,
  uniqueReviewIds,
  uniqueSources
} from "@myntra/discovery-core";

const SAMPLE_SIZE_CAP = 50;

export function validateThemes(
  themes: Theme[],
  reviews: NormalizedReview[]
): { validated: Theme[]; results: ThemeValidationResult[] } {
  const byId = new Map(reviews.map((review) => [review.id, review]));
  const validated: Theme[] = [];
  const results: ThemeValidationResult[] = [];
  const frequencyEligible = reviews.filter((review) => !review.excludedFromFrequency).length;
  const sampleCapped = frequencyEligible < SAMPLE_SIZE_CAP;

  for (const theme of themes) {
    const reasons: string[] = [];
    let confidence = theme.confidence;

    if (theme.quotes.length < 2) {
      reasons.push("minQuotes: need at least 2 quotes");
    }

    if (uniqueReviewIds(theme.quotes) < 2) {
      reasons.push("distinctReviews: quotes must come from at least 2 reviewIds");
    }

    const linked: typeof theme.quotes = [];
    for (const quote of theme.quotes) {
      const review = byId.get(quote.reviewId);
      if (!review) {
        reasons.push(`quoteLinkage: reviewId ${quote.reviewId} not found`);
        continue;
      }
      if (!quoteGroundedInReview(quote.text, review.text)) {
        reasons.push(`quoteGrounding: quote not found in review ${quote.reviewId}`);
        continue;
      }
      linked.push({
        ...quote,
        source: review.source,
        url: review.url ?? quote.url
      });
    }

    if (linked.length !== theme.quotes.length) {
      reasons.push("quoteLinkage: one or more quotes failed grounding");
    }

    if (uniqueSources(linked) < 2 && confidence === "high") {
      confidence = "medium";
      reasons.push("multiSource: capped confidence at medium");
    }

    if (sampleCapped && confidence === "high") {
      confidence = "medium";
      reasons.push(`sampleSize: corpus < ${SAMPLE_SIZE_CAP}; capped confidence at medium`);
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
        reason.startsWith("distinctReviews") ||
        reason.startsWith("quoteLinkage") ||
        reason.startsWith("quoteGrounding") ||
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

export function metricNodeGaps(themes: Theme[]): MetricNode[] {
  const required: MetricNode[] = ["resolve", "decide", "revisit"];
  const covered = new Set(themes.map((theme) => theme.metricNode));
  return required.filter((node) => !covered.has(node));
}

export function isSampleSizeCapped(reviews: NormalizedReview[]): boolean {
  const eligible = reviews.filter((review) => !review.excludedFromFrequency).length;
  return eligible < SAMPLE_SIZE_CAP;
}
