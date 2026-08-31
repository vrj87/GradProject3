import { describe, expect, it } from "vitest";
import { PRODUCTS, formatInr } from "../../apps/storefront/src/data/products";
import {
  fitPins,
  hangSlot,
  keepLook,
  sharedZones
} from "../../apps/storefront/src/lib/fittingRoom";

function byId(id: string) {
  const product = PRODUCTS.find((item) => item.id === id);
  if (!product) throw new Error(`missing ${id}`);
  return product;
}

describe("one price, no markdown", () => {
  it("sells every item at its MRP", () => {
    const markedDown = PRODUCTS.filter((item) => item.mrp !== item.price);
    expect(markedDown.map((item) => item.id)).toEqual([]);
    expect(PRODUCTS.every((item) => item.price > 0)).toBe(true);
  });

  it("leaves no percent-off badge in the catalog", () => {
    const badges = PRODUCTS.map((item) => item.badge).filter(Boolean) as string[];
    expect(badges.some((badge) => /%|off|sale|deal/i.test(badge))).toBe(false);
    expect(formatInr(1499)).toBe("₹1,499");
  });
});

describe("shared body zones", () => {
  it("names the same zone set on two kurtas", () => {
    const left = byId("w-kurta-1");
    const right = byId("w-kurta-2");
    const zones = sharedZones(left, right);
    expect(left.gender).toBe("women");
    expect(right.gender).toBe("women");
    expect(zones).toContain("bust");
    expect(zones).toContain("length");
    expect(zones.includes("foot")).toBe(false);
    expect(new Set(zones).size).toBe(zones.length);
  });

  it("keeps footwear on the foot zone only", () => {
    const sneakers = PRODUCTS.filter((item) => item.gender === "women" && item.cluster.includes("sneaker")).slice(
      0,
      2
    );
    expect(sneakers.length).toBe(2);
    const zones = sharedZones(sneakers[0]!, sneakers[1]!);
    expect(zones).toEqual(["foot"]);
    expect(fitPins(sneakers[0]!).every((pin) => pin.id === "foot")).toBe(true);
  });

  it("does not invent a mixed-gender hang pair", () => {
    const women = byId("w-kurta-1");
    const men = byId("m-ethnic-1");
    expect(women.gender).not.toBe(men.gender);
    const hanging = [women, byId("w-kurta-2")];
    const next = hangSlot(hanging, hanging, "right", men.id);
    expect(next.every((item) => item.gender === "women")).toBe(true);
    expect(next.some((item) => item.id === men.id)).toBe(false);
  });

  it("keeps one hanger and drops the other", () => {
    const hanging = [byId("w-kurta-1"), byId("w-kurta-2"), byId("w-kurta-3")];
    const result = keepLook(hanging.slice(0, 2), "w-kurta-2");
    expect(result.dropped?.id).toBe("w-kurta-1");
    expect(result.kept[0]?.id).toBe("w-kurta-2");
    expect(result.kept.some((item) => item.id === "w-kurta-1")).toBe(false);
  });

  it("leaves the kept look first on a deep rack so the size step gets it", () => {
    const rack = [byId("w-kurta-1"), byId("w-kurta-2"), byId("w-kurta-3"), byId("w-kurta-4")];
    const result = keepLook(rack, "w-kurta-1");
    expect(result.kept[0]?.id).toBe("w-kurta-1");
    expect(result.dropped?.id).toBe("w-kurta-2");
    // The rest stay available to swap in, but only the kept look drives the size step.
    expect(result.kept.map((item) => item.id)).toEqual(["w-kurta-1", "w-kurta-3", "w-kurta-4"]);
  });
});
