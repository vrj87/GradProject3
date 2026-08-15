import type { NormalizedReview, ThemeQuote } from "./types.js";

/** Collapse whitespace and lowercase for fuzzy quote matching. */
export function normalizeForMatch(text: string): string {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

/** True when quote text is a substring of the review (after normalization). */
export function quoteGroundedInReview(quoteText: string, reviewText: string): boolean {
  const quote = normalizeForMatch(quoteText);
  const review = normalizeForMatch(reviewText);
  if (!quote || !review) return false;
  if (review.includes(quote)) return true;

  const words = quote.split(/\s+/).filter((word) => word.length > 3);
  if (words.length < 4) return false;
  const matched = words.filter((word) => review.includes(word)).length;
  return matched / words.length >= 0.75;
}

/** Snap an LLM quote to the canonical review text when grounded. */
export function repairQuote(
  quote: ThemeQuote,
  review: NormalizedReview
): ThemeQuote | null {
  if (!quoteGroundedInReview(quote.text, review.text)) return null;

  const normalizedQuote = normalizeForMatch(quote.text);
  const reviewLower = review.text.toLowerCase();
  const start = reviewLower.indexOf(normalizedQuote.slice(0, 40));
  const snippet =
    start >= 0
      ? review.text.slice(start, start + Math.min(quote.text.length + 40, 320))
      : quote.text.slice(0, 280);

  return {
    text: snippet.trim(),
    reviewId: review.id,
    source: review.source,
    url: review.url ?? quote.url
  };
}

export function uniqueReviewIds(quotes: ThemeQuote[]): number {
  return new Set(quotes.map((quote) => quote.reviewId)).size;
}

export function uniqueSources(quotes: ThemeQuote[]): number {
  return new Set(quotes.map((quote) => quote.source)).size;
}
