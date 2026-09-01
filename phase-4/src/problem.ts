import { segmentContract } from "./segment.js";
import type {
  DecisionTreeOutcome,
  EvolutionChain,
  ExitCriteria,
  Fraction,
  Phase4Inputs,
  ProblemDefinition,
  ProblemField,
  QuoteIntegrity,
  Signals,
  Theme,
  ThemeQuote
} from "./types.js";

const NORTH_STAR = "Wishlist-to-Purchase within 30 days (W2P 30d)";
const CONSTRAINT = "No monetary incentive as the core lever";

function frac(fraction: Fraction): string {
  return `${fraction.count}/${fraction.of}`;
}

/** Quotes carrying a live review id. Fixture seeds are never presented as research. */
function isLive(quote: ThemeQuote): boolean {
  return !/^fix-/.test(quote.reviewId) && quote.source !== "fixture";
}

export function quoteIntegrity(themes: Theme[], signals: Signals): QuoteIntegrity {
  const seen = new Set<string>();
  const all: ThemeQuote[] = [];
  for (const theme of themes) {
    for (const quote of theme.quotes ?? []) {
      if (seen.has(quote.reviewId)) continue;
      seen.add(quote.reviewId);
      all.push(quote);
    }
  }
  const live = all.filter(isLive);

  return {
    participantVerbatimAvailable: signals.instrument.freeTextCollected,
    reason: signals.instrument.freeTextCollected
      ? "The instrument collected free text."
      : "The Phase 3 instrument was a closed-option form with no free-text field, so it produced counts rather than sentences. Presenting a fixture line as a participant quote would misrepresent the research.",
    liveCount: live.length,
    illustrativeCount: all.length - live.length,
    liveQuotes: live
  };
}

function targetSegment(signals: Signals): ProblemField {
  const { segment, statedVsRevealed, confidence } = signals;

  return {
    field: "Target user segment",
    statement:
      `The Stalled Shortlister — a shopper who saves several items they genuinely like, returns to the list, ` +
      `and leaves without deciding because nothing in the list helps them finish a judgement. ` +
      `${frac(segment.stalls)} convert sometimes or less, ${frac(statedVsRevealed.comparesInApp)} compare inside the app, ` +
      `and confidence that a saved item is right for them averages ${confidence?.mean ?? "n/a"} ` +
      `(range ${confidence?.min ?? "n/a"}–${confidence?.max ?? "n/a"}). Fit-led S2 gives way to compare-led S4, with fit secondary.`,
    evidence: [
      {
        source: "survey",
        ref: "Q5",
        detail: `${frac(segment.stalls)} buy from saves sometimes or less`
      },
      {
        source: "survey",
        ref: "Q11",
        detail: `${frac(statedVsRevealed.comparesInApp)} compare in-app, ${frac(statedVsRevealed.readsReviews)} read reviews or photos`
      },
      {
        source: "survey",
        ref: "Q9",
        detail: `confidence mean ${confidence?.mean ?? "n/a"}, minimum ${confidence?.min ?? "n/a"}`
      },
      {
        source: "survey",
        ref: "Q3 ∩ Q5",
        detail: `${frac(segment.inSegment)} match the strict staller definition (${segment.inSegment.ids.join(", ") || "none"})`
      }
    ],
    caveats: [
      segment.targetMet
        ? `In-segment n = ${segment.inSegment.count}, target ${segment.target} — met.`
        : `In-segment n = ${segment.inSegment.count} against a target of ${segment.target}. Segment-specific claims rest on ${segment.inSegment.count} ${segment.inSegment.count === 1 ? "person" : "people"} and are labelled throughout. This is the weakest part of the lock.`,
      "S3 sale-watchers stay a control persona, not the audience."
    ]
  };
}

function productOutcome(signals: Signals, tree: DecisionTreeOutcome): ProblemField {
  const primary = signals.nodes.find((node) => node.node === tree.primaryNode);
  const secondary = signals.nodes.find((node) => node.node === tree.secondaryNode);
  const margin = (primary?.respondents.count ?? 0) - (secondary?.respondents.count ?? 0);

  const caveats = [
    "Guardrail: return rate must not rise, and removal-heavy cohorts must not convert worse than untouched ones."
  ];
  if (margin <= 1) {
    caveats.unshift(
      `Thin margin: ${tree.primaryNode} leads ${tree.secondaryNode} by ${margin} respondent${margin === 1 ? "" : "s"}. ` +
        `The case for ${tree.primaryNode} rests on the unlock-versus-help evidence in the root cause, not on this share alone, ` +
        `and the two nodes are close enough that the secondary outcome must ship alongside the primary rather than after it.`
    );
  }

  return {
    field: "Product outcome",
    statement:
      `Shortlist-to-decision rate — the share of saved items that reach an explicit decision, bought or deliberately dropped, ` +
      `within 30 days of being saved. That is the ${tree.primaryNode} node, not ${tree.secondaryNode}: ` +
      `${primary ? frac(primary.respondents) : "n/a"} of respondents show an unfinished ${tree.primaryNode} job against ` +
      `${secondary ? frac(secondary.respondents) : "n/a"} for ${tree.secondaryNode}. Uncertainty resolution rate is the secondary outcome. ` +
      `A deliberate removal counts as success, so the metric cannot be moved by pressure tactics.`,
    evidence: [
      {
        source: "survey",
        ref: primary?.reason ?? "Q11",
        detail: `${tree.primaryNode}: ${primary ? frac(primary.respondents) : "n/a"}`
      },
      {
        source: "survey",
        ref: secondary?.reason ?? "Q10",
        detail: `${tree.secondaryNode}: ${secondary ? frac(secondary.respondents) : "n/a"}`
      },
      {
        source: "phase2",
        ref: "metric-tree.json",
        detail: "Revisit × uncertainty resolution × decision completion decompose W2P 30d"
      }
    ],
    caveats
  };
}

function rootCause(signals: Signals, tree: DecisionTreeOutcome): ProblemField {
  const { unlockSwitch, statedVsRevealed, valueConfidence, segment } = signals;

  return {
    field: "Root cause",
    statement:
      `A wishlist captures interest but offers no way to finish a judgement — neither "which of these is right for me" nor ` +
      `"is this worth what it costs". With no judgement aid available, the only decision tool the app offers is a falling price, ` +
      `so intent parks on a sale that may never arrive inside 30 days. Price is the symptom of a missing capability, not a demand for money.`,
    evidence: [
      {
        source: "survey",
        ref: "Q8 vs Q11",
        detail: `${frac(statedVsRevealed.statedPriceBarrier)} name price as the main blocker, but only ${frac(statedVsRevealed.waitsForSale)} actually wait for a sale and ${frac(statedVsRevealed.saleWaitOnly)} do nothing else`
      },
      {
        source: "survey",
        ref: "Q12 → Q13",
        detail: `all ${unlockSwitch.monetary.count} discount-seekers (${unlockSwitch.monetary.ids.join(", ")}) ask for information when offered help; ${unlockSwitch.askedPriceJudgement.count} ask specifically to understand whether the price is good`
      },
      {
        source: "survey",
        ref: "Q11",
        detail: `${frac(unlockSwitch.researchesAnyway)} of the discount-seekers research or compare before buying anyway — the non-tautological half of the finding`
      },
      {
        source: "survey",
        ref: "Q13",
        detail: `top request for help is "${valueConfidence.topHelpAnswer?.answer ?? "n/a"}" (${valueConfidence.topHelpAnswer?.count ?? 0}/${signals.respondents})`
      }
    ],
    caveats: [
      `Challenged in segment: ${frac(segment.inSegmentMonetaryUnlock)} in-segment respondents chose a discount as the unlock.`,
      segment.inSegmentPriceJudgementHelp.count > 0
        ? `Mitigated by the same respondents: ${frac(segment.inSegmentPriceJudgementHelp)} of them asked for a price verdict on Q13.`
        : "No in-segment respondent asked for a price verdict, which weakens this reading.",
      signals.instrument.priceHeldConstant
        ? "Price was held constant, so the reading is controlled."
        : "Unresolved by instrument design: price was never held constant. Until brief questions 3 and 4 are asked as written, a real price constraint cannot be separated from the easiest available answer.",
      tree.constraintConflict.navigableBecause === null
        ? "The escape hatch is closed on this data — treat the root cause as unsupported."
        : "The constraint conflict is navigable but not resolved."
    ]
  };
}

function workaroundsField(signals: Signals): ProblemField {
  const ranked = signals.workarounds.slice(0, 4);
  const offApp = signals.workarounds.filter((row) => row.offApp);

  return {
    field: "Existing workarounds",
    statement:
      `Shoppers already finish the judgement outside the wishlist: ` +
      ranked.map((row) => `${row.behaviour.toLowerCase()} (${row.count}/${row.of})`).join(", ") +
      `. ${offApp.length} of the reported behaviours leave the app entirely, and easy returns are used as a substitute for deciding.`,
    evidence: [
      {
        source: "survey",
        ref: "Q11",
        detail: signals.workarounds
          .map((row) => `${row.behaviour} ${row.count}/${row.of}`)
          .join(" · ")
      },
      {
        source: "discovery",
        ref: "return-fear",
        detail: "\"I can always return it\" delays the order — frequency 0.383"
      },
      {
        source: "discovery",
        ref: "review-trust-gap",
        detail: "Shoppers leave for YouTube and Instagram try-ons before buying"
      }
    ],
    caveats: [
      "Every workaround is a judgement made outside the product, which is why they read as evidence of the missing capability rather than as satisfied need."
    ]
  };
}

function userValue(signals: Signals): ProblemField {
  const { valueConfidence, aiVerdict } = signals;

  return {
    field: "User value",
    statement:
      `Closure. A defensible choice — knowing why this one and not the other two — and a defensible price, ` +
      `which ${frac(valueConfidence.demand)} ask for and nothing currently answers. Fewer open loops: no second app, no group chat, no video detour before ordering. ` +
      `Confidence is the mechanism; the felt benefit is finishing.`,
    evidence: [
      {
        source: "survey",
        ref: "Q13 + Q12",
        detail: `${frac(valueConfidence.demand)} ask for a value verdict on either question`
      },
      {
        source: "survey",
        ref: "Q9",
        detail: `confidence mean ${signals.confidence?.mean ?? "n/a"} — the doubt is real before the purchase, not after`
      }
    ],
    caveats: [
      `Framing matters: an AI that announces which items are worth buying scores only ${aiVerdict?.mean ?? "n/a"} (min ${aiVerdict?.min ?? "n/a"}), so the value must be delivered as evidence, not as a verdict from the app.`
    ]
  };
}

function businessValue(signals: Signals, inputs: Phase4Inputs): ProblemField {
  const fitTheme = inputs.ranking.find((row) => row.themeId === "return-fear");

  return {
    field: "Business value",
    statement:
      `W2P 30d rises through decision completion rather than margin: every point of shortlist-to-decision rate is a purchase that would otherwise have decayed, ` +
      `bought at full price. Margin is protected because the intervention is information, and nothing trains shoppers to wait for the next sale. ` +
      `Return-rate exposure falls where fit doubt is resolved before ordering, and demand shifts out of sale windows if waiting is a default rather than a preference.`,
    evidence: [
      {
        source: "survey",
        ref: "Q11",
        detail: `${frac(signals.statedVsRevealed.waitsForSale)} wait for a sale today — the volume that could move into non-sale weeks`
      },
      {
        source: "discovery",
        ref: "return-fear",
        detail: `try-and-buy used as the decision, frequency ${fitTheme?.estimatedFrequency ?? "n/a"}`
      },
      {
        source: "phase2",
        ref: "nomination.json",
        detail: `price levers were already excluded upstream: ${inputs.nomination.explicitlyNotPursuing[0] ?? "n/a"}`
      }
    ],
    caveats: [
      "All four claims are conditional on the root cause being right, and the root cause states how it can be shown wrong."
    ]
  };
}

export function buildEvolutionChain(
  inputs: Phase4Inputs,
  signals: Signals,
  tree: DecisionTreeOutcome
): EvolutionChain {
  const top = [...inputs.ranking].sort((a, b) => a.rank - b.rank).slice(0, 4);
  const themesLine = top
    .map((row) => `${row.label} ${row.score.toFixed(3)}${row.priceFlag ? " (price-flagged)" : ""}`)
    .join(" · ");

  const steps = [
    { stage: "Business metric", via: "assignment", value: NORTH_STAR },
    {
      stage: "Product outcomes",
      via: "decompose (Phase 2)",
      value: "Revisit × uncertainty resolution × decision completion"
    },
    {
      stage: "Themes / ranked opportunities",
      via: `AI discovery (Phase 1 — ${inputs.stats.rawCount} raw → ${inputs.stats.normalizedCount} normalized, ${inputs.stats.validatedThemeCount} themes)`,
      value: `${themesLine} … +${Math.max(inputs.ranking.length - top.length, 0)} more`
    },
    {
      stage: "Validation",
      via: `primary research (Phase 3 — n = ${signals.respondents})`,
      value:
        `stall, low confidence (mean ${signals.confidence?.mean ?? "n/a"}), comparison and review-reliance CONFIRMED · ` +
        `fit-as-leading-barrier CHALLENGED (${frac(signals.fitChallenge.namedAsUnlock)} unlock) · ` +
        `clutter premise CHALLENGED (modal bucket "${signals.saveVolume.modalBucket}") · ` +
        `AI-verdict NOT SUPPORTED (mean ${signals.aiVerdict?.mean ?? "n/a"}) · ` +
        `NEW: value confidence requested by ${frac(signals.valueConfidence.demand)}`
    },
    {
      stage: "Problem",
      via: "problem definition (Phase 4)",
      value:
        "The Stalled Shortlister cannot finish a judgement inside the wishlist, so intent parks on a sale. " +
        "Price is the symptom of a missing judgement aid."
    },
    {
      stage: "MVP direction",
      via: "solution direction (input to Phase 5, not a Phase 4 output)",
      value: `${tree.requiredSurfaces.join(" + ")} — ${tree.rescopeInstruction}`
    }
  ];

  return {
    steps,
    complete: steps.every((step) => step.value.trim().length > 0 && !/\bTBD\b/.test(step.value))
  };
}

function falsification(signals: Signals): Array<{ claim: string; falsifiedBy: string }> {
  return [
    {
      claim: "Price is a symptom, not the cause",
      falsifiedBy:
        "Asking brief questions 3 and 4 as written, with price explicitly frozen, and price still dominating in segment"
    },
    {
      claim: `${signals.surveyTopNode} outranks resolve`,
      falsifiedBy:
        "In-segment shoppers naming fit information as the unlock more often than comparison or value help"
    },
    {
      claim: "Deliberate removals are a success",
      falsifiedBy: "Removal-heavy cohorts showing lower W2P 30d than untouched cohorts"
    },
    {
      claim: `Value confidence is wanted (${frac(signals.valueConfidence.demand)})`,
      falsifiedBy: "Shoppers ignoring a fair-price explanation while still converting on discounts"
    },
    {
      claim: "The segment exists at useful size",
      falsifiedBy: `Targeted recruiting failing to find stalled shortlisters beyond ${signals.segment.inSegment.ids.join(", ") || "the current sample"}`
    }
  ];
}

function exitCriteria(
  fields: ProblemDefinition["fields"],
  chain: EvolutionChain,
  tree: DecisionTreeOutcome
): ExitCriteria {
  const filled = Object.values(fields).every((field) => field.statement.trim().length > 0);
  const recorded = tree.verdicts.length === 3;
  const avoided = tree.incentiveMvpAllowed === false;
  const unmet: string[] = [];

  if (!filled) unmet.push("One or more of the six Part 4 fields is empty.");
  if (!chain.complete) unmet.push("Evolution chain still contains a TBD.");
  if (!recorded) unmet.push("Decision tree was not evaluated against all three branches.");
  if (!avoided) unmet.push("An incentive MVP was not ruled out.");

  return {
    sixFieldsFilled: filled,
    evolutionChainComplete: chain.complete,
    decisionTreeRecorded: recorded,
    incentiveMvpAvoided: avoided,
    met: unmet.length === 0,
    unmet
  };
}

export function buildProblemDefinition(
  inputs: Phase4Inputs,
  signals: Signals,
  tree: DecisionTreeOutcome,
  now = new Date()
): ProblemDefinition {
  const fields = {
    targetSegment: targetSegment(signals),
    productOutcome: productOutcome(signals, tree),
    rootCause: rootCause(signals, tree),
    workarounds: workaroundsField(signals),
    userValue: userValue(signals),
    businessValue: businessValue(signals, inputs)
  };

  const chain = buildEvolutionChain(inputs, signals, tree);
  const criteria = exitCriteria(fields, chain, tree);

  const caveats: string[] = [];
  if (!signals.segment.targetMet) {
    caveats.push(
      `In-segment n = ${signals.segment.inSegment.count} against a target of ${signals.segment.target}. The lock is usable but segment claims are thin.`
    );
  }
  if (!signals.instrument.priceHeldConstant) {
    caveats.push(signals.instrument.note);
  }
  if (!inputs.nomination.readyForPhase3) {
    caveats.push("Phase 2 nomination reported readyForPhase3 = false; treat the ranking input as provisional.");
  }
  if (tree.outcome === "stop") {
    caveats.push("Decision tree returned stop. Do not build; this is a documented dead end, not a scope note.");
  }

  return {
    northStar: NORTH_STAR,
    constraint: CONSTRAINT,
    headline:
      "The Stalled Shortlister cannot finish a judgement inside the wishlist — neither which of these, " +
      "nor is it worth the price — so intent parks on a sale that may never arrive.",
    fields,
    segmentContract: segmentContract(signals),
    decisionTree: tree,
    evolutionChain: chain,
    quotes: quoteIntegrity(inputs.themes, signals),
    falsification: falsification(signals),
    exitCriteria: criteria,
    readyForPhase5: criteria.met && tree.outcome !== "stop",
    caveats,
    generatedAt: now.toISOString()
  };
}
