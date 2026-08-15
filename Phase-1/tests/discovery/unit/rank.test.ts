import { describe, expect, it } from "vitest";
import type { Theme } from "@myntra/discovery-core";
import { rankOpportunities } from "../../../tools/discovery-pipeline/src/rank.ts";

function theme(partial: Partial<Theme> & Pick<Theme, "id" | "label">): Theme {
  return {
    summary: "",
    researchQuestionIds: [1],
    barrierType: "fit",
    metricNode: "resolve",
    segmentHints: ["S2"],
    quotes: [],
    estimatedFrequency: 0.1,
    impactOnW2P: "medium",
    nonMonetaryFeasibility: "medium",
    confidence: "medium",
    actionableInsight: "A specific non-monetary intervention angle.",
    ...partial
  };
}

describe("rankOpportunities", () => {
  it("scores impact, feasibility, and frequency", () => {
    const ranked = rankOpportunities([
      theme({
        id: "a",
        label: "HighFit",
        impactOnW2P: "high",
        nonMonetaryFeasibility: "high",
        estimatedFrequency: 0.4
      }),
      theme({
        id: "b",
        label: "Price",
        barrierType: "price",
        impactOnW2P: "high",
        nonMonetaryFeasibility: "low",
        estimatedFrequency: 0.8
      })
    ]);
    expect(ranked[0].themeId).toBe("a");
    expect(ranked[1].priceFlag).toBe(true);
    expect(ranked[0].score).toBeGreaterThan(ranked[1].score);
  });
});
