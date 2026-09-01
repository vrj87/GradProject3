export type Impact = "high" | "medium" | "low";
export type MetricNode = "revisit" | "resolve" | "decide" | "act";

/* ---------- Inputs (shapes we read, not shapes we own) ---------- */

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
  barrierType: string;
  metricNode: string;
  segmentHints?: string[];
  actionableInsight?: string;
  quotes?: ThemeQuote[];
}

export interface PipelineStats {
  readyForPhase2: boolean;
  validatedThemeCount: number;
  rawCount: number;
  normalizedCount: number;
  extractionMethod: string;
}

export interface Nomination {
  highestPotentialOpportunity: string;
  themeId: string | null;
  metricNode: string | null;
  score: number | null;
  interviewSegment: string;
  explicitlyNotPursuing: string[];
  readyForPhase3: boolean;
}

/** One row of the Phase 3 export. Keys are question ids. */
export interface SurveyResponse {
  id: string;
  submittedAt: string;
  answers: Record<string, string[]>;
}

export interface AnswerTally {
  answer: string;
  count: number;
}

export interface ScaleSummary {
  id: number;
  text: string;
  values: number[];
  mean: number;
  min: number;
  max: number;
}

export interface SurveySummary {
  respondents: number;
  window: { from: string; to: string };
  questions: Array<{ id: number; text: string; answered: number; tallies: AnswerTally[] }>;
  mainBarriers: Array<{ kind: string; count: number }>;
  unlock: { monetary: number; information: number };
  segment: { usesWishlist: number; stalls: number; inSegment: number; inSegmentIds: string[] };
  scales: ScaleSummary[];
  generatedAt: string;
}

export interface Phase4Inputs {
  ranking: RankedTheme[];
  themes: Theme[];
  stats: PipelineStats;
  nomination: Nomination;
  responses: SurveyResponse[];
  summary: SurveySummary;
}

/* ---------- Signals ---------- */

/** A count expressed against the sample so no number floats free of its base. */
export interface Fraction {
  ids: string[];
  count: number;
  of: number;
  label: string;
}

export interface UnlockSwitchSignal {
  monetary: Fraction;
  switchedToInformation: Fraction;
  askedPriceJudgement: Fraction;
  /** Discount-seekers who nonetheless research before buying. Not a tautology. */
  researchesAnyway: Fraction;
  perRespondent: Array<{ id: string; unlock: string; help: string; researches: boolean }>;
  allSwitched: boolean;
  allResearch: boolean;
  tautologyNote: string;
}

export interface StatedVsRevealedSignal {
  statedPriceBarrier: Fraction;
  waitsForSale: Fraction;
  readsReviews: Fraction;
  comparesInApp: Fraction;
  saleWaitOnly: Fraction;
  divergence: boolean;
}

export interface FitChallengeSignal {
  discoveryRank: number | null;
  discoveryScore: number | null;
  discoveryFrequency: number | null;
  leadingBarrier: Fraction;
  namedAsUnlock: Fraction;
  heldAsDoubt: Fraction;
  challenged: boolean;
}

export interface SegmentEvidenceSignal {
  usesWishlist: Fraction;
  stalls: Fraction;
  inSegment: Fraction;
  target: number;
  targetMet: boolean;
  priceDominantInSegment: boolean;
  inSegmentMonetaryUnlock: Fraction;
  inSegmentPriceJudgementHelp: Fraction;
}

export interface ValueConfidenceSignal {
  priceJudgementHelp: Fraction;
  buyNowOrWait: Fraction;
  topHelpAnswer: AnswerTally | null;
  demand: Fraction;
  built: boolean;
}

export interface SaveVolumeSignal {
  buckets: AnswerTally[];
  modalBucket: string | null;
  modalCeiling: number | null;
  majorityAtOrBelowFive: boolean;
}

export interface NodeEvidenceSignal {
  node: MetricNode;
  respondents: Fraction;
  reason: string;
}

export interface WorkaroundSignal {
  behaviour: string;
  count: number;
  of: number;
  offApp: boolean;
}

export interface Signals {
  respondents: number;
  window: { from: string; to: string };
  unlockSwitch: UnlockSwitchSignal;
  statedVsRevealed: StatedVsRevealedSignal;
  fitChallenge: FitChallengeSignal;
  segment: SegmentEvidenceSignal;
  valueConfidence: ValueConfidenceSignal;
  saveVolume: SaveVolumeSignal;
  nodes: NodeEvidenceSignal[];
  surveyTopNode: MetricNode;
  workarounds: WorkaroundSignal[];
  confidence: ScaleSummary | null;
  aiVerdict: ScaleSummary | null;
  instrument: { priceHeldConstant: boolean; freeTextCollected: boolean; note: string };
}

/* ---------- Decision tree ---------- */

export type BranchId = "proceed-as-specified" | "price-dominant" | "fork";
export type TreeOutcome = "proceed-as-specified" | "proceed-rescoped" | "stop";

export interface BranchVerdict {
  branch: BranchId;
  fired: boolean;
  terminal: boolean;
  because: string[];
}

export interface DecisionTreeOutcome {
  verdicts: BranchVerdict[];
  outcome: TreeOutcome;
  incentiveMvpAllowed: false;
  primaryNode: MetricNode;
  secondaryNode: MetricNode;
  requiredSurfaces: string[];
  forbidden: string[];
  rescopeInstruction: string;
  constraintConflict: { present: boolean; statement: string; navigableBecause: string | null };
}

/* ---------- Segment contract ---------- */

export interface SegmentThresholds {
  windowDays: number;
  minRecentSaves: number;
  maxPurchasedInWindow: number;
  minSameCategory: number;
}

export interface SegmentContract {
  name: string;
  previousName: string;
  thresholds: SegmentThresholds;
  derivation: string[];
  controlPersona: string;
  implementedIn: string;
  interfaceOnly: true;
  source: string;
}

/* ---------- Problem definition ---------- */

export interface EvidenceRef {
  source: "discovery" | "survey" | "phase2" | "instrument";
  ref: string;
  detail: string;
}

export interface ProblemField {
  field: string;
  statement: string;
  evidence: EvidenceRef[];
  caveats: string[];
}

export interface EvolutionChain {
  steps: Array<{ stage: string; via: string; value: string }>;
  complete: boolean;
}

export interface QuoteIntegrity {
  participantVerbatimAvailable: boolean;
  reason: string;
  liveCount: number;
  illustrativeCount: number;
  liveQuotes: ThemeQuote[];
}

export interface ExitCriteria {
  sixFieldsFilled: boolean;
  evolutionChainComplete: boolean;
  decisionTreeRecorded: boolean;
  incentiveMvpAvoided: boolean;
  met: boolean;
  unmet: string[];
}

export interface ProblemDefinition {
  northStar: string;
  constraint: string;
  headline: string;
  fields: {
    targetSegment: ProblemField;
    productOutcome: ProblemField;
    rootCause: ProblemField;
    workarounds: ProblemField;
    userValue: ProblemField;
    businessValue: ProblemField;
  };
  segmentContract: SegmentContract;
  decisionTree: DecisionTreeOutcome;
  evolutionChain: EvolutionChain;
  quotes: QuoteIntegrity;
  falsification: Array<{ claim: string; falsifiedBy: string }>;
  exitCriteria: ExitCriteria;
  readyForPhase5: boolean;
  caveats: string[];
  generatedAt: string;
}
