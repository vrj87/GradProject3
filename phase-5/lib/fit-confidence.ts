import { FIT_DISCLAIMER } from "./guardrails";
import {
  averageRating,
  synthesizeFit,
  synthesizeQuality,
  type FitSynthesis
} from "./review-synthesizer";
import {
  FitConfidenceSummarySchema,
  type ConfidenceBand,
  type FitConfidenceSummary,
  type ProductRecord
} from "./schemas";

const MIN_REVIEWS_FOR_CONFIDENCE = 3;

function band(reviewCount: number, fit: FitSynthesis): ConfidenceBand {
  // 5c guardrail: fewer than three reviews can never produce a confident read.
  if (reviewCount < MIN_REVIEWS_FOR_CONFIDENCE || fit.hintedCount === 0) return "low";
  if (fit.hintedCount >= 3 && fit.agreement >= 0.7) return "high";
  if (fit.agreement >= 0.5) return "moderate";
  return "low";
}

function pattern(fit: FitSynthesis, reviewCount: number): string {
  const share = `${fit.counts[fit.dominant]} of ${fit.hintedCount}`;
  switch (fit.dominant) {
    case "runs_small":
      return `Runs small — ${share} shoppers who mentioned sizing said to go one size up.`;
    case "runs_large":
      return `Runs large — ${share} shoppers who mentioned sizing said to size down.`;
    case "true_to_size":
      return `True to size — ${share} shoppers who mentioned sizing matched the chart.`;
    default:
      return reviewCount === 0
        ? "No reviews mention sizing yet, so there is nothing to read."
        : "Nobody has described the sizing yet, so treat the size chart as the only guide.";
  }
}

function sizeChartConflict(product: ProductRecord, fit: FitSynthesis): string | null {
  if (!product.sizeChartText) return null;
  if (fit.dominant === "runs_small" || fit.dominant === "runs_large") {
    return `The size chart and the reviews disagree: the chart says ${product.sizeChartText}, but shoppers report it ${fit.dominant === "runs_small" ? "smaller" : "larger"} than that.`;
  }
  return null;
}

export function buildFitConfidence(product: ProductRecord): FitConfidenceSummary {
  const reviews = product.reviews;
  const fit = synthesizeFit(reviews);
  const quality = synthesizeQuality(reviews);
  const confidenceBand = band(reviews.length, fit);
  const rating = averageRating(reviews);

  const keySignals: string[] = [pattern(fit, reviews.length)];
  if (rating !== null) {
    keySignals.push(`Average rating ${rating} across ${reviews.length} reviews.`);
  }
  if (reviews.length < MIN_REVIEWS_FOR_CONFIDENCE) {
    keySignals.push(
      `Only ${reviews.length} review${reviews.length === 1 ? "" : "s"} exist, which is too thin to call — treated as low confidence by rule.`
    );
  }
  const comfort = quality.find((signal) => signal.kind === "comfort");
  if (comfort) {
    keySignals.push(
      `${comfort.sentiment === "positive" ? "Comfort reads well" : "Comfort complaint"}: ${comfort.note}`
    );
  }

  const returnRiskFlags: string[] = [];
  const conflict = sizeChartConflict(product, fit);
  if (conflict) returnRiskFlags.push(conflict);
  if (fit.dominant === "runs_small" || fit.dominant === "runs_large") {
    returnRiskFlags.push(
      `Ordering your usual size carries exchange risk — ${fit.counts[fit.dominant]} shoppers had to change size.`
    );
  }
  for (const signal of quality.filter((item) => item.sentiment === "negative")) {
    returnRiskFlags.push(`${signal.kind} complaint: ${signal.note}`);
  }
  if (confidenceBand === "low" && returnRiskFlags.length === 0) {
    returnRiskFlags.push("Not enough evidence to estimate return risk either way.");
  }

  const evidenceReviewIds = [
    ...new Set([...fit.evidenceIds, ...quality.map((signal) => signal.reviewId)])
  ];

  return FitConfidenceSummarySchema.parse({
    productId: product.id,
    confidenceBand,
    sizePattern: pattern(fit, reviews.length),
    keySignals,
    bodyTypeNotes: fit.bodyTypeNotes,
    returnRiskFlags,
    evidenceReviewIds,
    disclaimer: FIT_DISCLAIMER
  });
}

/** Suggested size relative to the shopper's usual, phrased as a nudge not a promise. */
export function sizeAdvice(summary: FitConfidenceSummary): string {
  if (summary.confidenceBand === "low") return "Stay with your usual size; the evidence is too thin to advise a change.";
  if (/runs small/i.test(summary.sizePattern)) return "Most shoppers went one size up from their usual.";
  if (/runs large/i.test(summary.sizePattern)) return "Most shoppers went one size down from their usual.";
  return "Your usual size is what most shoppers kept.";
}
