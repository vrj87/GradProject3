/**
 * 5a/5c segment gate, implemented from the Phase 4 contract in
 * `phase-4/data/segment-contract.json`. The thresholds are duplicated here as
 * constants so this module stays pure; `tests/mvp/unit/segment.test.ts` reads
 * the generated artefact and fails if the two ever drift apart.
 */

export const SEGMENT_THRESHOLDS = {
  windowDays: 30,
  minRecentSaves: 2,
  maxPurchasedInWindow: 1,
  minSameCategory: 2
} as const;

export const SEGMENT_NAME = "Stalled Shortlister";

export interface SegmentItem {
  addedAt: Date;
  purchasedAt?: Date | null;
  removedAt?: Date | null;
  category: string;
}

export interface SegmentUser {
  id: string;
  optedOut: boolean;
  segmentTags: string[];
  wishlistItems: SegmentItem[];
}

export type EligibilityCode =
  | "eligible"
  | "opted-out"
  | "control-persona"
  | "too-few-saves"
  | "already-converting"
  | "no-comparable-pair";

export interface Eligibility {
  eligible: boolean;
  code: EligibilityCode;
  reason: string;
}

function withinDays(date: Date, days: number, now: Date): boolean {
  const ms = now.getTime() - date.getTime();
  return ms >= 0 && ms <= days * 24 * 60 * 60 * 1000;
}

function recentItems(user: SegmentUser, now: Date): SegmentItem[] {
  return user.wishlistItems.filter(
    (item) => !item.removedAt && withinDays(item.addedAt, SEGMENT_THRESHOLDS.windowDays, now)
  );
}

function groupByCategory(items: SegmentItem[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) {
    counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
  }
  return counts;
}

/** The Phase 4 predicate, unchanged. */
export function matchesStalledShortlister(user: SegmentUser, now = new Date()): boolean {
  if (user.optedOut) return false;

  const recent = recentItems(user, now);
  if (recent.length < SEGMENT_THRESHOLDS.minRecentSaves) return false;

  const purchased = recent.filter(
    (item) =>
      item.purchasedAt && withinDays(item.purchasedAt, SEGMENT_THRESHOLDS.windowDays, now)
  );
  if (purchased.length > SEGMENT_THRESHOLDS.maxPurchasedInWindow) return false;

  const byCategory = groupByCategory(recent);
  return [...byCategory.values()].some((count) => count >= SEGMENT_THRESHOLDS.minSameCategory);
}

/**
 * Sale-watchers pass the contract on paper — they save, they compare, they do
 * not convert — but Phase 2 and Phase 4 both hold them as a *control* persona.
 * Excluding them is a product decision layered on top of the predicate, so it
 * is stated separately instead of being smuggled into the thresholds.
 */
export function isControlPersona(user: SegmentUser): boolean {
  const tags = user.segmentTags.map((tag) => tag.trim().toUpperCase());
  return tags.includes("S3") && !tags.includes("S2") && !tags.includes("S4");
}

export function coachEligibility(user: SegmentUser, now = new Date()): Eligibility {
  if (user.optedOut) {
    return { eligible: false, code: "opted-out", reason: "This shopper opted out of coaching." };
  }
  if (isControlPersona(user)) {
    return {
      eligible: false,
      code: "control-persona",
      reason:
        "Tagged S3 sale-watcher. Held as a control persona, so no coach entry point is shown. The intervention is not aimed at price-timing behaviour."
    };
  }

  const recent = recentItems(user, now);
  if (recent.length < SEGMENT_THRESHOLDS.minRecentSaves) {
    return {
      eligible: false,
      code: "too-few-saves",
      reason: `Fewer than ${SEGMENT_THRESHOLDS.minRecentSaves} active saves in the last ${SEGMENT_THRESHOLDS.windowDays} days — there is no shortlist to finish.`
    };
  }

  const purchased = recent.filter(
    (item) =>
      item.purchasedAt && withinDays(item.purchasedAt, SEGMENT_THRESHOLDS.windowDays, now)
  );
  if (purchased.length > SEGMENT_THRESHOLDS.maxPurchasedInWindow) {
    return {
      eligible: false,
      code: "already-converting",
      reason: `${purchased.length} purchases from saves in the window — this shopper already decides without help.`
    };
  }

  const byCategory = groupByCategory(recent);
  const comparable = [...byCategory.entries()].find(
    ([, count]) => count >= SEGMENT_THRESHOLDS.minSameCategory
  );
  if (!comparable) {
    return {
      eligible: false,
      code: "no-comparable-pair",
      reason: `No category holds ${SEGMENT_THRESHOLDS.minSameCategory} or more saves, so there is nothing to compare against.`
    };
  }

  return {
    eligible: true,
    code: "eligible",
    reason: `${SEGMENT_NAME}: ${recent.length} active saves, ${comparable[1]} of them in ${comparable[0]}, and no completed decision.`
  };
}

/** Categories with enough saved items to run a comparison on. */
export function comparableCategories(user: SegmentUser, now = new Date()): string[] {
  return [...groupByCategory(recentItems(user, now)).entries()]
    .filter(([, count]) => count >= SEGMENT_THRESHOLDS.minSameCategory)
    .map(([category]) => category);
}
