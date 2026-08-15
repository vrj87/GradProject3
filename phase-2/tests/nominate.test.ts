import { describe, expect, it } from "vitest";
import { fillMatrix } from "../src/map-matrix.ts";
import { nominate } from "../src/nominate.ts";
import type { RankedTheme, Theme } from "../src/types.ts";

const fit: RankedTheme = {
  themeId: "fit-size-anxiety",
  label: "FitSizeAnxiety",
  barrierType: "fit",
  metricNode: "resolve",
  impactOnW2P: "high",
  nonMonetaryFeasibility: "high",
  estimatedFrequency: 0.4,
  score: 0.9,
  rank: 1,
  priceFlag: false
};

const price: RankedTheme = {
  themeId: "sale-waitlist",
  label: "WishlistAsSaleWaitlist",
  barrierType: "price",
  metricNode: "revisit",
  impactOnW2P: "high",
  nonMonetaryFeasibility: "low",
  estimatedFrequency: 0.8,
  score: 0.95,
  rank: 1,
  priceFlag: true
};

const themes: Theme[] = [
  {
    id: "fit-size-anxiety",
    label: "FitSizeAnxiety",
    summary: "",
    confidence: "medium",
    segmentHints: ["S2"],
    barrierType: "fit",
    metricNode: "resolve"
  }
];

describe("nominate", () => {
  it("picks the top non-price theme and does not lock S2 ∩ S4 without compare evidence", () => {
    const result = nominate(
      [fit],
      themes,
      { readyForPhase2: true, validatedThemeCount: 8, researchQuestionGaps: [], extractionMethod: "rule-based", rawCount: 10, normalizedCount: 8 }
    );
    expect(result.themeId).toBe("fit-size-anxiety");
    expect(result.interviewSegment).toBe("S2");
    expect(result.readyForPhase3).toBe(true);
  });

  it("does not nominate a price #1 theme as the MVP", () => {
    const result = nominate(
      [price, fit],
      themes,
      { readyForPhase2: true, validatedThemeCount: 8, researchQuestionGaps: [], extractionMethod: "rule-based", rawCount: 10, normalizedCount: 8 }
    );
    expect(result.themeId).toBe("fit-size-anxiety");
    expect(result.priceFlagged).toBe(true);
    expect(result.explicitlyNotPursuing.join(" ")).toMatch(/price/i);
  });
});

describe("fillMatrix", () => {
  it("marks unobserved template rows and excludes sale alerts", () => {
    const rows = fillMatrix([fit], themes);
    const sale = rows.find((row) => row.opportunityArea.startsWith("Price-drop"));
    const compare = rows.find((row) => row.opportunityArea.includes("compare"));
    const fitRow = rows.find((row) => row.themeId === "fit-size-anxiety");
    expect(sale?.status).toBe("excluded");
    expect(compare?.status).toBe("unobserved");
    expect(fitRow?.status).toBe("filled");
    expect(fitRow?.rank).toBe(1);
  });
});
