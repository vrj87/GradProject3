import { describe, expect, it } from "vitest";
import { CATALOG } from "@/lib/catalog";
import {
  COACH_TO_STOREFRONT,
  coachBagPayload,
  coachIdFromStorefront,
  resolvePairIds
} from "@/lib/storefrontBag";

describe("coach to storefront bag", () => {
  it("maps every demo SKU onto a storefront product id", () => {
    for (const item of CATALOG) {
      const payload = coachBagPayload(item);
      expect(payload.source).toBe("shortlist-coach");
      expect(payload.type).toBe("add-to-bag");
      expect(payload.productId).toBe(COACH_TO_STOREFRONT[item.id]?.productId);
      expect(payload.size.length).toBeGreaterThan(0);
      expect(payload.snapshot.name).toBe(item.name);
    }
  });

  it("maps a room pair of storefront ids onto coach catalog ids", () => {
    expect(coachIdFromStorefront("w-kurta-1")).toBe("p-kurta-anarkali");
    expect(coachIdFromStorefront("p-kurta-straight")).toBe("p-kurta-straight");
    expect(resolvePairIds("w-kurta-1,w-kurta-2")).toEqual(["p-kurta-anarkali", "p-kurta-straight"]);
    expect(resolvePairIds("w-kurta-1%2Cw-kurta-2")).toEqual(["p-kurta-anarkali", "p-kurta-straight"]);
    expect(resolvePairIds("w-kurta-1")).toEqual(["p-kurta-anarkali"]);
  });
});
