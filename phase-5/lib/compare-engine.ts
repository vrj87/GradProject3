import { buildFitConfidence } from "./fit-confidence";
import { inr } from "./format";
import { synthesizeQuality } from "./review-synthesizer";
import { occasionBreadth } from "./style-occasion";
import { buildValueConfidence } from "./value-confidence";
import { CompareMatrixSchema, type CompareMatrix, type ProductRecord } from "./schemas";

/**
 * The primary job from the Phase 4 lock: finish the decision on a shortlist.
 * Two or three items from one category, scored on the dimensions the research
 * says shoppers are actually stuck on, with a recommendation that states what
 * would flip it.
 */

export class CompareError extends Error {}

const WEIGHTS: Record<string, number> = {
  "Fit certainty": 1.2,
  "Cost per wear": 1.3,
  "Quality evidence": 1.0,
  "Occasion range": 1.0,
  "Review depth": 0.5
};

function clamp(value: number): number {
  return Math.max(0, Math.min(5, Number(value.toFixed(2))));
}

function fitScore(product: ProductRecord): { score: number; rationale: string } {
  const fit = buildFitConfidence(product);
  const score = { high: 5, moderate: 3, low: 1 }[fit.confidenceBand];
  return {
    score,
    rationale: `${fit.confidenceBand} confidence — ${fit.sizePattern}`
  };
}

function qualityScore(product: ProductRecord): { score: number; rationale: string } {
  const signals = synthesizeQuality(product.reviews);
  const positive = signals.filter((signal) => signal.sentiment === "positive").length;
  const negative = signals.filter((signal) => signal.sentiment === "negative").length;
  if (signals.length === 0) {
    return { score: 2, rationale: "No durability or fabric comment either way." };
  }
  const score = clamp(2.5 + (positive - negative) * 0.9);
  return {
    score,
    rationale: `${positive} positive and ${negative} negative quality mention${positive + negative === 1 ? "" : "s"} in the reviews.`
  };
}

function occasionScore(product: ProductRecord): { score: number; rationale: string } {
  const breadth = occasionBreadth(product);
  const score = clamp(breadth.types * 1.4 + (breadth.everyday ? 1 : 0));
  const named = breadth.occasions.slice(0, 3).map((signal) => signal.occasion).join(", ");
  return {
    score,
    rationale:
      breadth.types === 0
        ? "No reviewer says where they wore it."
        : `Worn for ${named}${breadth.everyday ? ", including everyday use" : ", occasion only"}.`
  };
}

function perWear(product: ProductRecord, peers: ProductRecord[]): number {
  return buildValueConfidence({ product, peers }).costPerWearInr;
}

function costScore(
  product: ProductRecord,
  all: ProductRecord[]
): { score: number; rationale: string; perWear: number } {
  const peers = all.filter((item) => item.id !== product.id);
  const mine = perWear(product, peers);
  const values = all.map((item) => perWear(item, all.filter((other) => other.id !== item.id)));
  const best = Math.min(...values);
  const worst = Math.max(...values);
  const score = worst === best ? 3 : clamp(5 - ((mine - best) / (worst - best)) * 4);
  return {
    score,
    perWear: mine,
    rationale: `About ${inr(mine)} a wear${mine === best ? " — the lowest per-wear cost of the set." : `, against ${inr(best)} for the best of the set.`}`
  };
}

function depthScore(product: ProductRecord): { score: number; rationale: string } {
  const count = product.reviews.length;
  return {
    score: clamp(count * 0.9),
    rationale: `${count} review${count === 1 ? "" : "s"} to read from.`
  };
}

export function buildCompareMatrix(input: {
  products: ProductRecord[];
  themeIds?: string[];
}): CompareMatrix {
  const { products, themeIds = [] } = input;

  if (products.length < 2 || products.length > 3) {
    throw new CompareError("Compare needs two or three items — more than three is the overload the research warns about.");
  }
  const categories = new Set(products.map((product) => product.category));
  if (categories.size > 1) {
    throw new CompareError(
      `Compare only runs inside one category, received: ${[...categories].join(", ")}.`
    );
  }

  const perProduct = products.map((product) => ({
    product,
    fit: fitScore(product),
    quality: qualityScore(product),
    occasion: occasionScore(product),
    cost: costScore(product, products),
    depth: depthScore(product)
  }));

  const dimensions = [
    {
      name: "Fit certainty",
      scores: perProduct.map((row) => ({
        itemId: row.product.id,
        score: row.fit.score,
        rationale: row.fit.rationale
      }))
    },
    {
      name: "Cost per wear",
      scores: perProduct.map((row) => ({
        itemId: row.product.id,
        score: row.cost.score,
        rationale: row.cost.rationale
      }))
    },
    {
      name: "Quality evidence",
      scores: perProduct.map((row) => ({
        itemId: row.product.id,
        score: row.quality.score,
        rationale: row.quality.rationale
      }))
    },
    {
      name: "Occasion range",
      scores: perProduct.map((row) => ({
        itemId: row.product.id,
        score: row.occasion.score,
        rationale: row.occasion.rationale
      }))
    },
    {
      name: "Review depth",
      scores: perProduct.map((row) => ({
        itemId: row.product.id,
        score: row.depth.score,
        rationale: row.depth.rationale
      }))
    }
  ];

  const totals = perProduct
    .map((row) => {
      const total = dimensions.reduce((sum, dimension) => {
        const score = dimension.scores.find((entry) => entry.itemId === row.product.id)?.score ?? 0;
        return sum + score * (WEIGHTS[dimension.name] ?? 1);
      }, 0);
      return { id: row.product.id, name: row.product.name, total: Number(total.toFixed(2)) };
    })
    .sort((a, b) => b.total - a.total);

  const winner = totals[0]!;
  const runnerUp = totals[1] ?? null;

  const gap = runnerUp ? Number((winner.total - runnerUp.total).toFixed(2)) : 0;
  const flipDimension = runnerUp
    ? dimensions
        .map((dimension) => {
          const win = dimension.scores.find((entry) => entry.itemId === winner.id)?.score ?? 0;
          const run = dimension.scores.find((entry) => entry.itemId === runnerUp.id)?.score ?? 0;
          return { name: dimension.name, edge: run - win };
        })
        .sort((a, b) => b.edge - a.edge)[0]
    : null;

  const rationale = runnerUp
    ? `${winner.name} leads on the weighted read (${winner.total} against ${runnerUp.total}), driven by fit certainty and cost per wear — the two things the research says stall this decision.`
    : `${winner.name} is the only item with enough evidence to call.`;

  const wouldChangeIf =
    flipDimension && flipDimension.edge > 0
      ? `${runnerUp!.name} already beats it on ${flipDimension.name.toLowerCase()}. If that matters most to you, pick that one instead — the gap is only ${gap} points.`
      : "Nothing in this evidence favours the runner-up. If you still hesitate, the missing input is your own occasion, not more data.";

  return CompareMatrixSchema.parse({
    itemIds: products.map((product) => product.id),
    dimensions,
    recommendation: {
      itemId: winner.id,
      rationale,
      runnerUpId: runnerUp?.id ?? null,
      wouldChangeIf
    },
    evidenceThemeIds: themeIds,
    evidenceReviewIds: products.flatMap((product) => product.reviews.map((review) => review.id))
  });
}
