import { describe, expect, it } from "vitest";
import { PRODUCTS } from "../../apps/storefront/src/data/products";
import { pairForAskCoach, toggleCoachCompareSelection } from "../../apps/storefront/src/lib/coachComparePair";
import { buildCoachLook, buildRoomCompare, ROOM_COACH_TABS } from "../../apps/storefront/src/lib/roomCoach";

function sku(id: string) {
  const product = PRODUCTS.find((item) => item.id === id);
  if (!product) throw new Error(`missing ${id}`);
  return product;
}

describe("room coach compare", () => {
  it("answers the three coach questions on a single save", () => {
    const look = buildCoachLook(sku("w-kurta-1"));
    expect(look.itemId).toBe("w-kurta-1");
    expect(look.fit.suggestedSize).toBeTruthy();
    expect(look.wear.occasions.length).toBeGreaterThan(0);
    expect(look.worth.costPerWearInr).toBeGreaterThan(0);
    expect(look.worth.peerNote).toMatch(/on its own/i);
    expect(look.worth.peerNote.toLowerCase()).not.toMatch(/\bvs\b|other hanger/);
  });

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

describe("coach COMPARE selection", () => {
  const kurtas = [
    { id: "w-kurta-1", cluster: "kurta-set" },
    { id: "w-kurta-2", cluster: "kurta-set" },
    { id: "w-kurta-3", cluster: "kurta-set" },
    { id: "w-sneaker-1", cluster: "white-sneaker" }
  ];

  it("selects the first look without opening compare", () => {
    const next = toggleCoachCompareSelection("w-kurta-1", "kurta-set", [], kurtas);
    expect(next.selected).toEqual(["w-kurta-1"]);
    expect(next.reason).toBeUndefined();
  });

  it("adds a second same-kind look so the shopper can confirm the pair", () => {
    const next = toggleCoachCompareSelection("w-kurta-3", "kurta-set", ["w-kurta-1"], kurtas);
    expect(next.selected).toEqual(["w-kurta-1", "w-kurta-3"]);
  });

  it("replaces the second look when a third same-kind save is picked", () => {
    const next = toggleCoachCompareSelection("w-kurta-3", "kurta-set", ["w-kurta-1", "w-kurta-2"], kurtas);
    expect(next.selected).toEqual(["w-kurta-1", "w-kurta-3"]);
  });

  it("deselects a look already in the pair", () => {
    const next = toggleCoachCompareSelection("w-kurta-1", "kurta-set", ["w-kurta-1", "w-kurta-2"], kurtas);
    expect(next.selected).toEqual(["w-kurta-2"]);
  });

  it("starts a new pick when the shopper switches kind", () => {
    const withSneakers = [...kurtas, { id: "w-sneaker-2", cluster: "white-sneaker" }];
    const next = toggleCoachCompareSelection("w-sneaker-1", "white-sneaker", ["w-kurta-1"], withSneakers);
    expect(next.selected).toEqual(["w-sneaker-1"]);
  });

  it("refuses a unique save instead of selecting a dead pair", () => {
    const next = toggleCoachCompareSelection("w-sneaker-1", "white-sneaker", [], kurtas);
    expect(next.selected).toEqual([]);
    expect(next.reason).toMatch(/same kind/i);
  });

  it("ASK THE COACH pairs the look with the next similar save", () => {
    const next = pairForAskCoach("w-kurta-1", "kurta-set", [], kurtas);
    expect(next.selected).toEqual(["w-kurta-1", "w-kurta-2"]);
    expect(next.reason).toBeUndefined();
  });

  it("ASK THE COACH keeps an already picked similar peer", () => {
    const next = pairForAskCoach("w-kurta-1", "kurta-set", ["w-kurta-3"], kurtas);
    expect(next.selected).toEqual(["w-kurta-1", "w-kurta-3"]);
  });

  it("ASK THE COACH stays in the same gender", () => {
    const next = pairForAskCoach("w-sneaker-1", "white-sneaker", [], [
      { id: "w-sneaker-1", cluster: "white-sneaker", gender: "women" },
      { id: "m-sneaker-1", cluster: "white-sneaker", gender: "men" }
    ]);
    expect(next.selected).toEqual([]);
    expect(next.reason).toMatch(/same kind/i);
  });
});
