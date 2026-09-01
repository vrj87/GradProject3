import { describe, expect, it } from "vitest";
import { CATALOG } from "@/lib/catalog";
import { COACH_TO_STOREFRONT, coachBagPayload } from "@/lib/storefrontBag";

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
});
