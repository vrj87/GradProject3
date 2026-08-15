import { describe, expect, it } from "vitest";
import {
  isWishlistRelevant,
  normalizeCorpus,
  passesMinWordRule,
  textHash
} from "@myntra/discovery-core";

describe("normalize", () => {
  it("hashes normalized text consistently", () => {
    expect(textHash("  Hello   World ")).toBe(textHash("hello world"));
  });

  it("keeps short reviews only when rating is 2 or below", () => {
    expect(
      passesMinWordRule({
        id: "a",
        text: "Love Myntra!",
        source: "app_store",
        rating: 5,
        scrapedAt: "2026-01-01T00:00:00.000Z"
      })
    ).toBe(false);
    expect(
      passesMinWordRule({
        id: "b",
        text: "Bad fit.",
        source: "app_store",
        rating: 1,
        scrapedAt: "2026-01-01T00:00:00.000Z"
      })
    ).toBe(true);
  });

  it("gates on wishlist-relevant keywords", () => {
    expect(isWishlistRelevant("delivery was late and the app crashed")).toBe(false);
    expect(isWishlistRelevant("saved this kurta to my wishlist")).toBe(true);
  });

  it("dedupes by hash and keeps the longest variant", () => {
    const result = normalizeCorpus([
      {
        id: "1",
        text: "I wishlisted this dress because the size chart is confusing.",
        source: "reddit",
        scrapedAt: "2026-01-01T00:00:00.000Z"
      },
      {
        id: "2",
        text: "  I WISHLISTED this dress because the size chart is confusing.  ",
        source: "app_store",
        scrapedAt: "2026-01-01T00:00:00.000Z"
      }
    ]);
    expect(result.kept).toHaveLength(1);
    expect(result.droppedDuplicates).toBe(1);
  });

  it("marks interview quotes as excluded from frequency", () => {
    const result = normalizeCorpus([
      {
        id: "int-1",
        text: "I compare too many similar items on my wishlist every week.",
        source: "interview",
        scrapedAt: "2026-01-01T00:00:00.000Z"
      }
    ]);
    expect(result.kept[0].excludedFromFrequency).toBe(true);
  });
});
