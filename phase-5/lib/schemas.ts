import { z } from "zod";
import { hasIncentiveLanguage, incentiveMatches } from "./guardrails";

export const CATEGORIES = ["ethnic", "western", "footwear", "accessories"] as const;
export const FIT_HINTS = ["runs_small", "runs_large", "true_to_size", "unknown"] as const;
export const CONFIDENCE_BANDS = ["low", "moderate", "high"] as const;
export const COACH_TYPES = ["fit", "style", "compare", "value"] as const;

export const ReviewRecordSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  rating: z.number().min(1).max(5).optional(),
  sizeBought: z.string().optional(),
  fitHint: z.enum(FIT_HINTS).default("unknown"),
  bodyTypeHint: z.string().optional()
});

export const ProductRecordSchema = z.object({
  id: z.string().min(1),
  sourceUrl: z.string().url().optional(),
  name: z.string().min(1),
  brand: z.string().min(1),
  category: z.enum(CATEGORIES),
  priceInr: z.number().int().positive(),
  sizeChartText: z.string().optional(),
  imageUrl: z.string().optional(),
  reviews: z.array(ReviewRecordSchema).default([])
});

/**
 * Applied to every generated string the reviewer can read. The Phase 4 lock
 * forbids monetary levers, so the guardrail lives in the schema: copy that
 * mentions a discount is not "valid output that we then filter", it is invalid.
 */
function noIncentiveLanguage<T extends z.ZodTypeAny>(schema: T): T {
  return schema.superRefine((value, ctx) => {
    const matches = incentiveMatches(JSON.stringify(value));
    if (matches.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Incentive language is forbidden by the Phase 4 lock: ${matches.join(", ")}`
      });
    }
  }) as unknown as T;
}

export const FitConfidenceSummarySchema = noIncentiveLanguage(
  z.object({
    productId: z.string().min(1),
    confidenceBand: z.enum(CONFIDENCE_BANDS),
    sizePattern: z.string().min(1),
    keySignals: z.array(z.string()).min(1),
    bodyTypeNotes: z.array(z.string()),
    returnRiskFlags: z.array(z.string()),
    evidenceReviewIds: z.array(z.string()),
    disclaimer: z.string().min(1)
  })
);

export const StyleOccasionSummarySchema = noIncentiveLanguage(
  z.object({
    productId: z.string().min(1),
    occasionFit: z.array(z.object({ occasion: z.string(), verdict: z.string() })).min(1),
    pairingSuggestions: z.array(z.string()),
    cautionNotes: z.array(z.string()),
    evidenceReviewIds: z.array(z.string())
  })
);

export const CompareMatrixSchema = noIncentiveLanguage(
  z.object({
    itemIds: z.array(z.string()).min(2).max(3),
    dimensions: z
      .array(
        z.object({
          name: z.string(),
          scores: z.array(
            z.object({
              itemId: z.string(),
              score: z.number().min(0).max(5),
              rationale: z.string().min(1)
            })
          )
        })
      )
      .min(1),
    recommendation: z.object({
      itemId: z.string().nullable(),
      rationale: z.string().min(1),
      runnerUpId: z.string().nullable(),
      /** What would flip the call — the compare view must not feel like an oracle. */
      wouldChangeIf: z.string().min(1)
    }),
    evidenceThemeIds: z.array(z.string()),
    evidenceReviewIds: z.array(z.string())
  })
);

/**
 * The surface Phase 4 named as the largest evidenced gap: "is this a fair price,
 * and should I decide now?" answered with non-monetary signals only.
 */
export const ValueConfidenceSummarySchema = noIncentiveLanguage(
  z.object({
    productId: z.string().min(1),
    verdict: z.enum(["worth-it-now", "worth-it-if", "hold"]),
    headline: z.string().min(1),
    priceInr: z.number().int().positive(),
    /** Price ÷ realistic wears. Money spent per use, never money saved. */
    costPerWearInr: z.number().nonnegative(),
    wearsAssumed: z.number().int().positive(),
    wearBasis: z.string().min(1),
    qualitySignals: z.array(z.string()),
    /** Where this price sits among comparable saved items — context, not a nudge. */
    peerContext: z.object({
      comparedWith: z.number().int().nonnegative(),
      band: z.enum(["below-peers", "in-line", "above-peers", "no-peers"]),
      note: z.string().min(1)
    }),
    whatWouldChangeIt: z.array(z.string()).min(1),
    evidenceReviewIds: z.array(z.string()),
    disclaimer: z.string().min(1)
  })
);

export const GenerationMetaSchema = z.object({
  provider: z.enum(["groq", "openai", "rule-based"]),
  model: z.string(),
  latencyMs: z.number().nonnegative(),
  evidenceIds: z.array(z.string())
});

/* ---------- Request payloads ---------- */

export const AnalyzeRequestSchema = z.object({
  userId: z.string().min(1),
  productId: z.string().min(1),
  wishlistItemId: z.string().optional(),
  type: z.enum(["fit", "style", "both"]).default("fit")
});

export const CompareRequestSchema = z.object({
  userId: z.string().min(1),
  itemIds: z.array(z.string().min(1)).min(2).max(3)
});

export const ValueRequestSchema = z.object({
  userId: z.string().min(1),
  productId: z.string().min(1),
  wishlistItemId: z.string().optional(),
  /** Occasions the shopper expects to wear it for; drives the wear estimate. */
  occasionsPerMonth: z.number().min(0).max(30).optional()
});

export const IngestRequestSchema = z
  .object({
    url: z.string().optional(),
    catalogId: z.string().optional()
  })
  .refine((value) => Boolean(value.url || value.catalogId), {
    message: "Provide either a Myntra product url or a catalogId."
  });

export const WishlistAddRequestSchema = z.object({
  userId: z.string().min(1),
  productId: z.string().min(1)
});

export const EventRequestSchema = z.object({
  userId: z.string().min(1),
  wishlistItemId: z.string().optional(),
  type: z.string().min(1),
  meta: z.record(z.unknown()).optional()
});

export type ReviewRecord = z.infer<typeof ReviewRecordSchema>;
export type ProductRecord = z.infer<typeof ProductRecordSchema>;
export type Category = (typeof CATEGORIES)[number];
export type FitHint = (typeof FIT_HINTS)[number];
export type ConfidenceBand = (typeof CONFIDENCE_BANDS)[number];
export type CoachType = (typeof COACH_TYPES)[number];
export type FitConfidenceSummary = z.infer<typeof FitConfidenceSummarySchema>;
export type StyleOccasionSummary = z.infer<typeof StyleOccasionSummarySchema>;
export type CompareMatrix = z.infer<typeof CompareMatrixSchema>;
export type ValueConfidenceSummary = z.infer<typeof ValueConfidenceSummarySchema>;
export type GenerationMeta = z.infer<typeof GenerationMetaSchema>;

export { hasIncentiveLanguage };
