import { describe, expect, it } from "vitest";
import { fillMatrix } from "../src/map-matrix.ts";
import { matchScore, TEMPLATE_ROWS } from "../src/match.ts";
import { buildMetricTree } from "../src/metric-tree.ts";
import { nominate } from "../src/nominate.ts";
import type { PipelineStats, RankedTheme, Theme } from "../src/types.ts";

const stats: PipelineStats = {
  readyForPhase2: true,
  validatedThemeCount: 8,
  researchQuestionGaps: [],
  extractionMethod: "hybrid",
  rawCount: 100,
  normalizedCount: 40
};

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

const compare: RankedTheme = {
  themeId: "comparison-paralysis",
  label: "ComparisonParalysis",
  barrierType: "compare",
  metricNode: "decide",
  impactOnW2P: "high",
  nonMonetaryFeasibility: "high",
  estimatedFrequency: 0.2,
  score: 0.85,
  rank: 2,
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

const llmFit: RankedTheme = {
  themeId: "fit-and-size-uncertainty",
  label: "FitAndSizeUncertainty",
  barrierType: "fit",
  metricNode: "resolve",
  impactOnW2P: "medium",
  nonMonetaryFeasibility: "high",
  estimatedFrequency: 0.3,
  score: 0.7,
  rank: 3,
  priceFlag: false
};

const themes: Theme[] = [
  {
    id: "fit-size-anxiety",
    label: "FitSizeAnxiety",
    summary: "Fit doubt blocks purchase.",
    confidence: "medium",
    segmentHints: ["S2"],
    barrierType: "fit",
    metricNode: "resolve",
    researchQuestionIds: [2, 3, 7]
  },
  {
    id: "comparison-paralysis",
    label: "ComparisonParalysis",
    summary: "Too many similar saves.",
    confidence: "medium",
    segmentHints: ["S4"],
    barrierType: "compare",
    metricNode: "decide",
    researchQuestionIds: [5, 10]
  }
];

describe("nominate", () => {
  it("picks the top non-price theme and does not lock S2 ∩ S4 without compare evidence", () => {
    const result = nominate([fit], themes, stats);
    expect(result.themeId).toBe("fit-size-anxiety");
    expect(result.interviewSegment).toBe("S2");
    expect(result.readyForPhase3).toBe(true);
    expect(result.interviewSeeds).toHaveLength(8);
  });

  it("locks S2 ∩ S4 only when a Decide-node compare theme is present", () => {
    const result = nominate([fit, compare], themes, stats);
    expect(result.interviewSegment).toBe("S2 ∩ S4");
    expect(result.readyForPhase3).toBe(true);
  });

  it("does not nominate a price #1 theme as the MVP", () => {
    const result = nominate([price, fit], themes, stats);
    expect(result.themeId).toBe("fit-size-anxiety");
    expect(result.priceFlagged).toBe(true);
    expect(result.explicitlyNotPursuing.join(" ")).toMatch(/price/i);
  });

  it("keeps readyForPhase3 false when Phase 1 is not ready", () => {
    const result = nominate([fit], themes, { ...stats, readyForPhase2: false });
    expect(result.readyForPhase3).toBe(false);
    expect(result.caveats.join(" ")).toMatch(/readyForPhase2 is false/);
  });
});

describe("fillMatrix", () => {
  it("marks unobserved template rows and excludes sale alerts", () => {
    const rows = fillMatrix([fit], themes);
    const sale = rows.find((row) => row.opportunityArea.startsWith("Price-drop"));
    const compareRow = rows.find((row) => row.opportunityArea.includes("compare"));
    const fitRow = rows.find((row) => row.themeId === "fit-size-anxiety");
    const stock = rows.find((row) => row.opportunityArea.startsWith("Back-in-stock"));
    expect(sale?.status).toBe("excluded");
    expect(compareRow?.status).toBe("unobserved");
    expect(fitRow?.status).toBe("filled");
    expect(fitRow?.rank).toBe(1);
    expect(stock?.status).toBe("unobserved");
  });

  it("maps Groq theme ids onto the Part 2 fit row without guessing scores", () => {
    const rows = fillMatrix([llmFit], [
      { ...themes[0], id: "fit-and-size-uncertainty", label: "FitAndSizeUncertainty" }
    ]);
    const fitRow = rows.find((row) => row.opportunityArea.startsWith("Fit"));
    expect(fitRow?.status).toBe("filled");
    expect(fitRow?.themeId).toBe("fit-and-size-uncertainty");
    expect(fitRow?.impactOnW2P).toBe("medium");
    expect(fitRow?.frequency).toBe(0.3);
  });
});

describe("matchScore", () => {
  it("does not map a price theme onto a non-price template", () => {
    const fitTemplate = TEMPLATE_ROWS[0];
    expect(matchScore(fitTemplate, price)).toBe(0);
  });
});

describe("buildMetricTree", () => {
  it("covers resolve and decide from ranking and leaves act as a gap", () => {
    const tree = buildMetricTree([fit, compare], themes);
    expect(tree.nodes.find((node) => node.node === "resolve")?.covered).toBe(true);
    expect(tree.nodes.find((node) => node.node === "decide")?.covered).toBe(true);
    expect(tree.uncoveredNodes).toContain("act");
    expect(tree.product).toMatch(/revisit/);
  });
});
