import { describe, expect, it } from "vitest";
import { PRODUCTS } from "../../apps/storefront/src/data/products";
import { primaryPhotoId } from "../../apps/storefront/src/data/productImages";
import {
  itemsForOccasion,
  matchesShopQuery,
  occasionPiles,
  pilesForRoom,
  pilesFrom,
  roomPilesFrom
} from "../../apps/storefront/src/lib/decidePiles";

describe("fitting room racks", () => {
  it("never mixes genders on a Room rack", () => {
    const mixed = PRODUCTS.filter(
      (item) => item.id === "w-kurta-1" || item.id === "m-ethnic-1" || item.id === "k-ethnic-1"
    );
    const piles = roomPilesFrom(mixed);
    expect(piles.length).toBeGreaterThan(0);
    for (const pile of piles) {
      const genders = new Set(pile.items.map((item) => item.gender));
      expect(genders.size).toBe(1);
      expect([...genders][0]).toBe(pile.gender);
    }
    const womenKurta = piles.find((pile) => pile.id === "women::kurta-set");
    expect(womenKurta?.items.every((item) => item.gender === "women")).toBe(true);
    expect(womenKurta?.items.some((item) => item.id.startsWith("m-"))).toBe(false);
  });

  it("keeps wishlist compare piles on one gender", () => {
    const items = PRODUCTS.filter((item) => item.id === "w-kurta-1" || item.id === "w-kurta-2");
    const piles = pilesFrom(items);
    expect(piles[0]?.gender).toBe("women");
    expect(piles[0]?.items.every((item) => item.gender === "women")).toBe(true);
  });

  it("gives every product its own primary photo", () => {
    const photos = PRODUCTS.map((item) => item.image);
    const dupes = photos.filter((src, index) => photos.indexOf(src) !== index);
    expect(dupes).toEqual([]);
    expect(new Set(photos).size).toBe(PRODUCTS.length);
  });

  it("does not recycle the same Unsplash id across SKUs", () => {
    const ids = PRODUCTS.map((item) => primaryPhotoId(item.id)).filter(Boolean) as string[];
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("occasion buttons", () => {
  it("never falls back to sneakers when Wedding is selected", () => {
    const piles = occasionPiles("wedding", "women");
    expect(piles.length).toBeGreaterThan(0);
    expect(piles.some((pile) => pile.cluster === "kurta-set" || pile.cluster === "saree")).toBe(true);
    for (const item of piles.flatMap((pile) => pile.items)) {
      expect(item.cluster.includes("sneaker")).toBe(false);
      expect(item.gender).toBe("women");
    }
  });

  it("gives Party, Work, and Everyday their own product racks", () => {
    const party = occasionPiles("party", "women");
    const work = occasionPiles("work", "women");
    const everyday = occasionPiles("everyday", "women");
    expect(party.some((pile) => pile.cluster === "midi-dress" || pile.cluster === "heels")).toBe(true);
    expect(work.some((pile) => pile.items.some((item) => /work|office/i.test(item.occasion)))).toBe(true);
    expect(everyday.some((pile) => pile.cluster.includes("sneaker") || pile.cluster.includes("jean"))).toBe(
      true
    );
    expect(party.flatMap((pile) => pile.items).every((item) => itemsForOccasion([item], "party").length === 1)).toBe(
      true
    );
    expect(work.flatMap((pile) => pile.items).every((item) => itemsForOccasion([item], "work").length === 1)).toBe(
      true
    );
    expect(
      everyday.flatMap((pile) => pile.items).every((item) => itemsForOccasion([item], "everyday").length === 1)
    ).toBe(true);
  });

  it("keeps Hang two on one gender, including occasion racks", () => {
    const saved = PRODUCTS.filter(
      (item) => item.id === "w-kurta-1" || item.id === "m-ethnic-1" || item.id === "k-ethnic-1"
    );
    const hanging = pilesForRoom(saved, "any", "women");
    expect(hanging.length).toBeGreaterThan(0);
    expect(hanging.every((pile) => pile.gender === "women")).toBe(true);
    expect(hanging.flatMap((pile) => pile.items).every((item) => item.gender === "women")).toBe(true);

    for (const occ of ["wedding", "party", "work", "everyday"] as const) {
      const piles = pilesForRoom(saved, occ, "women");
      expect(piles.every((pile) => pile.gender === "women")).toBe(true);
      expect(piles.flatMap((pile) => pile.items).some((item) => item.gender !== "women")).toBe(false);
      expect(piles.flatMap((pile) => pile.items).some((item) => item.id.startsWith("m-"))).toBe(false);
      expect(piles.flatMap((pile) => pile.items).some((item) => item.id.startsWith("k-"))).toBe(false);
    }
  });

  it("treats wedding and sneaker shop queries as those products", () => {
    const wedding = PRODUCTS.filter((item) => item.gender === "women" && matchesShopQuery(item, "wedding"));
    const sneakers = PRODUCTS.filter((item) => item.gender === "women" && matchesShopQuery(item, "sneaker"));
    expect(wedding.length).toBeGreaterThan(3);
    expect(wedding.every((item) => !item.cluster.includes("sneaker"))).toBe(true);
    expect(wedding.some((item) => item.category === "ethnic")).toBe(true);
    expect(sneakers.length).toBeGreaterThan(3);
    expect(sneakers.every((item) => item.cluster.includes("sneaker") || /sneaker/i.test(item.name))).toBe(
      true
    );
  });
});
