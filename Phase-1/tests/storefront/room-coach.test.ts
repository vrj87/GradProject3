import { describe, expect, it } from "vitest";
import { PRODUCTS } from "../../apps/storefront/src/data/products";
import { buildRoomCompare, ROOM_COACH_TABS } from "../../apps/storefront/src/lib/roomCoach";

function sku(id: string) {
  const product = PRODUCTS.find((item) => item.id === id);
  if (!product) throw new Error(`missing ${id}`);
  return product;
}

describe("room coach compare", () => {
  it("answers the three coach questions on the hung pair", () => {
    const compare = buildRoomCompare(sku("w-kurta-1"), sku("w-kurta-2"));
    expect(compare.itemIds).toEqual(["w-kurta-1", "w-kurta-2"]);
    expect(ROOM_COACH_TABS.map((tab) => tab.label)).toEqual([
      "Will it fit",
      "Where I'd wear it",
      "Is it worth it"
    ]);
    expect(compare.dimensions.map((row) => row.name)).toEqual(ROOM_COACH_TABS.map((tab) => tab.label));
    expect(compare.looks).toHaveLength(2);

    const libas = compare.looks.find((look) => look.itemId === "w-kurta-1");
    expect(libas?.fit.sizePattern.toLowerCase()).toMatch(/small|size/);
    expect(libas?.fit.suggestedSize).toBeTruthy();
    expect(libas?.wear.occasions.some((row) => /wedding|festive/i.test(row.name))).toBe(true);
    expect(libas?.worth.costPerWearInr).toBeGreaterThan(0);
    expect(libas?.worth.verdict).toMatch(/^worth-it-|^hold$/);
    expect(JSON.stringify(libas?.worth.headline).toLowerCase()).not.toMatch(/\b(coupon|discount|% off|eoss)\b/);
  });

  it("recalculates worth from the shopper's own monthly wears", () => {
    const base = buildRoomCompare(sku("w-kurta-1"), sku("w-kurta-2"));
    const typed = buildRoomCompare(sku("w-kurta-1"), sku("w-kurta-2"), null, {
      occasionsPerMonth: 3
    });
    const fromBase = base.looks[0]!.worth.wearsAssumed;
    const fromTyped = typed.looks[0]!.worth.wearsAssumed;
    expect(fromTyped).toBe(36);
    expect(fromTyped).toBeGreaterThan(fromBase);
    expect(typed.looks[0]!.worth.wearBasis).toMatch(/your own estimate/);
  });

  it("names what would flip the keep if the runner-up is stronger on a question", () => {
    const compare = buildRoomCompare(sku("w-kurta-1"), sku("w-kurta-2"));
    expect(compare.recommendation.wouldChangeIf.length).toBeGreaterThan(20);
    expect(compare.recommendation.runnerUpId).toBeTruthy();
  });
});
