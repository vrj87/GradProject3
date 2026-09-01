import { describe, expect, it } from "vitest";
import { findCatalogProduct } from "@/lib/catalog";
import { CompareError, buildCompareMatrix } from "@/lib/compare-engine";
import { buildFitConfidence } from "@/lib/fit-confidence";
import { hasIncentiveLanguage } from "@/lib/guardrails";
import { SYSTEM_PROMPT, availableProvider, describeProviders } from "@/lib/llm";
import { buildStyleOccasion } from "@/lib/style-occasion";
import { relevantThemes } from "@/lib/themes";
import { buildValueConfidence } from "@/lib/value-confidence";
import type { DiscoveryTheme } from "@/lib/artefacts";
import type { ProductRecord } from "@/lib/schemas";

function sku(id: string): ProductRecord {
  const product = findCatalogProduct(id);
  if (!product) throw new Error(`missing ${id}`);
  return product;
}

describe("fit confidence", () => {
  it("never promotes a SKU with fewer than three reviews above low", () => {
    const summary = buildFitConfidence(sku("p-kurta-printed"));
    expect(sku("p-kurta-printed").reviews.length).toBeLessThan(3);
    expect(summary.confidenceBand).toBe("low");
    expect(summary.keySignals.join(" ")).toMatch(/too thin to call/);
    expect(summary.disclaimer).toMatch(/not a guarantee/);
    expect(summary.evidenceReviewIds.length).toBeGreaterThan(0);
  });

  it("reads a consistent true-to-size set as high confidence", () => {
    const summary = buildFitConfidence(sku("p-kurta-straight"));
    expect(summary.confidenceBand).toBe("high");
    expect(summary.sizePattern).toMatch(/True to size/i);
  });

  it("flags a size-chart conflict when reviews run small", () => {
    const summary = buildFitConfidence(sku("p-kurta-anarkali"));
    expect(summary.sizePattern).toMatch(/Runs small/i);
    expect(summary.returnRiskFlags.join(" ")).toMatch(/size chart and the reviews disagree/i);
  });

  it("never emits incentive language", () => {
    for (const id of ["p-kurta-anarkali", "p-kurta-printed", "p-sneaker-white"]) {
      expect(hasIncentiveLanguage(JSON.stringify(buildFitConfidence(sku(id))))).toBe(false);
    }
  });
});

describe("style / occasion", () => {
  it("names occasions reviewers actually wore", () => {
    const summary = buildStyleOccasion(sku("p-kurta-straight"));
    expect(summary.occasionFit.some((row) => /office|everyday/i.test(row.occasion))).toBe(true);
    expect(summary.evidenceReviewIds.length).toBeGreaterThan(0);
  });
});

describe("value confidence", () => {
  it("answers worth with cost-per-wear, never with a falling price", () => {
    const value = buildValueConfidence({
      product: sku("p-kurta-chikankari"),
      peers: [sku("p-kurta-anarkali"), sku("p-kurta-straight")]
    });
    expect(value.costPerWearInr).toBeGreaterThan(0);
    expect(value.wearsAssumed).toBeGreaterThan(0);
    expect(value.peerContext.comparedWith).toBe(2);
    expect(hasIncentiveLanguage(JSON.stringify(value))).toBe(false);
    expect(value.disclaimer).toMatch(/not a prediction about the price changing/);
  });

  it("uses the shopper's own occasion count when they give one", () => {
    const value = buildValueConfidence({
      product: sku("p-kurta-silk"),
      occasionsPerMonth: 1
    });
    expect(value.wearsAssumed).toBe(12);
    expect(value.wearBasis).toMatch(/your own estimate/);
  });
});

describe("compare matrix", () => {
  it("scores two or three same-category items and states what would flip the call", () => {
    const matrix = buildCompareMatrix({
      products: [sku("p-kurta-straight"), sku("p-kurta-printed"), sku("p-kurta-chikankari")],
      themeIds: ["comparison-paralysis"]
    });
    expect(matrix.itemIds).toHaveLength(3);
    expect(matrix.dimensions.length).toBeGreaterThanOrEqual(4);
    expect(matrix.recommendation.itemId).toBeTruthy();
    expect(matrix.recommendation.wouldChangeIf.length).toBeGreaterThan(10);
    expect(matrix.evidenceThemeIds).toContain("comparison-paralysis");
    expect(hasIncentiveLanguage(JSON.stringify(matrix))).toBe(false);
  });

  it("refuses a mixed-category compare and more than three items", () => {
    expect(() =>
      buildCompareMatrix({ products: [sku("p-kurta-straight"), sku("p-sneaker-white")] })
    ).toThrow(CompareError);
    expect(() =>
      buildCompareMatrix({
        products: [
          sku("p-kurta-straight"),
          sku("p-kurta-printed"),
          sku("p-kurta-chikankari"),
          sku("p-kurta-festive")
        ]
      })
    ).toThrow(/two or three/);
  });
});

describe("LLM ladder", () => {
  it("forbids discounts in the system prompt the provider actually sees", () => {
    expect(SYSTEM_PROMPT).toMatch(/MUST NOT offer discounts/);
    expect(SYSTEM_PROMPT).toMatch(/confidence bands/);
  });

  it("falls to the rule-based coach when no key is set", () => {
    expect(availableProvider({})).toBeNull();
    expect(describeProviders({}).active).toBe("rule-based");
    expect(availableProvider({ GROQ_API_KEY: "gsk_test" })?.provider).toBe("groq");
  });
});

describe("theme RAG", () => {
  it("drops price-flagged themes before they can reach a prompt", () => {
    const themes: DiscoveryTheme[] = [
      { id: "price-waiting", label: "PriceWaiting", summary: "Wait for EOSS", barrierType: "price", metricNode: "decide", segmentHints: ["S3"] },
      { id: "comparison-paralysis", label: "ComparisonParalysis", summary: "Cannot pick", barrierType: "compare", metricNode: "decide", segmentHints: ["S4"] },
      { id: "fit-size-anxiety", label: "FitSizeAnxiety", summary: "Size doubt", barrierType: "fit", metricNode: "resolve", segmentHints: ["S2"] }
    ];
    const kept = relevantThemes(themes).map((theme) => theme.id);
    expect(kept).toEqual(["comparison-paralysis", "fit-size-anxiety"]);
  });
});
