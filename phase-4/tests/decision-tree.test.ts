import { describe, expect, it } from "vitest";
import { evaluateDecisionTree } from "../src/decision-tree.js";
import { computeSignals } from "../src/signals.js";
import {
  FIT_LED,
  NOMINATION,
  PRICE_BOUND,
  RANKING,
  REALISTIC,
  summaryFor
} from "./fixtures.js";

function treeFor(responses: typeof REALISTIC, nomination = NOMINATION) {
  const signals = computeSignals(responses, summaryFor(responses), RANKING);
  return { signals, tree: evaluateDecisionTree(signals, nomination) };
}

describe("delivered data", () => {
  const { tree } = treeFor(REALISTIC);

  it("cannot take the clean proceed branch while in-segment price dominance is unresolved", () => {
    const branch = tree.verdicts.find((v) => v.branch === "proceed-as-specified");
    expect(branch?.fired).toBe(false);
    expect(branch?.because.join(" ")).toMatch(/cannot be taken cleanly/);
  });

  it("fires the price-dominant branch without making it terminal", () => {
    const branch = tree.verdicts.find((v) => v.branch === "price-dominant");
    expect(branch?.fired).toBe(true);
    expect(branch?.terminal).toBe(false);
    expect(branch?.because.join(" ")).toMatch(/never held constant/);
  });

  it("forks because the questionnaire outranks the nomination node", () => {
    const branch = tree.verdicts.find((v) => v.branch === "fork");
    expect(branch?.fired).toBe(true);
    expect(tree.primaryNode).toBe("decide");
    expect(tree.secondaryNode).toBe("resolve");
  });

  it("proceeds re-scoped and never allows an incentive", () => {
    expect(tree.outcome).toBe("proceed-rescoped");
    expect(tree.incentiveMvpAllowed).toBe(false);
    expect(tree.forbidden.join(" ")).toMatch(/coupon/i);
  });

  it("names value confidence as a required surface", () => {
    expect(tree.requiredSurfaces.join(" ")).toMatch(/Value confidence/);
  });

  it("records the constraint conflict and why it is navigable", () => {
    expect(tree.constraintConflict.present).toBe(true);
    expect(tree.constraintConflict.navigableBecause).toMatch(/research or compare/);
  });
});

describe("price-bound data", () => {
  const { tree } = treeFor(PRICE_BOUND);

  it("stops rather than dressing a discount up as a product", () => {
    expect(tree.outcome).toBe("stop");
    const branch = tree.verdicts.find((v) => v.branch === "price-dominant");
    expect(branch?.terminal).toBe(true);
    expect(tree.rescopeInstruction).toMatch(/Do not build/);
    expect(tree.constraintConflict.navigableBecause).toBeNull();
  });
});

describe("fit-led data", () => {
  const { tree } = treeFor(FIT_LED);

  it("proceeds as originally specified when the evidence agrees with the nomination", () => {
    expect(tree.primaryNode).toBe("resolve");
    expect(tree.verdicts.find((v) => v.branch === "fork")?.fired).toBe(false);
    expect(tree.verdicts.find((v) => v.branch === "proceed-as-specified")?.fired).toBe(true);
    expect(tree.outcome).toBe("proceed-as-specified");
  });
});

describe("instrument that did hold price constant", () => {
  it("treats in-segment price dominance as terminal", () => {
    const signals = computeSignals(REALISTIC, summaryFor(REALISTIC), RANKING);
    const controlled = {
      ...signals,
      instrument: { ...signals.instrument, priceHeldConstant: true }
    };
    expect(evaluateDecisionTree(controlled, NOMINATION).outcome).toBe("stop");
  });
});
