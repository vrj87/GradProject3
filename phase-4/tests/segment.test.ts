import { describe, expect, it } from "vitest";
import { deriveThresholds, referenceMatches, segmentContract } from "../src/segment.js";
import { computeSignals } from "../src/signals.js";
import { RANKING, REALISTIC, response, summaryFor } from "./fixtures.js";

const signals = computeSignals(REALISTIC, summaryFor(REALISTIC), RANKING);
const { thresholds } = deriveThresholds(signals);

describe("threshold derivation", () => {
  it("lowers the save floor to two when most shoppers hold five saves or fewer", () => {
    expect(thresholds.minRecentSaves).toBe(2);
    expect(thresholds.minSameCategory).toBe(2);
    expect(thresholds.windowDays).toBe(30);
  });

  it("keeps the floor at three when lists are large", () => {
    const big = REALISTIC.map((r) =>
      response(r.id, { ...(r.answers as unknown as Record<number, string[]>), 4: ["More than 50"] })
    );
    const derived = deriveThresholds(computeSignals(big, summaryFor(big), RANKING));
    expect(derived.thresholds.minRecentSaves).toBe(3);
    expect(derived.derivation.join(" ")).toMatch(/stays 3/);
  });

  it("explains every threshold it sets", () => {
    const { derivation } = deriveThresholds(signals);
    expect(derivation.length).toBeGreaterThanOrEqual(5);
    expect(derivation.join(" ")).toMatch(/lowered from 3 to 2/);
  });
});

describe("contract artefact", () => {
  const contract = segmentContract(signals);

  it("stays an interface and points at its Phase 5a implementation", () => {
    expect(contract.interfaceOnly).toBe(true);
    expect(contract.implementedIn).toMatch(/Phase 5a/);
    expect(contract.name).toBe("Stalled Shortlister");
    expect(contract.previousName).toBe("P1 Wishlist Staller");
  });

  it("emits source carrying the derived thresholds", () => {
    expect(contract.source).toMatch(/recent\.length < 2/);
    expect(contract.source).toMatch(/addedWithinDays\(30\)/);
    expect(contract.source).toMatch(/count >= 2/);
    expect(contract.source).toMatch(/Contract only/);
  });

  it("keeps sale-watchers as a control persona", () => {
    expect(contract.controlPersona).toMatch(/control/);
  });
});

describe("reference predicate", () => {
  const stalled = {
    wishlistItems: [
      { addedDaysAgo: 3, category: "kurta" },
      { addedDaysAgo: 10, category: "kurta" }
    ]
  };

  it("matches a shopper stuck between two comparable saves", () => {
    expect(referenceMatches(stalled, thresholds)).toBe(true);
  });

  it("checks opt-out before reading wishlist data", () => {
    expect(referenceMatches({ ...stalled, optedOut: true }, thresholds)).toBe(false);
  });

  it("rejects a single save", () => {
    expect(
      referenceMatches({ wishlistItems: [{ addedDaysAgo: 2, category: "kurta" }] }, thresholds)
    ).toBe(false);
  });

  it("rejects saves outside the 30-day window", () => {
    expect(
      referenceMatches(
        {
          wishlistItems: [
            { addedDaysAgo: 40, category: "kurta" },
            { addedDaysAgo: 50, category: "kurta" }
          ]
        },
        thresholds
      )
    ).toBe(false);
  });

  it("rejects a shopper who is already converting", () => {
    expect(
      referenceMatches(
        {
          wishlistItems: [
            { addedDaysAgo: 3, category: "kurta", purchasedDaysAgo: 1 },
            { addedDaysAgo: 4, category: "kurta", purchasedDaysAgo: 2 }
          ]
        },
        thresholds
      )
    ).toBe(false);
  });

  it("needs two items in one category, not two across categories", () => {
    expect(
      referenceMatches(
        {
          wishlistItems: [
            { addedDaysAgo: 3, category: "kurta" },
            { addedDaysAgo: 4, category: "sneakers" }
          ]
        },
        thresholds
      )
    ).toBe(false);
  });
});
