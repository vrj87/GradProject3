/**
 * The Phase 4 lock is explicit: discounts, coupons, price-drop alerts, EOSS
 * nudges and urgency pressure are forbidden. The coach talks about *worth*,
 * never about paying less, so the constraint is enforced in code rather than
 * left to prompt wording that a provider can ignore.
 */

interface Rule {
  name: string;
  pattern: RegExp;
}

const RULES: Rule[] = [
  { name: "discount", pattern: /\bdiscount(s|ed|ing)?\b/i },
  { name: "coupon", pattern: /\bcoupons?\b/i },
  { name: "promo-code", pattern: /\bpromo\s*-?\s*codes?\b/i },
  { name: "price-drop", pattern: /\bprice\s*-?\s*drops?\b/i },
  { name: "percent-off", pattern: /\b\d+\s*%\s*off\b/i },
  { name: "flat-off", pattern: /\bflat\s+(?:rs\.?|₹)?\s*\d+/i },
  { name: "eoss", pattern: /\beoss\b|\bend\s+of\s+season\s+sale\b/i },
  { name: "sale", pattern: /\bsales?\b/i },
  { name: "markdown", pattern: /\bmark\s*-?\s*downs?\b/i },
  { name: "cashback", pattern: /\bcash\s*-?\s*back\b/i },
  { name: "cheaper", pattern: /\bcheaper\b|\bcheapest\b/i },
  { name: "bargain", pattern: /\bbargains?\b|\bsteal\s+deal\b/i },
  { name: "deal", pattern: /\bbest\s+deal\b|\bgreat\s+deal\b/i },
  { name: "wait-for-price", pattern: /\bwait\s+(?:for|till|until)\s+(?:a\s+|the\s+)?(?:better\s+)?(?:price|drop|offer)/i },
  // Urgency pressure is banned for the same reason as a coupon: it moves the
  // decision without resolving the doubt.
  { name: "urgency", pattern: /\bhurry\b|\bonly\s+\d+\s+left\b|\blast\s+chance\b|\bact\s+now\b|\bselling\s+fast\b/i }
];

/** Names of every forbidden pattern present in `text`. */
export function incentiveMatches(text: string): string[] {
  return RULES.filter((rule) => rule.pattern.test(text)).map((rule) => rule.name);
}

export function hasIncentiveLanguage(text: string): boolean {
  return incentiveMatches(text).length > 0;
}

export class IncentiveLanguageError extends Error {
  constructor(readonly matches: string[]) {
    super(`Blocked by the Phase 4 lock — incentive language: ${matches.join(", ")}`);
    this.name = "IncentiveLanguageError";
  }
}

export function assertNoIncentiveLanguage(value: unknown): void {
  const matches = incentiveMatches(typeof value === "string" ? value : JSON.stringify(value));
  if (matches.length > 0) throw new IncentiveLanguageError(matches);
}

/**
 * Reviews are untrusted input that reaches an LLM prompt (Appendix D: prompt
 * injection). Instruction-shaped lines are dropped and length is capped.
 */
export function sanitizeReviewText(text: string, maxLength = 400): string {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\b(?:ignore|disregard|forget)\s+(?:all\s+)?(?:previous|prior|above)\s+instructions?\b/gi, " ")
    .replace(/\b(?:system|assistant|user)\s*:/gi, " ")
    .replace(/<\/?[a-z][^>]*>/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

/** Fit language must stay a band, never a promise. */
export const FIT_DISCLAIMER =
  "Read as a confidence band from other shoppers' experience, not a guarantee that it will fit you.";

export const VALUE_DISCLAIMER =
  "This is a read on what you get for the price, using review evidence and your own occasions. It is not a prediction about the price changing.";
