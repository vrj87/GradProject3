import { describe, expect, it } from "vitest";
import type { NormalizedReview, Theme } from "@myntra/discovery-core";
import { validateThemes } from "../../../tools/discovery-pipeline/src/validate.ts";

const review: NormalizedReview = {
  id: "r1",
  text: "I wishlisted this because I cannot tell if the size will fit.",
  source: "reddit",
  scrapedAt: "2026-01-01T00:00:00.000Z",
  textHash: "abc",
  wordCount: 14,
  languageHint: "en",
  wishlistRelevant: true,
  excludedFromFrequency: false
};

const review2: NormalizedReview = { ...review, id: "r2" };

function theme(overrides: Partial<Theme> = {}): Theme {
  return {
    id: "fit-size-anxiety",
    label: "FitSizeAnxiety",
    summary: "Fit doubt blocks purchase.",
    researchQuestionIds: [2, 3],
    barrierType: "fit",
    metricNode: "resolve",
    segmentHints: ["S2"],
    quotes: [
      { text: review.text, reviewId: "r1", source: "reddit" },
      { text: review2.text, reviewId: "r2", source: "app_store" }
    ],
    estimatedFrequency: 0.2,
    impactOnW2P: "high",
    nonMonetaryFeasibility: "high",
    confidence: "high",
    actionableInsight:
      "Synthesize size patterns from reviews so users can resolve fit doubt.",
    ...overrides
  };
}

describe("validateThemes", () => {
  it("accepts quote-linked themes with a non-monetary insight", () => {
    const { validated, results } = validateThemes([theme()], [review, review2]);
    expect(validated).toHaveLength(1);
    expect(results[0].passed).toBe(true);
  });

  it("rejects invented reviewIds", () => {
    const { validated } = validateThemes(
      [theme({ quotes: [{ text: "nope", reviewId: "missing", source: "reddit" }] })],
      [review]
    );
    expect(validated).toHaveLength(0);
  });

  it("rejects monetary insights", () => {
    const { validated } = validateThemes(
      [
        theme({
          actionableInsight: "Send a coupon and cashback so they buy from the wishlist."
        })
      ],
      [review, review2]
    );
    expect(validated).toHaveLength(0);
  });

  it("caps high confidence when all quotes share one source", () => {
    const { validated } = validateThemes(
      [
        theme({
          quotes: [
            { text: review.text, reviewId: "r1", source: "reddit" },
            { text: review2.text, reviewId: "r2", source: "reddit" }
          ]
        })
      ],
      [review, review2]
    );
    expect(validated[0].confidence).toBe("medium");
  });
});
