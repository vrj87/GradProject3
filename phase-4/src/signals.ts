import {
  HELP_OPTIONS_INCLUDE_DISCOUNT,
  INSTRUMENT,
  Q,
  STALLING_PURCHASE_RATES,
  answers,
  first,
  isBookmarkIntent,
  isCompareIntent,
  isComparisonHelp,
  isFitDoubt,
  isInAppComparison,
  isMonetaryUnlock,
  isOffApp,
  isPriceBarrier,
  isPriceJudgement,
  isQualityDoubt,
  isReviewReading,
  isSaleWait,
  saveVolumeCeiling
} from "./questions.js";
import type {
  AnswerTally,
  FitChallengeSignal,
  Fraction,
  MetricNode,
  NodeEvidenceSignal,
  RankedTheme,
  SaveVolumeSignal,
  SegmentEvidenceSignal,
  Signals,
  StatedVsRevealedSignal,
  SurveyResponse,
  SurveySummary,
  UnlockSwitchSignal,
  ValueConfidenceSignal,
  WorkaroundSignal
} from "./types.js";

function fraction(ids: string[], of: number, label: string): Fraction {
  return { ids, count: ids.length, of, label };
}

/** Ids of respondents with at least one answer to `question` matching `test`. */
function matching(
  responses: SurveyResponse[],
  question: number,
  test: (answer: string) => boolean
): string[] {
  return responses.filter((r) => answers(r, question).some(test)).map((r) => r.id);
}

function tallyOf(responses: SurveyResponse[], question: number): AnswerTally[] {
  const counts = new Map<string, number>();
  for (const response of responses) {
    for (const answer of answers(response, question)) {
      counts.set(answer, (counts.get(answer) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([answer, count]) => ({ answer, count }))
    .sort((a, b) => b.count - a.count || a.answer.localeCompare(b.answer));
}

/**
 * The load-bearing signal of Phase 4.
 *
 * Q12 asks what offer would unlock the purchase and lists a discount. Q13 asks
 * what help would, and lists none. Reading the two together shows whether the
 * shoppers who ask for money are actually short of money or short of a verdict.
 *
 * Because Q13 has no monetary option, `allSwitched` alone would be close to a
 * tautology, so `researchesAnyway` carries the weight: it is drawn from Q11,
 * where waiting for a sale *is* an option and shoppers describe what they do.
 */
export function unlockSwitch(responses: SurveyResponse[]): UnlockSwitchSignal {
  const of = responses.length;
  const monetary = responses.filter((r) => {
    const unlock = first(r, Q.unlock);
    return unlock !== null && isMonetaryUnlock(unlock);
  });

  const switched = monetary.filter((r) => {
    const help = first(r, Q.help);
    return help !== null && !isMonetaryUnlock(help);
  });
  const priceJudgement = switched.filter((r) => isPriceJudgement(first(r, Q.help) ?? ""));
  const researches = monetary.filter((r) =>
    answers(r, Q.behaviour).some((a) => isReviewReading(a) || isInAppComparison(a))
  );

  return {
    monetary: fraction(monetary.map((r) => r.id), of, "named a discount as the unlock (Q12)"),
    switchedToInformation: fraction(
      switched.map((r) => r.id),
      monetary.length,
      "of those asked for information when offered help (Q13)"
    ),
    askedPriceJudgement: fraction(
      priceJudgement.map((r) => r.id),
      monetary.length,
      "of those asked to understand whether the price is good"
    ),
    researchesAnyway: fraction(
      researches.map((r) => r.id),
      monetary.length,
      "of those research or compare before buying (Q11)"
    ),
    perRespondent: monetary.map((r) => ({
      id: r.id,
      unlock: first(r, Q.unlock) ?? "",
      help: first(r, Q.help) ?? "",
      researches: answers(r, Q.behaviour).some((a) => isReviewReading(a) || isInAppComparison(a))
    })),
    allSwitched: monetary.length > 0 && switched.length === monetary.length,
    allResearch: monetary.length > 0 && researches.length === monetary.length,
    tautologyNote: HELP_OPTIONS_INCLUDE_DISCOUNT
      ? "Q13 offers a discount, so switching is a free choice."
      : "Q13 offers no discount, so a switch is partly forced by the option list. The " +
        "non-tautological evidence is researchesAnyway, taken from Q11 where waiting for a sale is offered."
  };
}

/** What shoppers say blocks them, against what they report doing. */
export function statedVsRevealed(responses: SurveyResponse[]): StatedVsRevealedSignal {
  const of = responses.length;
  const stated = matching(responses, Q.mainBarrier, isPriceBarrier);
  const waits = matching(responses, Q.behaviour, isSaleWait);
  const reviews = matching(responses, Q.behaviour, isReviewReading);
  const compares = matching(responses, Q.behaviour, isInAppComparison);
  const saleOnly = responses
    .filter((r) => {
      const behaviours = answers(r, Q.behaviour);
      return behaviours.length > 0 && behaviours.every(isSaleWait);
    })
    .map((r) => r.id);

  return {
    statedPriceBarrier: fraction(stated, of, "name price as the main reason (Q8)"),
    waitsForSale: fraction(waits, of, "actually wait for a sale (Q11)"),
    readsReviews: fraction(reviews, of, "read reviews or customer photos (Q11)"),
    comparesInApp: fraction(compares, of, "compare inside the app (Q11)"),
    saleWaitOnly: fraction(saleOnly, of, "wait for a sale and do nothing else (Q11)"),
    divergence: waits.length < stated.length
  };
}

/** Does the questionnaire support the Phase 2 nomination of fit as rank 1? */
export function fitChallenge(
  responses: SurveyResponse[],
  ranking: RankedTheme[]
): FitChallengeSignal {
  const of = responses.length;
  const fitTheme =
    ranking
      .filter((row) => row.barrierType === "fit")
      .sort((a, b) => a.rank - b.rank)[0] ?? null;

  const leading = responses
    .filter((r) => {
      const answer = first(r, Q.mainBarrier);
      return answer !== null && /size|fit/i.test(answer);
    })
    .map((r) => r.id);
  const unlock = responses
    .filter((r) => {
      const answer = first(r, Q.unlock);
      return answer !== null && /fit|size/i.test(answer);
    })
    .map((r) => r.id);
  const doubt = matching(responses, Q.uncertainty, isFitDoubt);

  return {
    discoveryRank: fitTheme?.rank ?? null,
    discoveryScore: fitTheme?.score ?? null,
    discoveryFrequency: fitTheme?.estimatedFrequency ?? null,
    leadingBarrier: fraction(leading, of, "name fit as the main reason (Q8)"),
    namedAsUnlock: fraction(unlock, of, "name fit information as the unlock (Q12)"),
    heldAsDoubt: fraction(doubt, of, "hold a size, fit, or appearance doubt (Q10)"),
    challenged:
      fitTheme?.rank === 1 && leading.length === 0 && unlock.length < doubt.length
  };
}

export function segmentEvidence(
  responses: SurveyResponse[],
  target = 5
): SegmentEvidenceSignal {
  const of = responses.length;
  const uses = responses.filter((r) => first(r, Q.usesWishlist) === "Yes");
  const stalls = responses.filter((r) =>
    STALLING_PURCHASE_RATES.includes(first(r, Q.purchaseRate) ?? "")
  );
  const inSegment = responses.filter(
    (r) =>
      first(r, Q.usesWishlist) === "Yes" &&
      STALLING_PURCHASE_RATES.includes(first(r, Q.purchaseRate) ?? "")
  );

  const monetary = inSegment.filter((r) => isMonetaryUnlock(first(r, Q.unlock) ?? ""));
  const judgement = inSegment.filter((r) => isPriceJudgement(first(r, Q.help) ?? ""));

  return {
    usesWishlist: fraction(uses.map((r) => r.id), of, "use a wishlist (Q3)"),
    stalls: fraction(stalls.map((r) => r.id), of, "convert sometimes or less (Q5)"),
    inSegment: fraction(inSegment.map((r) => r.id), of, "match the staller definition"),
    target,
    targetMet: inSegment.length >= target,
    priceDominantInSegment: inSegment.length > 0 && monetary.length / inSegment.length >= 0.5,
    inSegmentMonetaryUnlock: fraction(
      monetary.map((r) => r.id),
      inSegment.length,
      "in-segment respondents chose a discount (Q12)"
    ),
    inSegmentPriceJudgementHelp: fraction(
      judgement.map((r) => r.id),
      inSegment.length,
      "in-segment respondents asked for a price verdict (Q13)"
    )
  };
}

export function valueConfidence(responses: SurveyResponse[]): ValueConfidenceSignal {
  const of = responses.length;
  const help = matching(responses, Q.help, isPriceJudgement);
  const unlock = matching(responses, Q.unlock, isPriceJudgement);
  const demand = [...new Set([...help, ...unlock])];

  return {
    priceJudgementHelp: fraction(help, of, "ask to understand whether the price is good (Q13)"),
    buyNowOrWait: fraction(unlock, of, "ask to know whether to buy now or wait (Q12)"),
    topHelpAnswer: tallyOf(responses, Q.help)[0] ?? null,
    demand: fraction(demand, of, "ask for a value verdict on either question"),
    built: false
  };
}

export function saveVolume(responses: SurveyResponse[]): SaveVolumeSignal {
  const buckets = tallyOf(responses, Q.saveVolume);
  const modal = buckets[0] ?? null;
  const small = responses.filter((r) => {
    const ceiling = saveVolumeCeiling(first(r, Q.saveVolume) ?? "");
    return ceiling !== null && ceiling <= 5;
  });

  return {
    buckets,
    modalBucket: modal?.answer ?? null,
    modalCeiling: modal ? saveVolumeCeiling(modal.answer) : null,
    majorityAtOrBelowFive: small.length * 2 > responses.length
  };
}

/**
 * Which node of the metric tree the questionnaire actually points at. Each
 * respondent is counted once per node, so shares are people rather than ticks.
 */
export function nodeEvidence(responses: SurveyResponse[]): NodeEvidenceSignal[] {
  const of = responses.length;

  const decide = responses
    .filter(
      (r) =>
        answers(r, Q.behaviour).some(isInAppComparison) ||
        answers(r, Q.whySave).some(isCompareIntent) ||
        isComparisonHelp(first(r, Q.help) ?? "") ||
        isPriceJudgement(first(r, Q.help) ?? "")
    )
    .map((r) => r.id);

  const resolve = responses
    .filter(
      (r) =>
        answers(r, Q.uncertainty).some((a) => isFitDoubt(a) || isQualityDoubt(a)) ||
        /quality|reviews|fit|size/i.test(first(r, Q.help) ?? "")
    )
    .map((r) => r.id);

  const revisit = responses
    .filter(
      (r) =>
        saveVolumeCeiling(first(r, Q.saveVolume) ?? "") === Number.POSITIVE_INFINITY ||
        answers(r, Q.whySave).some(isBookmarkIntent)
    )
    .map((r) => r.id);

  return [
    {
      node: "decide",
      respondents: fraction(decide, of, "show an unfinished comparison or value judgement"),
      reason: "Q11 in-app comparison, Q7 save-to-compare, Q13 comparison or price-verdict help"
    },
    {
      node: "resolve",
      respondents: fraction(resolve, of, "hold a fit or quality doubt"),
      reason: "Q10 fit/size/appearance or quality/material doubt, Q13 quality or review help"
    },
    {
      node: "revisit",
      respondents: fraction(revisit, of, "carry a large or low-intent list"),
      reason: "Q4 more than 50 saves, or Q7 inspiration and browsing saves"
    }
  ];
}

export function workarounds(responses: SurveyResponse[]): WorkaroundSignal[] {
  return tallyOf(responses, Q.behaviour).map((row) => ({
    behaviour: row.answer,
    count: row.count,
    of: responses.length,
    offApp: isOffApp(row.answer)
  }));
}

export function computeSignals(
  responses: SurveyResponse[],
  summary: SurveySummary,
  ranking: RankedTheme[]
): Signals {
  const nodes = nodeEvidence(responses);
  const top = [...nodes].sort((a, b) => b.respondents.count - a.respondents.count)[0];

  return {
    respondents: responses.length,
    window: summary.window,
    unlockSwitch: unlockSwitch(responses),
    statedVsRevealed: statedVsRevealed(responses),
    fitChallenge: fitChallenge(responses, ranking),
    segment: segmentEvidence(responses),
    valueConfidence: valueConfidence(responses),
    saveVolume: saveVolume(responses),
    nodes,
    surveyTopNode: (top?.node ?? "decide") as MetricNode,
    workarounds: workarounds(responses),
    confidence: summary.scales.find((scale) => scale.id === Q.confidence) ?? null,
    aiVerdict: summary.scales.find((scale) => scale.id === Q.aiVerdict) ?? null,
    instrument: {
      priceHeldConstant: INSTRUMENT.priceHeldConstant,
      freeTextCollected: INSTRUMENT.freeTextCollected,
      note: INSTRUMENT.note
    }
  };
}
