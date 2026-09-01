import { describe, expect, it } from "vitest";
import { computeSignals } from "../src/signals.js";
import { PRICE_BOUND, RANKING, REALISTIC, summaryFor } from "./fixtures.js";

const signals = computeSignals(REALISTIC, summaryFor(REALISTIC), RANKING);

describe("unlock switch", () => {
  it("finds every respondent who named a discount as the unlock", () => {
    expect(signals.unlockSwitch.monetary.ids).toEqual(["r01", "r03", "r05", "r07"]);
    expect(signals.unlockSwitch.monetary.of).toBe(9);
  });

  it("counts how many asked for a price verdict once help was on offer", () => {
    expect(signals.unlockSwitch.askedPriceJudgement.ids).toEqual(["r01", "r03", "r07"]);
    expect(signals.unlockSwitch.allSwitched).toBe(true);
  });

  it("treats research behaviour as the non-tautological half of the finding", () => {
    expect(signals.unlockSwitch.researchesAnyway.count).toBe(4);
    expect(signals.unlockSwitch.allResearch).toBe(true);
    expect(signals.unlockSwitch.tautologyNote).toMatch(/researchesAnyway/);
  });

  it("does not credit a switch when discount-seekers only wait for a sale", () => {
    const bound = computeSignals(PRICE_BOUND, summaryFor(PRICE_BOUND), RANKING);
    expect(bound.unlockSwitch.monetary.count).toBe(2);
    expect(bound.unlockSwitch.allResearch).toBe(false);
    expect(bound.unlockSwitch.askedPriceJudgement.count).toBe(0);
  });
});

describe("stated versus revealed", () => {
  it("separates what people say from what they do", () => {
    expect(signals.statedVsRevealed.statedPriceBarrier.count).toBe(5);
    expect(signals.statedVsRevealed.waitsForSale.count).toBe(2);
    expect(signals.statedVsRevealed.saleWaitOnly.ids).toEqual(["r06"]);
    expect(signals.statedVsRevealed.divergence).toBe(true);
  });
});

describe("fit challenge", () => {
  it("marks the rank-1 discovery theme as challenged when nobody leads with it", () => {
    expect(signals.fitChallenge.discoveryRank).toBe(1);
    expect(signals.fitChallenge.leadingBarrier.count).toBe(0);
    expect(signals.fitChallenge.namedAsUnlock.count).toBe(1);
    expect(signals.fitChallenge.heldAsDoubt.count).toBeGreaterThan(
      signals.fitChallenge.namedAsUnlock.count
    );
    expect(signals.fitChallenge.challenged).toBe(true);
  });
});

describe("segment", () => {
  it("keeps the in-segment sample and its shortfall visible", () => {
    expect(signals.segment.inSegment.ids).toEqual(["r03", "r07"]);
    expect(signals.segment.targetMet).toBe(false);
    expect(signals.segment.priceDominantInSegment).toBe(true);
    expect(signals.segment.inSegmentPriceJudgementHelp.count).toBe(2);
  });
});

describe("value confidence", () => {
  it("counts demand across both the offer and the help question", () => {
    expect(signals.valueConfidence.priceJudgementHelp.count).toBe(4);
    expect(signals.valueConfidence.buyNowOrWait.ids).toEqual(["r09"]);
    expect(signals.valueConfidence.demand.count).toBe(5);
    expect(signals.valueConfidence.built).toBe(false);
  });
});

describe("node evidence", () => {
  it("ranks decide above resolve on this sample", () => {
    const decide = signals.nodes.find((node) => node.node === "decide");
    const resolve = signals.nodes.find((node) => node.node === "resolve");
    expect(decide?.respondents.count).toBeGreaterThan(resolve?.respondents.count ?? 0);
    expect(signals.surveyTopNode).toBe("decide");
  });
});

describe("save volume and workarounds", () => {
  it("reads the modal bucket rather than assuming clutter", () => {
    expect(signals.saveVolume.modalBucket).toBe("1–5");
    expect(signals.saveVolume.majorityAtOrBelowFive).toBe(true);
  });

  it("orders workarounds by respondents and flags the off-app ones", () => {
    expect(signals.workarounds[0]?.behaviour).toBe("Read customer reviews");
    expect(signals.workarounds.find((row) => row.behaviour === "Check Instagram/YouTube")?.offApp).toBe(
      true
    );
  });
});

describe("instrument limits", () => {
  it("travels with the signals so downstream code cannot forget them", () => {
    expect(signals.instrument.priceHeldConstant).toBe(false);
    expect(signals.instrument.freeTextCollected).toBe(false);
  });
});
