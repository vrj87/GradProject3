import type { NormalizedReview, RawReview } from "./types.js";
import { WISHLIST_KEYWORDS } from "./types.js";
import { surveyKeepKeywords } from "./survey.js";
import { textHash } from "./hash.js";

const DEVANAGARI = /[\u0900-\u097F]/;
const HINGLISH =
  /\b(yaar|bhai|accha|acha|theek|sahi|nahi|nahin|kitna|bahut|zyada|wala|wali)\b/i;

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function languageHint(text: string): string {
  if (DEVANAGARI.test(text)) return "hi";
  if (HINGLISH.test(text)) return "hinglish";
  return "en";
}

function keywordInText(text: string, keyword: string): boolean {
  const lower = text.toLowerCase();
  if (keyword.length <= 5 && !keyword.includes(" ")) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escaped}\\b`, "i").test(lower);
  }
  return lower.includes(keyword);
}

const PRAISE_ONLY_FIT =
  /\b(perfect fit|excellent fit|good fit|nice fit|great fit|amazing fit)\b/i;
const FIT_DOUBT =
  /\b(size chart|runs small|runs large|too tight|too loose|wrong size|will it fit|if it (will|would) fit|size is confusing|not sure.*(size|fit)|(size|fit).*not sure)\b/i;
const WISHLIST_INTENT =
  /\b(wishlist|wish list|shortlist|saved it|save for later|bookmark|moodboard)\b/i;
const SURVEY_BEHAVIOR =
  /\b(youtube|instagram|customer photos?|still deciding|didn't buy|did not buy|never bought|ask friends?|inspiration|will it look)\b/i;

export function isWishlistRelevant(text: string): boolean {
  const lower = text.toLowerCase();
  if (WISHLIST_INTENT.test(lower) || FIT_DOUBT.test(lower) || SURVEY_BEHAVIOR.test(lower)) return true;
  if (PRAISE_ONLY_FIT.test(lower) && !WISHLIST_INTENT.test(lower) && !FIT_DOUBT.test(lower)) {
    return false;
  }
  const extra = surveyKeepKeywords().filter((keyword) => keyword.length > 4);
  return [...WISHLIST_KEYWORDS, ...extra].some((keyword) => keywordInText(lower, keyword));
}

export function isFrequencyExcluded(source: string): boolean {
  return source === "interview" || source === "primary_research";
}

export function passesMinWordRule(review: RawReview): boolean {
  const words = wordCount(review.text);
  if (words >= 8) return true;
  return review.rating != null && review.rating <= 2;
}

export function normalizeReview(review: RawReview): NormalizedReview {
  const trimmed = review.text.replace(/\s+/g, " ").trim();
  return {
    ...review,
    text: trimmed,
    textHash: textHash(trimmed),
    wordCount: wordCount(trimmed),
    languageHint: review.languageHint ?? languageHint(trimmed),
    wishlistRelevant: isWishlistRelevant(trimmed),
    excludedFromFrequency: isFrequencyExcluded(review.source)
  };
}

export interface NormalizeResult {
  kept: NormalizedReview[];
  droppedMinWords: number;
  droppedIrrelevant: number;
  droppedDuplicates: number;
}

export function normalizeCorpus(reviews: RawReview[]): NormalizeResult {
  let droppedMinWords = 0;
  let droppedIrrelevant = 0;
  const byHash = new Map<string, NormalizedReview>();

  for (const raw of reviews) {
    if (!passesMinWordRule(raw)) {
      droppedMinWords += 1;
      continue;
    }
    const normalized = normalizeReview(raw);
    if (!normalized.wishlistRelevant) {
      droppedIrrelevant += 1;
      continue;
    }
    const existing = byHash.get(normalized.textHash);
    if (!existing) {
      byHash.set(normalized.textHash, normalized);
      continue;
    }
    if (normalized.text.length > existing.text.length) {
      byHash.set(normalized.textHash, normalized);
    }
  }

  const kept = [...byHash.values()];
  const droppedDuplicates = Math.max(
    0,
    reviews.length - droppedMinWords - droppedIrrelevant - kept.length
  );

  return { kept, droppedMinWords, droppedIrrelevant, droppedDuplicates };
}
