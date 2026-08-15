export type Impact = "high" | "medium" | "low";
export type MetricNode = "revisit" | "resolve" | "decide" | "act";
export type RowStatus = "filled" | "unobserved" | "excluded";

export interface RankedTheme {
  themeId: string;
  label: string;
  barrierType: string;
  metricNode: string;
  impactOnW2P: Impact;
  nonMonetaryFeasibility: Impact;
  estimatedFrequency: number;
  score: number;
  rank: number;
  priceFlag: boolean;
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
  confidence: Impact | number | string;
  segmentHints: string[];
  barrierType: string;
  metricNode: string;
  researchQuestionIds?: number[];
  actionableInsight?: string;
  quotes?: ThemeQuote[];
}

export interface PipelineStats {
  readyForPhase2: boolean;
  validatedThemeCount: number;
  researchQuestionGaps: number[];
  extractionMethod: string;
  rawCount: number;
  normalizedCount: number;
  metricNodeGaps?: string[];
}

export interface MatrixRow {
  opportunityArea: string;
  themeId: string | null;
  supportingThemeIds: string[];
  impactOnW2P: string;
  feasibility: string;
  evidenceStrength: string;
  frequency: string | number;
  score: string | number;
  metricNode: string;
  rank: string | number;
  status: RowStatus;
  matchReason: string;
}

export interface MetricNodeCoverage {
  node: MetricNode;
  definition: string;
  themeIds: string[];
  labels: string[];
  highestScore: number | null;
  covered: boolean;
}

export interface MetricTree {
  northStar: string;
  product: string;
  constraint: string;
  nodes: MetricNodeCoverage[];
  uncoveredNodes: MetricNode[];
  bookmarkSeparated: boolean;
}

export interface InterviewSeed {
  briefQuestion: number;
  prompt: string;
  linkedThemeIds: string[];
  researchQuestionIds: number[];
}

export interface Nomination {
  highestPotentialOpportunity: string;
  themeId: string | null;
  metricNode: string | null;
  score: number | null;
  interviewSegment: string;
  segmentRationale: string;
  supportingThemeIds: string[];
  subMetricsMoved: string[];
  explicitlyNotPursuing: string[];
  priceFlagged: boolean;
  caveats: string[];
  interviewSeeds: InterviewSeed[];
  readyForPhase3: boolean;
}
