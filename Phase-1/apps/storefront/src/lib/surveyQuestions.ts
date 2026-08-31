import { SURVEY_FORM_URL, SURVEY_RESPONSES_URL } from "./researchLinks";

export type SurveyRole = "screen" | "evidence" | "survey-only";

export interface SurveyQuestion {
  id: number;
  text: string;
  role: SurveyRole;
  scrapeQueries: string[];
  keepKeywords: string[];
  themeIds: string[];
}

export const SURVEY_QUESTIONS: SurveyQuestion[] = [
  {
    id: 1,
    text: "Which fashion shopping platforms do you use regularly?",
    role: "screen",
    scrapeQueries: [],
    keepKeywords: [],
    themeIds: []
  },
  {
    id: 2,
    text: "How frequently do you shop for fashion online?",
    role: "screen",
    scrapeQueries: [],
    keepKeywords: [],
    themeIds: []
  },
  {
    id: 3,
    text: "Do you currently use a wishlist/favourites feature on any fashion shopping app?",
    role: "screen",
    scrapeQueries: ["myntra wishlist"],
    keepKeywords: ["wishlist", "wish list"],
    themeIds: ["bookmark-vs-intent"]
  },
  {
    id: 4,
    text: "Approximately how many fashion products do you currently have saved/wishlisted?",
    role: "evidence",
    scrapeQueries: ["wishlist too many items"],
    keepKeywords: ["too many", "clutter", "old wishlist"],
    themeIds: ["wishlist-decay", "comparison-paralysis"]
  },
  {
    id: 5,
    text: "How often do you eventually purchase products that you add to your wishlist?",
    role: "evidence",
    scrapeQueries: ["wishlist didn't buy"],
    keepKeywords: ["never bought", "didn't buy", "did not buy", "still sitting"],
    themeIds: ["wishlist-decay", "bookmark-vs-intent"]
  },
  {
    id: 6,
    text: "When was the last time you added a product to your wishlist but did not purchase it?",
    role: "screen",
    scrapeQueries: [],
    keepKeywords: ["still in wishlist"],
    themeIds: ["wishlist-decay"]
  },
  {
    id: 7,
    text: "Why do you usually add a fashion product to your wishlist?",
    role: "evidence",
    scrapeQueries: ["why wishlist myntra", "saved for later fashion"],
    keepKeywords: ["saved for later", "buy later", "inspiration", "bookmark", "wait for sale"],
    themeIds: ["bookmark-vs-intent", "sale-waitlist", "price-waiting", "comparison-paralysis"]
  },
  {
    id: 8,
    text: "Think about a product you recently wishlisted but didn't purchase. What was the MAIN reason?",
    role: "evidence",
    scrapeQueries: ["myntra wishlist fit size", "wishlist wait for discount"],
    keepKeywords: ["too expensive", "wait for discount", "fit", "quality", "occasion", "return"],
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
    scrapeQueries: ["myntra will it fit"],
    keepKeywords: ["not sure", "unsure", "will it fit", "will it look"],
    themeIds: ["fit-size-anxiety", "styling-occasion", "style-uncertainty"]
  },
  {
    id: 10,
    text: "When you like a product but don't purchase it immediately, what are you usually uncertain about?",
    role: "evidence",
    scrapeQueries: ["myntra size fit unsure"],
    keepKeywords: ["size", "fit", "quality", "material", "fabric", "reviews"],
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
    scrapeQueries: ["myntra youtube try on", "compare similar myntra"],
    keepKeywords: ["youtube", "instagram", "customer photos", "google", "compare", "ask friends"],
    themeIds: ["review-trust-gap", "comparison-paralysis", "compare-difficulty", "social-validation"]
  },
  {
    id: 12,
    text: "What is the ONE thing that would most likely make you purchase a product from your wishlist?",
    role: "evidence",
    scrapeQueries: ["better fit information myntra", "myntra size chart wishlist"],
    keepKeywords: ["size chart", "fit information", "customer photos", "easier returns"],
    themeIds: ["fit-size-anxiety", "review-trust-gap", "return-fear"]
  },
  {
    id: 13,
    text: "If you could get help with ONE thing while deciding whether to buy a wishlisted product, what would it be?",
    role: "evidence",
    scrapeQueries: ["which wishlist item to buy"],
    keepKeywords: ["which one", "will it fit me", "compare with alternatives"],
    themeIds: ["comparison-paralysis", "fit-size-anxiety", "compare-difficulty"]
  },
  {
    id: 14,
    text: "If an AI assistant could analyse your wishlist and tell you which products are worth buying and why, how useful would it be?",
    role: "survey-only",
    scrapeQueries: [],
    keepKeywords: [],
    themeIds: []
  }
];

export { SURVEY_FORM_URL, SURVEY_RESPONSES_URL };

function compactId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function themesForSurveyQuestion<T extends { id?: string; label?: string }>(
  question: SurveyQuestion,
  themes: T[]
): T[] {
  const ids = new Set(question.themeIds.map(compactId));
  return themes.filter((theme) => ids.has(compactId(theme.id || theme.label || "")));
}

export function voicesForSurveyQuestion<T extends { text: string }>(
  question: SurveyQuestion,
  voices: T[]
): T[] {
  if (!question.keepKeywords.length) return [];
  return voices.filter((voice) => {
    const lower = voice.text.toLowerCase();
    return question.keepKeywords.some((keyword) => lower.includes(keyword.toLowerCase()));
  });
}
