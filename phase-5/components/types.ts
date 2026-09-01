import type {
  CompareMatrix,
  FitConfidenceSummary,
  GenerationMeta,
  ProductRecord,
  StyleOccasionSummary,
  ValueConfidenceSummary
} from "@/lib/schemas";
import type { Eligibility } from "@/lib/segment";
import type { Trigger } from "@/lib/age-triggers";

export interface WishlistEntry {
  id: string;
  productId: string;
  category: string;
  addedAt: string;
  status: string;
  cartAddedAt: string | null;
  purchasedAt: string | null;
  product: ProductRecord;
  trigger: Trigger | null;
}

export interface SegmentContractCheck {
  optedOut: boolean;
  recentSaves: number;
  purchasesInWindow: number;
  largestCategory: string | null;
  largestCategoryCount: number;
  comparableCategories: string[];
  thresholds: {
    windowDays: number;
    minRecentSaves: number;
    maxPurchasedInWindow: number;
    minSameCategory: number;
  };
}

export interface WishlistResponse {
  user: { id: string; name: string; segmentTags: string[]; optedOut: boolean };
  eligibility: Eligibility;
  comparableCategories: string[];
  contract: SegmentContractCheck;
  items: WishlistEntry[];
}

export interface AnalyzeResponse {
  fit?: FitConfidenceSummary;
  style?: StyleOccasionSummary;
  meta: GenerationMeta;
}

export interface ValueResponse {
  value: ValueConfidenceSummary;
  meta: GenerationMeta;
}

export interface CompareResponse {
  matrix: CompareMatrix;
  meta: GenerationMeta;
}

export type { CompareMatrix, FitConfidenceSummary, StyleOccasionSummary, ValueConfidenceSummary };
