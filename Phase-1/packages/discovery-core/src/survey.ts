export type SurveyRole = "screen" | "evidence" | "survey-only";

export interface SurveyQuestion {
  id: number;
  text: string;
  role: SurveyRole;
  scrapeQueries: string[];
  keepKeywords: string[];
  researchQuestionIds: number[];
  themeIds: string[];
}

/** Google Form: Fashion Wishlist → Purchase. Scrape queries are public-web, not invented answers. */
export const SURVEY_QUESTIONS: SurveyQuestion[] = [
  {
    id: 1,
    text: "Which fashion shopping platforms do you use regularly?",
    role: "screen",
    scrapeQueries: [],
    keepKeywords: [],
    researchQuestionIds: [9],
    themeIds: []
  },
  {
    id: 2,
    text: "How frequently do you shop for fashion online?",
    role: "screen",
    scrapeQueries: [],
    keepKeywords: [],
    researchQuestionIds: [9],
    themeIds: []
  },
  {
    id: 3,
    text: "Do you currently use a wishlist/favourites feature on any fashion shopping app?",
    role: "screen",
    scrapeQueries: ["myntra wishlist", "fashion wishlist"],
    keepKeywords: ["wishlist", "wish list", "favourites", "favorites"],
    researchQuestionIds: [1, 8],
    themeIds: ["bookmark-vs-intent"]
  },
  {
    id: 4,
    text: "Approximately how many fashion products do you currently have saved/wishlisted?",
    role: "evidence",
    scrapeQueries: ["wishlist too many items", "myntra wishlist clutter"],
    keepKeywords: ["too many", "so many items", "clutter", "20 items", "old wishlist"],
    researchQuestionIds: [8, 10],
    themeIds: ["wishlist-decay", "comparison-paralysis"]
  },
  {
    id: 5,
    text: "How often do you eventually purchase products that you add to your wishlist?",
    role: "evidence",
    scrapeQueries: ["wishlist didn't buy", "never buy from wishlist myntra"],
    keepKeywords: ["never bought", "didn't buy", "did not buy", "still sitting", "never ordered"],
    researchQuestionIds: [2, 8],
    themeIds: ["wishlist-decay", "bookmark-vs-intent"]
  },
  {
    id: 6,
    text: "When was the last time you added a product to your wishlist but did not purchase it?",
    role: "screen",
    scrapeQueries: [],
    keepKeywords: ["didn't purchase", "did not purchase", "still in wishlist"],
    researchQuestionIds: [2, 4],
    themeIds: ["wishlist-decay"]
  },
  {
    id: 7,
    text: "Why do you usually add a fashion product to your wishlist?",
    role: "evidence",
    scrapeQueries: ["why wishlist myntra", "saved for later fashion", "wishlist wait for sale"],
    keepKeywords: [
      "saved for later",
      "buy later",
      "remember",
      "inspiration",
      "bookmark",
      "wait for sale",
      "compare later"
    ],
    researchQuestionIds: [1, 8],
    themeIds: ["bookmark-vs-intent", "sale-waitlist", "price-waiting", "comparison-paralysis"]
  },
  {
    id: 8,
    text: "Think about a product you recently wishlisted but didn't purchase. What was the MAIN reason?",
    role: "evidence",
    scrapeQueries: [
      "myntra wishlist fit size",
      "wishlist wait for discount",
      "myntra quality not sure",
      "myntra return hesitate"
    ],
    keepKeywords: [
      "too expensive",
      "wait for discount",
      "unsure about the fit",
      "not sure about the quality",
      "better alternative",
      "right occasion",
      "return"
    ],
    researchQuestionIds: [2, 4, 7],
    themeIds: [
      "fit-size-anxiety",
      "price-waiting",
      "price-timing",
      "sale-waitlist",
      "return-fear",
      "styling-occasion",
      "comparison-paralysis",
      "quality-uncertainty"
    ]
  },
  {
    id: 9,
    text: "How confident were you that the wishlisted product would be right for you?",
    role: "evidence",
    scrapeQueries: ["myntra will it fit", "not sure it will look good"],
    keepKeywords: ["not sure", "unsure", "will it fit", "will it look", "not confident"],
    researchQuestionIds: [3, 7],
    themeIds: ["fit-size-anxiety", "styling-occasion", "style-uncertainty"]
  },
  {
    id: 10,
    text: "When you like a product but don't purchase it immediately, what are you usually uncertain about?",
    role: "evidence",
    scrapeQueries: ["myntra size fit unsure", "myntra colour quality reviews"],
    keepKeywords: [
      "size",
      "fit",
      "quality",
      "material",
      "fabric",
      "colour",
      "how it will look",
      "reviews",
      "price will fall"
    ],
    researchQuestionIds: [3, 7],
    themeIds: [
      "fit-size-anxiety",
      "review-trust-gap",
      "quality-uncertainty",
      "price-waiting",
      "styling-occasion"
    ]
  },
  {
    id: 11,
    text: "Before purchasing a wishlisted product, what do you usually do?",
    role: "evidence",
    scrapeQueries: [
      "myntra youtube try on",
      "check instagram before buying myntra",
      "compare similar myntra",
      "ask friend before buying ethnic"
    ],
    keepKeywords: [
      "customer photos",
      "customer reviews",
      "youtube",
      "instagram",
      "google",
      "compare",
      "ask friends",
      "wait for a sale"
    ],
    researchQuestionIds: [5, 6, 7],
    themeIds: ["review-trust-gap", "comparison-paralysis", "compare-difficulty", "social-validation"]
  },
  {
    id: 12,
    text: "What is the ONE thing that would most likely make you purchase a product from your wishlist?",
    role: "evidence",
    scrapeQueries: ["better fit information myntra", "myntra size chart wishlist"],
    keepKeywords: ["size chart", "fit information", "customer photos", "easier returns", "price drop"],
    researchQuestionIds: [10, 7],
    themeIds: ["fit-size-anxiety", "review-trust-gap", "return-fear", "price-waiting"]
  },
  {
    id: 13,
    text: "If you could get help with ONE thing while deciding whether to buy a wishlisted product, what would it be?",
    role: "evidence",
    scrapeQueries: ["which wishlist item to buy", "will this myntra size fit me"],
    keepKeywords: ["which one", "will it fit me", "compare with alternatives", "buy now or wait"],
    researchQuestionIds: [5, 10],
    themeIds: ["comparison-paralysis", "fit-size-anxiety", "compare-difficulty"]
  },
  {
    id: 14,
    text: "If an AI assistant could analyse your wishlist and tell you which products are worth buying and why, how useful would it be?",
    role: "survey-only",
    scrapeQueries: [],
    keepKeywords: [],
    researchQuestionIds: [10],
    themeIds: []
  }
];

export function surveyScrapeQueries(): string[] {
  return [...new Set(SURVEY_QUESTIONS.flatMap((question) => question.scrapeQueries))];
}

/** Capped set for live Reddit search so we do not trip rate limits. */
export function surveyRedditQueries(): string[] {
  return [
    "myntra wishlist",
    "wishlist didn't buy",
    "myntra size fit wishlist",
    "wait for sale wishlist",
    "compare similar myntra",
    "myntra youtube try on",
    "wishlist too many items",
    "myntra quality reviews",
    "saved for later fashion",
    "myntra size chart"
  ];
}

export function surveyKeepKeywords(): string[] {
  return [...new Set(SURVEY_QUESTIONS.flatMap((question) => question.keepKeywords))];
}

export function surveyQuestionIdsForTheme(themeId: string, label?: string): number[] {
  const keys = [themeId, label]
    .filter(Boolean)
    .map((value) => value!.toLowerCase().replace(/[^a-z0-9]+/g, ""));
  return SURVEY_QUESTIONS.filter((question) =>
    question.themeIds.some((id) => keys.includes(id.toLowerCase().replace(/[^a-z0-9]+/g, "")))
  ).map((question) => question.id);
}
