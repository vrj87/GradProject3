import { VALUE_DISCLAIMER } from "./guardrails";
import { inr, median } from "./format";
import { synthesizeQuality, synthesizeWear } from "./review-synthesizer";
import { occasionBreadth } from "./style-occasion";
import {
  ValueConfidenceSummarySchema,
  type ProductRecord,
  type ValueConfidenceSummary
} from "./schemas";

/**
 * The surface Phase 4 identified as the largest evidenced gap: 4/9 respondents
 * asked to "understand whether the price is good" and nothing in the product
 * answered them.
 *
 * The answer is built only from non-monetary signals — how many wears the
 * reviews support, how the item holds up, and how it sits against the shopper's
 * own comparable saves. It never mentions a discount, a sale, or waiting for a
 * price to move; `guardrails.ts` enforces that through the schema.
 */

export interface ValueInputs {
  product: ProductRecord;
  /** Comparable items already saved by this shopper, same category. */
  peers?: ProductRecord[];
  /** Shopper's own estimate, when they give one. */
  occasionsPerMonth?: number;
}

interface WearEstimate {
  wears: number;
  basis: string;
}

const EVERYDAY_BROAD = 36;
const EVERYDAY = 24;
const MULTI_OCCASION = 8;
const SINGLE_OCCASION = 4;
const UNKNOWN_OCCASION = 6;

function estimateWears(product: ProductRecord, occasionsPerMonth?: number): WearEstimate {
  if (occasionsPerMonth !== undefined) {
    const wears = Math.max(1, Math.round(occasionsPerMonth * 12));
    return {
      wears,
      basis: `your own estimate of ${occasionsPerMonth} wear${occasionsPerMonth === 1 ? "" : "s"} a month over a year`
    };
  }

  const breadth = occasionBreadth(product);
  const wear = synthesizeWear(product.reviews);

  let wears: number;
  let basis: string;

  if (breadth.everyday && breadth.types >= 2) {
    wears = EVERYDAY_BROAD;
    basis = `reviewers wearing it across ${breadth.types} settings including everyday use`;
  } else if (breadth.everyday) {
    wears = EVERYDAY;
    basis = "reviewers describing it as everyday or office wear";
  } else if (breadth.types >= 2) {
    wears = MULTI_OCCASION;
    basis = `reviewers wearing it for ${breadth.types} kinds of occasion, none of them everyday`;
  } else if (breadth.types === 1) {
    wears = SINGLE_OCCASION;
    basis = `reviewers only mentioning ${breadth.occasions[0]?.occasion ?? "one occasion"}`;
  } else {
    wears = UNKNOWN_OCCASION;
    basis = "no occasion evidence at all, so this is a midpoint guess and the weakest part of the read";
  }

  if (wear.repeatWear > 0) {
    wears = Math.round(wears * 1.25);
    basis += `, raised because ${wear.repeatWear} reviewer${wear.repeatWear === 1 ? "" : "s"} report wearing it repeatedly`;
  }
  if (wear.earlyFailure > 0) {
    wears = Math.max(1, Math.round(wears * 0.6));
    basis += `, cut because ${wear.earlyFailure} reviewer${wear.earlyFailure === 1 ? "" : "s"} report it failing early`;
  }
  if (wear.occasionOnly > 0) {
    wears = Math.min(wears, 6);
    basis += ", capped because reviewers call it occasion-only";
  }

  return { wears, basis };
}

function costPerWear(product: ProductRecord, wears: number): number {
  return Math.round(product.priceInr / Math.max(1, wears));
}

function peerBand(product: ProductRecord, peers: ProductRecord[]) {
  if (peers.length === 0) {
    return {
      comparedWith: 0,
      band: "no-peers" as const,
      note: "Nothing comparable in your list yet, so there is no in-list reference point for this price."
    };
  }

  const peerPrices = peers.map((peer) => peer.priceInr);
  const peerMedian = median(peerPrices) ?? product.priceInr;
  const peerPerWear = peers.map((peer) => {
    const estimate = estimateWears(peer);
    return costPerWear(peer, estimate.wears);
  });
  const perWearMedian = median(peerPerWear) ?? 0;

  const band =
    product.priceInr < peerMedian * 0.9
      ? ("below-peers" as const)
      : product.priceInr > peerMedian * 1.1
        ? ("above-peers" as const)
        : ("in-line" as const);

  const phrasing = {
    "below-peers": "sits under",
    "in-line": "sits in line with",
    "above-peers": "sits above"
  }[band];

  return {
    comparedWith: peers.length,
    band,
    note: `At ${inr(product.priceInr)} it ${phrasing} the ${peers.length} comparable save${peers.length === 1 ? "" : "s"} in your list (middle price ${inr(peerMedian)}, middle cost per wear ${inr(perWearMedian)}).`,
    perWearMedian
  };
}

export function buildValueConfidence(inputs: ValueInputs): ValueConfidenceSummary {
  const { product, peers = [], occasionsPerMonth } = inputs;
  const estimate = estimateWears(product, occasionsPerMonth);
  const perWear = costPerWear(product, estimate.wears);
  const context = peerBand(product, peers);
  const quality = synthesizeQuality(product.reviews);
  const wear = synthesizeWear(product.reviews);
  const breadth = occasionBreadth(product);

  const positives = quality.filter((signal) => signal.sentiment === "positive");
  const negatives = quality.filter((signal) => signal.sentiment === "negative");
  const durabilityRisk = wear.earlyFailure > 0 || negatives.some((s) => s.kind === "durability");
  const worsePerWearThanPeers =
    context.perWearMedian !== undefined &&
    context.perWearMedian > 0 &&
    perWear > context.perWearMedian * 1.25;

  let verdict: ValueConfidenceSummary["verdict"];
  let headline: string;

  if (durabilityRisk && positives.length === 0) {
    verdict = "hold";
    headline = `Hold this one — at ${inr(product.priceInr)} the reviews describe it failing before it earns its keep.`;
  } else if (breadth.types === 0 && occasionsPerMonth === undefined) {
    verdict = "worth-it-if";
    headline = `${inr(product.priceInr)} is defensible at about ${inr(perWear)} a wear, but no reviewer says where they wore it — name your occasion and this becomes a real answer.`;
  } else if (worsePerWearThanPeers) {
    verdict = "worth-it-if";
    headline = `About ${inr(perWear)} a wear, against ${inr(context.perWearMedian!)} for comparable saves in your own list — worth it only if you specifically want this one.`;
  } else if (positives.length > 0 && perWear <= 200) {
    verdict = "worth-it-now";
    headline = `${inr(product.priceInr)} works out to roughly ${inr(perWear)} a wear across ${estimate.wears} wears, and the reviews back the quality up.`;
  } else {
    verdict = "worth-it-if";
    headline = `Roughly ${inr(perWear)} a wear across ${estimate.wears} wears — reasonable, if the occasions actually turn up.`;
  }

  const qualitySignals = [
    ...positives.map((signal) => `${signal.kind} holds up: ${signal.note}`),
    ...negatives.map((signal) => `${signal.kind} concern: ${signal.note}`)
  ];
  if (qualitySignals.length === 0) {
    qualitySignals.push("No reviewer describes how it holds up, so durability is unknown rather than good.");
  }

  const whatWouldChangeIt: string[] = [];
  if (occasionsPerMonth === undefined) {
    whatWouldChangeIt.push(
      `Tell the coach how often you would actually wear it. At one wear a month this is ${inr(costPerWear(product, 12))} a wear; at three it is ${inr(costPerWear(product, 36))}.`
    );
  }
  if (breadth.everyday === false && breadth.types > 0) {
    whatWouldChangeIt.push(
      `If it turns out to work for everyday use, cost per wear falls to about ${inr(costPerWear(product, EVERYDAY))}.`
    );
  }
  if (wear.earlyFailure > 0) {
    whatWouldChangeIt.push(
      `${wear.earlyFailure} reviewer${wear.earlyFailure === 1 ? "" : "s"} report early wear-out. If that happens to you, the real cost per wear roughly doubles to ${inr(perWear * 2)}.`
    );
  }
  if (context.band === "above-peers") {
    whatWouldChangeIt.push(
      "Compare it against the similar items already in your list before deciding — the comparison is one tap away."
    );
  }
  if (whatWouldChangeIt.length === 0) {
    whatWouldChangeIt.push("Nothing in the current evidence would flip this read; the next signal would have to come from wearing it.");
  }

  return ValueConfidenceSummarySchema.parse({
    productId: product.id,
    verdict,
    headline,
    priceInr: product.priceInr,
    costPerWearInr: perWear,
    wearsAssumed: estimate.wears,
    wearBasis: estimate.basis,
    qualitySignals,
    peerContext: {
      comparedWith: context.comparedWith,
      band: context.band,
      note: context.note
    },
    whatWouldChangeIt,
    evidenceReviewIds: [
      ...new Set([...quality.map((signal) => signal.reviewId), ...wear.evidenceIds])
    ],
    disclaimer: VALUE_DISCLAIMER
  });
}

export function verdictLabel(verdict: ValueConfidenceSummary["verdict"]): string {
  return {
    "worth-it-now": "Worth it now",
    "worth-it-if": "Worth it, with a condition",
    hold: "Hold"
  }[verdict];
}
