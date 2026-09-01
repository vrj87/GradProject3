import { sanitizeReviewText } from "./guardrails";
import type { FitHint, ReviewRecord } from "./schemas";

/**
 * Turns raw review text into the structured signals the coach is allowed to
 * talk about. Everything downstream cites `reviewId`s from here, so no claim
 * can reach the UI without a line of evidence behind it.
 */

export interface FitSynthesis {
  counts: Record<FitHint, number>;
  hintedCount: number;
  dominant: FitHint;
  agreement: number;
  bodyTypeNotes: string[];
  evidenceIds: string[];
}

const FIT_ORDER: FitHint[] = ["runs_small", "runs_large", "true_to_size", "unknown"];

export function synthesizeFit(reviews: ReviewRecord[]): FitSynthesis {
  const counts: Record<FitHint, number> = {
    runs_small: 0,
    runs_large: 0,
    true_to_size: 0,
    unknown: 0
  };
  for (const review of reviews) counts[review.fitHint] += 1;

  const hinted = FIT_ORDER.filter((hint) => hint !== "unknown").reduce(
    (sum, hint) => sum + counts[hint],
    0
  );
  const dominant =
    hinted === 0
      ? "unknown"
      : FIT_ORDER.filter((hint) => hint !== "unknown").reduce((best, hint) =>
          counts[hint] > counts[best] ? hint : best
        );

  const bodyTypeNotes = reviews
    .filter((review) => review.bodyTypeHint)
    .map(
      (review) =>
        `${review.bodyTypeHint}${review.sizeBought ? ` (bought ${review.sizeBought})` : ""}: ${sanitizeReviewText(review.text, 120)}`
    );

  return {
    counts,
    hintedCount: hinted,
    dominant: dominant as FitHint,
    agreement: hinted === 0 ? 0 : counts[dominant as FitHint] / hinted,
    bodyTypeNotes,
    evidenceIds: reviews
      .filter((review) => review.fitHint !== "unknown" || review.bodyTypeHint)
      .map((review) => review.id)
  };
}

export type QualityKind = "durability" | "fabric" | "stitching" | "comfort";
export type Sentiment = "positive" | "negative";

export interface QualitySignal {
  kind: QualityKind;
  sentiment: Sentiment;
  note: string;
  reviewId: string;
}

const QUALITY_RULES: Array<{ kind: QualityKind; sentiment: Sentiment; pattern: RegExp }> = [
  {
    kind: "durability",
    sentiment: "positive",
    pattern: /survived|held up|still fine|no fading|held its shape|stayed the same|after \d+ (?:washes|months|wears)/i
  },
  {
    kind: "durability",
    sentiment: "negative",
    pattern: /fade|faded|fading|fray|frayed|fraying|separating|rubbed off|lost a few|tore|creased/i
  },
  { kind: "fabric", sentiment: "positive", pattern: /breathable|soft|premium|good fall|lovely drape|gorgeous drape/i },
  { kind: "fabric", sentiment: "negative", pattern: /thin for the price|polyester and warm|creases quickly|scratch/i },
  { kind: "stitching", sentiment: "positive", pattern: /stitching has survived|hand embroidery is real|embroidery.*(?:rich|held)/i },
  { kind: "stitching", sentiment: "negative", pattern: /stitching (?:came|gave way)|embroidery started/i },
  { kind: "comfort", sentiment: "positive", pattern: /comfortable|light enough|stable enough|forgiving/i },
  { kind: "comfort", sentiment: "negative", pattern: /rubbed on|hurt|tight at the|scratch/i }
];

export function synthesizeQuality(reviews: ReviewRecord[]): QualitySignal[] {
  const signals: QualitySignal[] = [];
  for (const review of reviews) {
    const text = sanitizeReviewText(review.text);
    for (const rule of QUALITY_RULES) {
      if (!rule.pattern.test(text)) continue;
      signals.push({ kind: rule.kind, sentiment: rule.sentiment, note: text, reviewId: review.id });
      break;
    }
  }
  return signals;
}

export interface OccasionSignal {
  occasion: string;
  count: number;
  reviewIds: string[];
}

const OCCASION_RULES: Array<{ occasion: string; pattern: RegExp; everyday: boolean }> = [
  { occasion: "wedding or reception", pattern: /wedding|reception|baraat/i, everyday: false },
  { occasion: "festive", pattern: /festive|diwali|navratri|puja|function/i, everyday: false },
  { occasion: "party or night out", pattern: /party|night out|birthday|dinner/i, everyday: false },
  { occasion: "office", pattern: /office|work day|workday/i, everyday: true },
  { occasion: "everyday", pattern: /daily|everyday|regular wear|weekly|commute|college/i, everyday: true },
  { occasion: "brunch or casual outing", pattern: /brunch|lunch|outing|jeans/i, everyday: true }
];

export function synthesizeOccasions(reviews: ReviewRecord[]): OccasionSignal[] {
  const found = new Map<string, { count: number; ids: string[]; everyday: boolean }>();
  for (const review of reviews) {
    const text = sanitizeReviewText(review.text);
    for (const rule of OCCASION_RULES) {
      if (!rule.pattern.test(text)) continue;
      const entry = found.get(rule.occasion) ?? { count: 0, ids: [], everyday: rule.everyday };
      entry.count += 1;
      entry.ids.push(review.id);
      found.set(rule.occasion, entry);
    }
  }
  return [...found.entries()]
    .map(([occasion, entry]) => ({ occasion, count: entry.count, reviewIds: entry.ids }))
    .sort((a, b) => b.count - a.count || a.occasion.localeCompare(b.occasion));
}

export function isEverydayOccasion(occasion: string): boolean {
  return OCCASION_RULES.some((rule) => rule.occasion === occasion && rule.everyday);
}

export interface WearSynthesis {
  repeatWear: number;
  earlyFailure: number;
  occasionOnly: number;
  evidenceIds: string[];
}

const REPEAT_WEAR = /worn it (?:more than|around|weekly|daily|regularly|\d+)|wore (?:them|it) daily|reaching for them|second one|worn it (?:\d+|fifteen|ten) times|goes with every/i;
const EARLY_FAILURE = /after (?:the )?(?:first|second|third|four|a few) (?:wear|wears|washes|month)|month three|started (?:separating|fraying)|on the first wear/i;
const OCCASION_ONLY = /strictly occasion|not everyday|one big night|not something I would wear often|dry clean only/i;

export function synthesizeWear(reviews: ReviewRecord[]): WearSynthesis {
  const evidence = new Set<string>();
  let repeatWear = 0;
  let earlyFailure = 0;
  let occasionOnly = 0;

  for (const review of reviews) {
    const text = sanitizeReviewText(review.text);
    if (REPEAT_WEAR.test(text)) {
      repeatWear += 1;
      evidence.add(review.id);
    }
    if (EARLY_FAILURE.test(text)) {
      earlyFailure += 1;
      evidence.add(review.id);
    }
    if (OCCASION_ONLY.test(text)) {
      occasionOnly += 1;
      evidence.add(review.id);
    }
  }

  return { repeatWear, earlyFailure, occasionOnly, evidenceIds: [...evidence] };
}

export interface PairingSynthesis {
  suggestions: string[];
  evidenceIds: string[];
}

const PAIRING = /(?:goes with|pair(?:s|ed)? with|layer it|wear it (?:open )?with|matches)([^.]*)/i;

export function synthesizePairings(reviews: ReviewRecord[]): PairingSynthesis {
  const suggestions: string[] = [];
  const evidenceIds: string[] = [];
  for (const review of reviews) {
    const match = PAIRING.exec(sanitizeReviewText(review.text));
    if (!match) continue;
    suggestions.push(sanitizeReviewText(match[0], 140));
    evidenceIds.push(review.id);
  }
  return { suggestions, evidenceIds };
}

export function averageRating(reviews: ReviewRecord[]): number | null {
  const rated = reviews.filter((review) => typeof review.rating === "number");
  if (rated.length === 0) return null;
  const total = rated.reduce((sum, review) => sum + (review.rating ?? 0), 0);
  return Number((total / rated.length).toFixed(2));
}
