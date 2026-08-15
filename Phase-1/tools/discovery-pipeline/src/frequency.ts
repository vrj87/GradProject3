import type { NormalizedReview, Theme } from "@myntra/discovery-core";

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "have",
  "will",
  "just",
  "they",
  "your",
  "wishlist",
  "myntra",
  "saved",
  "save"
]);

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length > 3 && !STOP_WORDS.has(word))
  );
}

function overlapScore(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let hits = 0;
  for (const word of a) {
    if (b.has(word)) hits += 1;
  }
  return hits / Math.min(a.size, b.size);
}

/** Estimate how often a theme appears in the frequency-eligible corpus. */
export function estimateThemeFrequency(
  theme: Pick<Theme, "summary" | "label" | "quotes" | "barrierType">,
  reviews: NormalizedReview[]
): number {
  const eligible = reviews.filter((review) => !review.excludedFromFrequency);
  if (eligible.length === 0) return 0;

  const themeTokens = tokenize(
    [theme.label, theme.summary, ...theme.quotes.map((quote) => quote.text)].join(" ")
  );
  const quoteIds = new Set(theme.quotes.map((quote) => quote.reviewId));

  const hits = eligible.filter((review) => {
    if (quoteIds.has(review.id)) return true;
    const reviewTokens = tokenize(review.text);
    if (overlapScore(themeTokens, reviewTokens) >= 0.35) return true;

    const lower = review.text.toLowerCase();
    if (theme.barrierType === "fit" && /\b(size|fit|chart|tight|loose)\b/.test(lower)) {
      return true;
    }
    if (theme.barrierType === "price" && /\b(sale|eoss|bff|expensive|price|mrp)\b/.test(lower)) {
      return true;
    }
    if (theme.barrierType === "compare" && /\b(compare|similar|which one|decide)\b/.test(lower)) {
      return true;
    }
    if (theme.barrierType === "style" && /\b(occasion|pair|styling|wear)\b/.test(lower)) {
      return true;
    }
    if (theme.barrierType === "bookmark" && /\b(bookmark|later|maybe|moodboard)\b/.test(lower)) {
      return true;
    }
    if (theme.barrierType === "social" && /\b(friend|partner|whatsapp|opinion)\b/.test(lower)) {
      return true;
    }
    return false;
  });

  return Number((hits.length / eligible.length).toFixed(3));
}

export function enrichThemeFrequencies(themes: Theme[], reviews: NormalizedReview[]): Theme[] {
  return themes.map((theme) => ({
    ...theme,
    estimatedFrequency: estimateThemeFrequency(theme, reviews)
  }));
}
