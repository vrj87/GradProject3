import { describe, expect, it } from "vitest";
import type { Theme } from "@myntra/discovery-core";
import { collapseNearDuplicates } from "../../../tools/discovery-pipeline/src/collapse.ts";

function theme(overrides: Partial<Theme>): Theme {
  return {
    id: "fit-size-anxiety",
    label: "FitSizeAnxiety",
    summary: "Users stall because they cannot tell if the size will fit.",
    researchQuestionIds: [2, 3],
    barrierType: "fit",
    metricNode: "resolve",
    segmentHints: ["S2"],
    quotes: [
      { text: "size chart is confusing", reviewId: "a", source: "reddit" },
      { text: "runs small", reviewId: "b", source: "app_store" }
    ],
    estimatedFrequency: 0.3,
    impactOnW2P: "high",
    nonMonetaryFeasibility: "high",
    confidence: "medium",
    actionableInsight: "Synthesize size patterns from reviews so users can resolve fit doubt.",
    ...overrides
  };
}

describe("collapseNearDuplicates", () => {
  it("merges Groq and template fit themes into one canonical id", () => {
    const collapsed = collapseNearDuplicates([
      theme({}),
      theme({
        id: "fit-and-size-uncertainty",
        label: "FitAndSizeUncertainty",
        summary: "Users are uncertain about the fit and size of products.",
        estimatedFrequency: 0.4,
        quotes: [
          { text: "perfect fit", reviewId: "c", source: "app_store" },
          { text: "great fit", reviewId: "d", source: "play_store" }
        ]
      })
    ]);
    expect(collapsed).toHaveLength(1);
    expect(collapsed[0].id).toBe("fit-size-anxiety");
    expect(collapsed[0].estimatedFrequency).toBe(0.4);
    expect(collapsed[0].mergedFrom).toContain("fit-and-size-uncertainty");
  });

  it("keeps compare and fit as separate opportunities", () => {
    const collapsed = collapseNearDuplicates([
      theme({}),
      theme({
        id: "comparison-paralysis",
        label: "ComparisonParalysis",
        summary: "Users save many similar items and cannot narrow to one choice.",
        barrierType: "compare",
        metricNode: "decide",
        researchQuestionIds: [5]
      })
    ]);
    expect(collapsed).toHaveLength(2);
  });
});
