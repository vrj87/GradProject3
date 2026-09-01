import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  SEGMENT_THRESHOLDS,
  coachEligibility,
  comparableCategories,
  isControlPersona,
  matchesStalledShortlister,
  type SegmentUser
} from "@/lib/segment";

const NOW = new Date("2026-09-01T00:00:00Z");

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);
}

function user(overrides: Partial<SegmentUser> = {}): SegmentUser {
  return {
    id: "u1",
    optedOut: false,
    segmentTags: ["S2", "S4"],
    wishlistItems: [
      { addedAt: daysAgo(5), category: "ethnic" },
      { addedAt: daysAgo(9), category: "ethnic" }
    ],
    ...overrides
  };
}

describe("Phase 4 contract fidelity", () => {
  it("uses the thresholds the Phase 4 lock generated", () => {
    const file = path.resolve(import.meta.dirname, "../../../../phase-4/data/segment-contract.json");
    const contract = JSON.parse(readFileSync(file, "utf8")) as {
      thresholds: Record<string, number>;
    };

    expect(SEGMENT_THRESHOLDS.windowDays).toBe(contract.thresholds.windowDays);
    expect(SEGMENT_THRESHOLDS.minRecentSaves).toBe(contract.thresholds.minRecentSaves);
    expect(SEGMENT_THRESHOLDS.maxPurchasedInWindow).toBe(contract.thresholds.maxPurchasedInWindow);
    expect(SEGMENT_THRESHOLDS.minSameCategory).toBe(contract.thresholds.minSameCategory);
  });
});

describe("matchesStalledShortlister", () => {
  it("matches a shopper with two same-category saves and no purchase", () => {
    expect(matchesStalledShortlister(user(), NOW)).toBe(true);
  });

  it("rejects an opted-out shopper regardless of behaviour", () => {
    expect(matchesStalledShortlister(user({ optedOut: true }), NOW)).toBe(false);
  });

  it("rejects saves that fall outside the 30-day window", () => {
    const stale = user({
      wishlistItems: [
        { addedAt: daysAgo(40), category: "ethnic" },
        { addedAt: daysAgo(45), category: "ethnic" }
      ]
    });
    expect(matchesStalledShortlister(stale, NOW)).toBe(false);
  });

  it("rejects a shopper who already converts", () => {
    const converting = user({
      wishlistItems: [
        { addedAt: daysAgo(5), category: "ethnic", purchasedAt: daysAgo(3) },
        { addedAt: daysAgo(9), category: "ethnic", purchasedAt: daysAgo(4) }
      ]
    });
    expect(matchesStalledShortlister(converting, NOW)).toBe(false);
  });

  it("tolerates exactly one purchase in the window", () => {
    const oneBuy = user({
      wishlistItems: [
        { addedAt: daysAgo(5), category: "ethnic", purchasedAt: daysAgo(3) },
        { addedAt: daysAgo(9), category: "ethnic" }
      ]
    });
    expect(matchesStalledShortlister(oneBuy, NOW)).toBe(true);
  });

  it("rejects saves spread across categories with no comparable pair", () => {
    const spread = user({
      wishlistItems: [
        { addedAt: daysAgo(5), category: "ethnic" },
        { addedAt: daysAgo(9), category: "footwear" }
      ]
    });
    expect(matchesStalledShortlister(spread, NOW)).toBe(false);
  });

  it("ignores items the shopper already removed", () => {
    const removed = user({
      wishlistItems: [
        { addedAt: daysAgo(5), category: "ethnic", removedAt: daysAgo(1) },
        { addedAt: daysAgo(9), category: "ethnic" }
      ]
    });
    expect(matchesStalledShortlister(removed, NOW)).toBe(false);
  });
});

describe("coachEligibility", () => {
  it("explains why an eligible shopper qualifies", () => {
    const result = coachEligibility(user(), NOW);
    expect(result.eligible).toBe(true);
    expect(result.code).toBe("eligible");
    expect(result.reason).toContain("ethnic");
  });

  it("withholds the coach from the S3 control persona", () => {
    const saleWatcher = user({ segmentTags: ["S3"] });
    expect(isControlPersona(saleWatcher)).toBe(true);
    const result = coachEligibility(saleWatcher, NOW);
    expect(result.eligible).toBe(false);
    expect(result.code).toBe("control-persona");
  });

  it("does not treat a sale-watcher who also compares as a control", () => {
    expect(isControlPersona(user({ segmentTags: ["S3", "S4"] }))).toBe(false);
  });

  it("names the specific failure for each rejection", () => {
    expect(coachEligibility(user({ optedOut: true }), NOW).code).toBe("opted-out");
    expect(
      coachEligibility(user({ wishlistItems: [{ addedAt: daysAgo(2), category: "ethnic" }] }), NOW)
        .code
    ).toBe("too-few-saves");
    expect(
      coachEligibility(
        user({
          wishlistItems: [
            { addedAt: daysAgo(5), category: "ethnic" },
            { addedAt: daysAgo(6), category: "western" }
          ]
        }),
        NOW
      ).code
    ).toBe("no-comparable-pair");
  });
});

describe("comparableCategories", () => {
  it("lists only categories with enough saves to compare", () => {
    const mixed = user({
      wishlistItems: [
        { addedAt: daysAgo(1), category: "ethnic" },
        { addedAt: daysAgo(2), category: "ethnic" },
        { addedAt: daysAgo(3), category: "ethnic" },
        { addedAt: daysAgo(4), category: "footwear" }
      ]
    });
    expect(comparableCategories(mixed, NOW)).toEqual(["ethnic"]);
  });
});
