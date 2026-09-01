import type {
  BranchVerdict,
  DecisionTreeOutcome,
  MetricNode,
  Nomination,
  Signals,
  TreeOutcome
} from "./types.js";

const FORBIDDEN = [
  "Discounts or coupons on wishlisted items",
  "Price-drop alerts as the core lever",
  "EOSS or sale-window nudges",
  "Scarcity or urgency pressure to force a decision"
];

function ratio(count: number, of: number): number {
  return of === 0 ? 0 : count / of;
}

/**
 * Runs the tree from problemstatement.md §4.3 against the computed signals.
 *
 * The branch that matters is the second one. If the shoppers who ask for a
 * discount neither research nor ask for a value verdict, price is binding and
 * the honest output is `stop` — the tree is not decoration, and this function
 * will return `stop` on data that says so.
 */
export function evaluateDecisionTree(
  signals: Signals,
  nomination: Nomination
): DecisionTreeOutcome {
  const { unlockSwitch, segment, valueConfidence, nodes, surveyTopNode, instrument } = signals;

  const ranked = [...nodes].sort((a, b) => b.respondents.count - a.respondents.count);
  const primaryNode = surveyTopNode;
  const secondaryNode = (ranked.find((node) => node.node !== primaryNode)?.node ??
    "resolve") as MetricNode;

  const primaryShare = ratio(
    ranked.find((node) => node.node === primaryNode)?.respondents.count ?? 0,
    signals.respondents
  );
  const nonMonetaryBlockerConfirmed = primaryShare > 0.5;
  const priceDominant = segment.priceDominantInSegment;

  /**
   * "Even at current price" is the whole point of the terminal test. If the
   * instrument never froze price, a stated price barrier can still be an
   * artefact of the question, so the escape hatch stays open — but only while
   * the same shoppers show non-monetary behaviour and demand.
   */
  const escapeHatch = unlockSwitch.allResearch && valueConfidence.demand.count > 0;
  const priceTerminal = priceDominant && (instrument.priceHeldConstant || !escapeHatch);

  const branchOne: BranchVerdict = {
    branch: "proceed-as-specified",
    fired: nonMonetaryBlockerConfirmed && !priceDominant,
    terminal: false,
    because: [
      `${nonMonetaryBlockerConfirmed ? "Confirmed" : "Not confirmed"}: a non-monetary ${primaryNode} blocker covers ${ranked[0]?.respondents.count ?? 0}/${signals.respondents} respondents.`,
      priceDominant
        ? `In-segment price dominance is in play — ${segment.inSegmentMonetaryUnlock.count}/${segment.inSegment.count} chose a discount, so this branch cannot be taken cleanly.`
        : "In-segment price dominance is absent."
    ]
  };

  const branchTwo: BranchVerdict = {
    branch: "price-dominant",
    fired: priceDominant,
    terminal: priceTerminal,
    because: priceDominant
      ? [
          `${segment.inSegmentMonetaryUnlock.count}/${segment.inSegment.count} in-segment respondents named a discount as the unlock.`,
          instrument.priceHeldConstant
            ? "Price was held constant, so this reads as a real constraint."
            : "Price was never held constant, so a real constraint cannot be separated from the easiest available answer.",
          escapeHatch
            ? `Non-terminal: all ${unlockSwitch.monetary.count} discount-seekers research or compare anyway, and ${valueConfidence.demand.count}/${signals.respondents} ask for a value verdict.`
            : "Terminal: the discount-seekers show no non-monetary behaviour or demand."
        ]
      : ["In-segment price dominance is absent."]
  };

  const forkFired = Boolean(nomination.metricNode) && nomination.metricNode !== primaryNode;
  const branchThree: BranchVerdict = {
    branch: "fork",
    fired: forkFired,
    terminal: false,
    because: forkFired
      ? [
          `Phase 2 nominated ${nomination.metricNode}; the questionnaire ranks ${primaryNode} first (${ranked[0]?.respondents.count}/${signals.respondents} vs ${ranked[1]?.respondents.count}/${signals.respondents}).`,
          "Phase 5 scope is rewritten to the higher-ranked node before any coach contracts."
        ]
      : [`Questionnaire agrees with the Phase 2 node (${nomination.metricNode}).`]
  };

  let outcome: TreeOutcome = "proceed-rescoped";
  if (priceTerminal) outcome = "stop";
  else if (branchOne.fired && !forkFired) outcome = "proceed-as-specified";

  const requiredSurfaces = [
    `Decision completion on a shortlist (${primaryNode})`,
    `Fit and quality evidence at the moment of doubt (${secondaryNode})`
  ];
  if (!valueConfidence.built && valueConfidence.demand.count > 0) {
    requiredSurfaces.push(
      `Value confidence — "is this a fair price, and should I decide now?" (${valueConfidence.demand.count}/${signals.respondents} ask for it, nothing ships it)`
    );
  }

  return {
    verdicts: [branchOne, branchTwo, branchThree],
    outcome,
    incentiveMvpAllowed: false,
    primaryNode,
    secondaryNode,
    requiredSurfaces,
    forbidden: [...new Set([...FORBIDDEN, ...nomination.explicitlyNotPursuing])],
    rescopeInstruction:
      outcome === "stop"
        ? "Do not build. Price is binding in segment; document the conflict and pick another evidenced problem or stop."
        : `Read Phase 5 ${primaryNode}-first rather than ${nomination.metricNode}-first, and add the value-confidence surface. No incentive of any kind.`,
    constraintConflict: {
      present: priceDominant || unlockSwitch.monetary.count > 0,
      statement: `${unlockSwitch.monetary.count}/${signals.respondents} name a discount as the single unlock (${segment.inSegmentMonetaryUnlock.count}/${segment.inSegment.count} in segment), while the brief forbids monetary incentives as the core lever.`,
      navigableBecause: escapeHatch
        ? `All ${unlockSwitch.monetary.count} of them research or compare before buying, ${unlockSwitch.askedPriceJudgement.count} ask specifically to understand whether the price is good, and value confidence is information rather than money.`
        : null
    }
  };
}
