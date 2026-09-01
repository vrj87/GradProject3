import type {
  Nomination,
  PipelineStats,
  RankedTheme,
  SurveyResponse,
  SurveySummary,
  Theme
} from "../src/types.js";

/** Answer keys arrive as strings in the Phase 3 export. */
export function response(id: string, answers: Record<number, string[]>): SurveyResponse {
  const keyed: Record<string, string[]> = {};
  for (const [question, value] of Object.entries(answers)) {
    keyed[question] = value;
  }
  return { id, submittedAt: "2026-08-29T00:00:00.000Z", answers: keyed };
}

/**
 * Four discount-seekers who research anyway, two of them in segment — the shape
 * of the delivered data, small enough to reason about.
 */
export const REALISTIC: SurveyResponse[] = [
  response("r01", {
    3: ["No"],
    4: ["1–5"],
    5: ["Almost never"],
    7: ["I want to wait for a better price"],
    8: ["It was too expensive"],
    9: ["3"],
    10: ["Price/value", "Material/fabric"],
    11: ["Read customer reviews"],
    12: ["Price drop/discount"],
    13: ["Understanding whether the price is good"],
    14: ["3"]
  }),
  response("r02", {
    3: ["Yes"],
    4: ["1–5"],
    5: ["Almost always"],
    7: ["I want to wait for a better price"],
    8: ["I wasn't sure about the quality"],
    9: ["2"],
    10: ["Price/value", "Size", "Quality"],
    11: ["Read customer reviews", "Compare with other products on the same app"],
    12: ["Better fit/size information"],
    13: ["Understanding whether the price is good"],
    14: ["2"]
  }),
  response("r03", {
    3: ["Yes"],
    4: ["1–5"],
    5: ["Sometimes"],
    7: ["I want to compare it with other products", "I want to wait for a better price"],
    8: ["It was too expensive"],
    9: ["2"],
    10: ["Price/value", "How it will look on me"],
    11: ["Read customer reviews", "Check size/fit reviews"],
    12: ["Price drop/discount"],
    13: ["Understanding whether the price is good"],
    14: ["2"]
  }),
  response("r04", {
    3: ["Yes"],
    4: ["1–5"],
    5: ["Almost always"],
    7: ["I genuinely intend to buy it later"],
    8: ["It was too expensive"],
    9: ["6"],
    10: ["Price/value"],
    11: ["Read customer reviews", "Compare with other products on the same app"],
    12: ["Better reviews/ratings"],
    13: ["Finding the best product among my wishlist"],
    14: ["5"]
  }),
  response("r05", {
    3: ["No"],
    4: ["1–5"],
    5: ["Sometimes"],
    7: ["I like the product but don't want to buy it immediately"],
    8: ["I was waiting for the right occasion"],
    9: ["4"],
    10: ["Whether I actually need it"],
    11: ["Read customer reviews", "Compare with other products on the same app", "Check Instagram/YouTube"],
    12: ["Price drop/discount"],
    13: ["Comparing it with alternatives"],
    14: ["2"]
  }),
  response("r06", {
    3: ["No"],
    4: ["I don't remember"],
    5: ["Almost never"],
    7: ["I genuinely intend to buy it later"],
    8: ["I was still deciding"],
    9: ["0"],
    10: ["Nothing in particular"],
    11: ["Wait for a sale"],
    12: ["Easier returns/exchanges"],
    13: ["Understanding reviews better"],
    14: ["0"]
  }),
  response("r07", {
    3: ["Yes"],
    4: ["More than 50"],
    5: ["Sometimes"],
    7: ["I want to compare it with other products", "I want to wait for a better price"],
    8: ["I was waiting for a discount"],
    9: ["3"],
    10: ["Price/value", "Size", "How it will look on me"],
    11: [
      "Read customer reviews",
      "Check size/fit reviews",
      "Compare with other products on the same app"
    ],
    12: ["Price drop/discount"],
    13: ["Understanding whether the price is good"],
    14: ["4"]
  }),
  response("r08", {
    3: ["Yes"],
    4: ["More than 50"],
    5: ["Almost always"],
    7: ["I want to compare it with other products"],
    8: ["I wasn't sure about the quality"],
    9: ["3"],
    10: ["Price/value", "Fit", "Quality"],
    11: ["Read customer reviews", "Compare with other products on the same app"],
    12: ["Better quality information"],
    13: ["Understanding product quality"],
    14: ["5"]
  }),
  response("r09", {
    3: ["Yes"],
    4: ["1–5"],
    5: ["Often"],
    7: ["I want to compare it with other products", "I add products for inspiration"],
    8: ["It was too expensive"],
    9: ["3"],
    10: ["Price/value", "Size", "Fit"],
    11: [
      "Read customer reviews",
      "Compare with other products on the same app",
      "Wait for a sale"
    ],
    12: ["Knowing whether I should buy now or wait"],
    13: ["Finding the best product among my wishlist"],
    14: ["3"]
  })
];

/** Discount-seekers who only wait for a sale and ask for nothing else. */
export const PRICE_BOUND: SurveyResponse[] = [
  response("p01", {
    3: ["Yes"],
    4: ["1–5"],
    5: ["Almost never"],
    8: ["It was too expensive"],
    9: ["2"],
    10: ["Price/value"],
    11: ["Wait for a sale"],
    12: ["Price drop/discount"],
    13: ["Understanding product quality"],
    14: ["1"]
  }),
  response("p02", {
    3: ["Yes"],
    4: ["1–5"],
    5: ["Sometimes"],
    8: ["I was waiting for a discount"],
    9: ["1"],
    10: ["Price/value"],
    11: ["Wait for a sale"],
    12: ["Price drop/discount"],
    13: ["Understanding product quality"],
    14: ["1"]
  })
];

/** No price dominance and a fit-led doubt, so the tree should proceed as drafted. */
export const FIT_LED: SurveyResponse[] = [
  response("f01", {
    3: ["Yes"],
    4: ["1–5"],
    5: ["Sometimes"],
    8: ["I wasn't sure about the quality"],
    9: ["2"],
    10: ["Size", "Fit"],
    11: ["Check size/fit reviews", "Read customer reviews"],
    12: ["Better fit/size information"],
    13: ["Understanding product quality"],
    14: ["3"]
  }),
  response("f02", {
    3: ["Yes"],
    4: ["1–5"],
    5: ["Almost never"],
    8: ["I was still deciding"],
    9: ["1"],
    10: ["Fit", "Quality"],
    11: ["Check size/fit reviews"],
    12: ["Better quality information"],
    13: ["Understanding product quality"],
    14: ["2"]
  })
];

export const RANKING: RankedTheme[] = [
  {
    themeId: "fit-size-anxiety",
    label: "FitSizeAnxiety",
    barrierType: "fit",
    metricNode: "resolve",
    impactOnW2P: "high",
    nonMonetaryFeasibility: "high",
    estimatedFrequency: 0.367,
    score: 0.873,
    rank: 1,
    priceFlag: false
  },
  {
    themeId: "price-waiting",
    label: "PriceWaiting",
    barrierType: "price",
    metricNode: "decide",
    impactOnW2P: "high",
    nonMonetaryFeasibility: "high",
    estimatedFrequency: 0.15,
    score: 0.83,
    rank: 2,
    priceFlag: true
  },
  {
    themeId: "comparison-paralysis",
    label: "ComparisonParalysis",
    barrierType: "compare",
    metricNode: "decide",
    impactOnW2P: "high",
    nonMonetaryFeasibility: "high",
    estimatedFrequency: 0.1,
    score: 0.82,
    rank: 3,
    priceFlag: false
  },
  {
    themeId: "return-fear",
    label: "ReturnFearDelay",
    barrierType: "fit",
    metricNode: "resolve",
    impactOnW2P: "medium",
    nonMonetaryFeasibility: "high",
    estimatedFrequency: 0.383,
    score: 0.717,
    rank: 7,
    priceFlag: false
  }
];

export const THEMES: Theme[] = [
  {
    id: "fit-size-anxiety",
    label: "FitSizeAnxiety",
    summary: "Shoppers cannot tell if the size will fit.",
    barrierType: "fit",
    metricNode: "resolve",
    quotes: [
      { text: "Seeded illustrative line.", reviewId: "fix-fit-01", source: "fixture" },
      {
        text: "they send wrong size or damaged product",
        reviewId: "playstore-83ec5f7a",
        source: "play_store"
      }
    ]
  },
  {
    id: "return-fear",
    label: "ReturnFearDelay",
    summary: "Returns are used instead of deciding.",
    barrierType: "fit",
    metricNode: "resolve",
    quotes: [
      { text: "I can always return it.", reviewId: "fix-return-01", source: "app_store" },
      {
        text: "one of the worst shopping experiences",
        reviewId: "appstore-gb-2-13508351477",
        source: "app_store"
      }
    ]
  }
];

export const STATS: PipelineStats = {
  readyForPhase2: true,
  validatedThemeCount: 12,
  rawCount: 895,
  normalizedCount: 150,
  extractionMethod: "groq"
};

export const NOMINATION: Nomination = {
  highestPotentialOpportunity: "FitSizeAnxiety → resolve",
  themeId: "fit-size-anxiety",
  metricNode: "resolve",
  score: 0.873,
  interviewSegment: "S2 ∩ S4",
  explicitlyNotPursuing: ["Price-drop / sale alerts (monetary — excluded by assignment constraint)"],
  readyForPhase3: true
};

/** Only the parts of the Phase 3 summary that Phase 4 reads. */
export function summaryFor(responses: SurveyResponse[]): SurveySummary {
  const scale = (id: number) => {
    const values = responses
      .map((r) => Number(r.answers[String(id)]?.[0]))
      .filter((value) => Number.isFinite(value));
    const total = values.reduce((sum, value) => sum + value, 0);
    return {
      id,
      text: `Q${id}`,
      values,
      mean: values.length ? Number((total / values.length).toFixed(2)) : 0,
      min: values.length ? Math.min(...values) : 0,
      max: values.length ? Math.max(...values) : 0
    };
  };

  return {
    respondents: responses.length,
    window: { from: "2026-08-28T17:19:40.000Z", to: "2026-08-31T13:01:24.000Z" },
    questions: [],
    mainBarriers: [],
    unlock: { monetary: 0, information: 0 },
    segment: { usesWishlist: 0, stalls: 0, inSegment: 0, inSegmentIds: [] },
    scales: [scale(9), scale(14)],
    generatedAt: "2026-09-01T00:00:00.000Z"
  };
}

export function inputsFor(responses: SurveyResponse[]) {
  return {
    ranking: RANKING,
    themes: THEMES,
    stats: STATS,
    nomination: NOMINATION,
    responses,
    summary: summaryFor(responses)
  };
}
