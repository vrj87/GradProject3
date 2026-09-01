import type { SurveyResponse } from "./types.js";

/** Question ids as delivered in the Phase 3 questionnaire. */
export const Q = {
  platforms: 1,
  frequency: 2,
  usesWishlist: 3,
  saveVolume: 4,
  purchaseRate: 5,
  lastStall: 6,
  whySave: 7,
  mainBarrier: 8,
  confidence: 9,
  uncertainty: 10,
  behaviour: 11,
  unlock: 12,
  help: 13,
  aiVerdict: 14
} as const;

/**
 * Properties of the instrument itself, not of the answers. Both limits are
 * documented in docs/research/interview-guide.md and both change how far the
 * results can be pushed, so they travel with the analysis.
 */
export const INSTRUMENT = {
  priceHeldConstant: false,
  freeTextCollected: false,
  note:
    "Brief questions 3 and 4 ask what blocks a purchase with price held constant. The form never " +
    "froze price, and Q12 offered 'Price drop/discount' as an option, so a stated price barrier " +
    "cannot be separated from the easiest available answer. No free-text field means there are no " +
    "participant verbatims to quote."
} as const;

/** Q13's option list contains no discount, by design. Q12's does. */
export const HELP_OPTIONS_INCLUDE_DISCOUNT = false;

export const STALLING_PURCHASE_RATES = ["Almost never", "Sometimes"];

export function answers(response: SurveyResponse, question: number): string[] {
  return response.answers[String(question)] ?? [];
}

export function first(response: SurveyResponse, question: number): string | null {
  return answers(response, question)[0] ?? null;
}

export function isMonetaryUnlock(answer: string): boolean {
  return /price drop|discount|coupon|sale/i.test(answer);
}

/** Q13/Q12 answers that ask for a verdict on worth rather than a lower price. */
export function isPriceJudgement(answer: string): boolean {
  return /whether the price is good|price is good|buy now or wait/i.test(answer);
}

export function isComparisonHelp(answer: string): boolean {
  return /comparing it with alternatives|best product among/i.test(answer);
}

export function isPriceBarrier(answer: string): boolean {
  return /expensive|discount|price/i.test(answer);
}

/** Q10 doubts about the garment on the body. */
export function isFitDoubt(answer: string): boolean {
  return /\bfit\b|\bsize\b|look on me/i.test(answer);
}

export function isQualityDoubt(answer: string): boolean {
  return /quality|material|fabric|durability/i.test(answer);
}

export function isSaleWait(answer: string): boolean {
  return /wait for a sale/i.test(answer);
}

export function isReviewReading(answer: string): boolean {
  return /customer reviews|customer photos|size\/fit reviews/i.test(answer);
}

export function isInAppComparison(answer: string): boolean {
  return /compare with other products/i.test(answer);
}

export function isOffApp(answer: string): boolean {
  return /instagram|youtube|google|other shopping apps|friends\/family/i.test(answer);
}

export function isCompareIntent(answer: string): boolean {
  return /compare it with other products/i.test(answer);
}

export function isBookmarkIntent(answer: string): boolean {
  return /inspiration|casually browsing|remember the product/i.test(answer);
}

/**
 * Upper bound of a save-count bucket such as "1–5" or "More than 50".
 * Returns null when the respondent could not say.
 */
export function saveVolumeCeiling(bucket: string): number | null {
  const range = bucket.match(/(\d+)\s*[–—-]\s*(\d+)/);
  if (range) return Number(range[2]);
  const open = bucket.match(/more than\s*(\d+)/i);
  if (open) return Number.POSITIVE_INFINITY;
  const single = bucket.match(/^(\d+)$/);
  if (single) return Number(single[1]);
  return null;
}
