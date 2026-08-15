import { describe, expect, it } from "vitest";
import {
  quoteGroundedInReview,
  repairQuote,
  uniqueReviewIds
} from "@myntra/discovery-core";

const review = {
  id: "r1",
  text: "I wishlisted this kurta because the size chart is confusing and I cannot tell if it will fit.",
  source: "reddit" as const,
  scrapedAt: "2026-01-01T00:00:00.000Z",
  textHash: "abc",
  wordCount: 18,
  languageHint: "en",
  wishlistRelevant: true,
  excludedFromFrequency: false
};

describe("quote grounding", () => {
  it("accepts verbatim substrings", () => {
    expect(
      quoteGroundedInReview(
        "size chart is confusing",
        review.text
      )
    ).toBe(true);
  });

  it("rejects invented quotes", () => {
    expect(quoteGroundedInReview("I hate this app", review.text)).toBe(false);
  });

  it("repairs quotes to canonical review text", () => {
    const repaired = repairQuote(
      {
        text: "size chart is confusing",
        reviewId: "r1",
        source: "reddit"
      },
      review
    );
    expect(repaired?.reviewId).toBe("r1");
    expect(repaired?.text.toLowerCase()).toContain("size chart");
  });

  it("counts distinct review ids", () => {
    expect(
      uniqueReviewIds([
        { text: "a", reviewId: "1", source: "reddit" },
        { text: "b", reviewId: "2", source: "app_store" }
      ])
    ).toBe(2);
  });
});
