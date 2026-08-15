export type SourceKind =
  | "app_store"
  | "play_store"
  | "reddit"
  | "youtube"
  | "quora"
  | "forum"
  | "myntra_review"
  | "collect"
  | "fixture"
  | "interview"
  | "primary_research";

export type BarrierType =
  | "fit"
  | "style"
  | "compare"
  | "price"
  | "bookmark"
  | "social"
  | "other";

export type MetricNode = "revisit" | "resolve" | "decide" | "act";

export type SegmentHint = "S1" | "S2" | "S3" | "S4";

export type ImpactLevel = "high" | "medium" | "low";

export interface RawReview {
  id: string;
  text: string;
  source: SourceKind;
  sourceId?: string;
  url?: string;
  rating?: number | null;
  scrapedAt: string;
  languageHint?: string;
  competitor?: boolean;
}

export interface NormalizedReview extends RawReview {
  textHash: string;
  wordCount: number;
  languageHint: string;
  wishlistRelevant: boolean;
  excludedFromFrequency: boolean;
}

export interface ReviewChunk {
  chunkId: string;
  reviewId: string;
  text: string;
  source: SourceKind;
  url?: string;
}

export interface ThemeQuote {
  text: string;
  reviewId: string;
  source: string;
  url?: string;
}

export interface Theme {
  id: string;
  label: string;
  summary: string;
  researchQuestionIds: number[];
  barrierType: BarrierType;
  metricNode: MetricNode;
  segmentHints: SegmentHint[];
  quotes: ThemeQuote[];
  estimatedFrequency: number;
  impactOnW2P: ImpactLevel;
  nonMonetaryFeasibility: ImpactLevel;
  confidence: ImpactLevel;
  actionableInsight: string;
}

export interface ThemeValidationResult {
  themeId: string;
  label: string;
  passed: boolean;
  confidence: ImpactLevel;
  reasons: string[];
}

export interface RankedOpportunity {
  themeId: string;
  label: string;
  barrierType: BarrierType;
  metricNode: MetricNode;
  impactOnW2P: ImpactLevel;
  nonMonetaryFeasibility: ImpactLevel;
  estimatedFrequency: number;
  score: number;
  rank: number;
  priceFlag: boolean;
}

export interface LlmExtractionStats {
  batchesProcessed: number;
  batchesFailed: number;
  rawThemeCount: number;
  themesMerged: number;
  quoteRepairs: number;
  gapFillThemes: number;
}

export interface PipelineStats {
  rawCount: number;
  normalizedCount: number;
  droppedMinWords: number;
  droppedIrrelevant: number;
  droppedDuplicates: number;
  chunkCount: number;
  sourceCoverage: Record<string, number>;
  partialCoverage: string[];
  extractionMethod: "groq" | "openai" | "rule-based" | "hybrid";
  validatedThemeCount: number;
  rejectedThemeCount: number;
  researchQuestionGaps: number[];
  metricNodeGaps: MetricNode[];
  sampleSizeCapped: boolean;
  fixtureCount: number;
  llmStats?: LlmExtractionStats;
  readyForPhase2: boolean;
  generatedAt: string;
}

export const WISHLIST_KEYWORDS = [
  "wishlist",
  "wish list",
  "save",
  "saved",
  "shortlist",
  "size",
  "fit",
  "return",
  "sale",
  "compare",
  "occasion",
  "eoss",
  "bff"
] as const;

export const MONETARY_TERMS = [
  "coupon",
  "cashback",
  "cash back",
  "discount code",
  "price drop",
  "offer extra",
  "loyalty points bonus"
] as const;

export const RESEARCH_QUESTIONS = [
  { id: 1, text: "Why do users add fashion products to their wishlist?" },
  { id: 2, text: "What prevents wishlisted products from eventually being purchased?" },
  { id: 3, text: "What uncertainties remain after users have identified a product they like?" },
  { id: 4, text: "What causes users to postpone a purchase?" },
  { id: 5, text: "How do users compare multiple shortlisted products?" },
  { id: 6, text: "What information do users seek outside Myntra before purchasing?" },
  { id: 7, text: "What role do fit, size, styling, price, reviews, occasion, and social validation play?" },
  { id: 8, text: "When is the wishlist genuine purchase intent vs a bookmark?" },
  { id: 9, text: "How do these behaviors differ across user segments?" },
  { id: 10, text: "What unmet needs emerge consistently across conversations?" }
] as const;
