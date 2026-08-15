export type Impact = "high" | "medium" | "low";

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

export interface Theme {
  id: string;
  label: string;
  summary: string;
  confidence: Impact;
  segmentHints: string[];
  barrierType: string;
  metricNode: string;
  actionableInsight?: string;
}

export interface PipelineStats {
  readyForPhase2: boolean;
  validatedThemeCount: number;
  researchQuestionGaps: number[];
  extractionMethod: string;
  rawCount: number;
  normalizedCount: number;
}

export interface MatrixRow {
  opportunityArea: string;
  themeId: string | null;
  impactOnW2P: string;
  feasibility: string;
  evidenceStrength: string;
  frequency: string | number;
  metricNode: string;
  rank: string | number;
  status: "filled" | "unobserved" | "excluded";
}

export interface Nomination {
  highestPotentialOpportunity: string;
  themeId: string | null;
  metricNode: string | null;
  interviewSegment: string;
  segmentRationale: string;
  explicitlyNotPursuing: string[];
  priceFlagged: boolean;
  caveats: string[];
  readyForPhase3: boolean;
}
