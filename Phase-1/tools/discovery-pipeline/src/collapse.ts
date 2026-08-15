import type { Theme, ThemeQuote } from "@myntra/discovery-core";

const CANONICAL_LABELS: Record<string, string> = {
  "fit-size-anxiety": "FitSizeAnxiety",
  "styling-occasion": "StylingOccasionMismatch",
  "comparison-paralysis": "ComparisonParalysis",
  "sale-waitlist": "WishlistAsSaleWaitlist",
  "return-fear": "ReturnFearDelay",
  "review-trust-gap": "ReviewTrustGap",
  "social-validation": "SocialValidation",
  "wishlist-decay": "WishlistDecay",
  "bookmark-vs-intent": "BookmarkVsIntent"
};

const ALIAS_GROUPS: string[][] = [
  ["fit-size-anxiety", "size-fit-uncertainty", "fit-and-size-uncertainty"],
  ["styling-occasion", "style-occasion-uncertainty", "fit-style-uncertainty", "fit-and-style-uncertainty"],
  ["comparison-paralysis", "compare-and-decide"],
  ["sale-waitlist", "sale-waiting", "price-timing", "price-and-value-uncertainty"],
  ["return-fear", "return-and-exchange-uncertainty", "return-and-refund-issues", "return-and-exchange-convenience"],
  ["review-trust-gap"],
  ["social-validation"],
  ["wishlist-decay"],
  ["bookmark-vs-intent"]
];

const STOP = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "users",
  "user",
  "wishlist",
  "myntra",
  "items",
  "item"
]);

function tokens(theme: Theme): Set<string> {
  const text = `${theme.id} ${theme.label} ${theme.summary}`.toLowerCase();
  return new Set(
    text
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length > 3 && !STOP.has(word))
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let hits = 0;
  for (const word of a) {
    if (b.has(word)) hits += 1;
  }
  return hits / new Set([...a, ...b]).size;
}

function aliasIndex(id: string): number {
  return ALIAS_GROUPS.findIndex((group) => group.includes(id));
}

function shouldMerge(a: Theme, b: Theme): boolean {
  const ai = aliasIndex(a.id);
  const bi = aliasIndex(b.id);
  if (ai >= 0 && ai === bi) return true;
  if (a.barrierType !== b.barrierType) return false;
  if (a.metricNode !== b.metricNode) return false;
  return jaccard(tokens(a), tokens(b)) >= 0.35;
}

const IMPACT_RANK: Record<string, number> = { high: 3, medium: 2, low: 1 };

function betterLevel(a: Theme["impactOnW2P"], b: Theme["impactOnW2P"]): Theme["impactOnW2P"] {
  return (IMPACT_RANK[a] ?? 0) >= (IMPACT_RANK[b] ?? 0) ? a : b;
}

function mergePair(keep: Theme, drop: Theme): Theme {
  const quoteMap = new Map<string, ThemeQuote>();
  for (const quote of [...keep.quotes, ...drop.quotes]) {
    quoteMap.set(quote.reviewId, quote);
  }
  const groupIndex = [aliasIndex(keep.id), aliasIndex(drop.id)].find((index) => index >= 0) ?? -1;
  const preferredId = groupIndex >= 0 ? ALIAS_GROUPS[groupIndex][0] : keep.id;
  const canonical = [keep, drop].find((theme) => theme.id === preferredId);

  return {
    ...keep,
    id: preferredId,
    label: canonical?.label ?? keep.label,
    summary: keep.summary.length >= drop.summary.length ? keep.summary : drop.summary,
    researchQuestionIds: [...new Set([...keep.researchQuestionIds, ...drop.researchQuestionIds])],
    quotes: [...quoteMap.values()].slice(0, 4),
    estimatedFrequency: Math.max(keep.estimatedFrequency, drop.estimatedFrequency),
    impactOnW2P: betterLevel(keep.impactOnW2P, drop.impactOnW2P),
    nonMonetaryFeasibility: betterLevel(keep.nonMonetaryFeasibility, drop.nonMonetaryFeasibility),
    confidence: betterLevel(keep.confidence, drop.confidence),
    actionableInsight:
      keep.actionableInsight.length >= drop.actionableInsight.length
        ? keep.actionableInsight
        : drop.actionableInsight,
    mergedFrom: [...new Set([...(keep.mergedFrom ?? []), keep.id, drop.id, ...(drop.mergedFrom ?? [])])]
      .filter((id) => id !== preferredId)
  };
}

/** Collapse Groq + template near-duplicates so ranking does not double-count. */
export function collapseNearDuplicates(themes: Theme[]): Theme[] {
  const remaining = [...themes];
  const collapsed: Theme[] = [];

  while (remaining.length) {
    let current = remaining.shift()!;
    let index = 0;
    while (index < remaining.length) {
      if (shouldMerge(current, remaining[index])) {
        current = mergePair(current, remaining[index]);
        remaining.splice(index, 1);
        continue;
      }
      index += 1;
    }
    collapsed.push({
      ...current,
      label: CANONICAL_LABELS[current.id] ?? current.label
    });
  }

  return collapsed;
}
