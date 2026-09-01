import { buildCompareMatrix, CompareError } from "./compare-engine";
import { buildFitConfidence } from "./fit-confidence";
import { refine } from "./llm";
import { prisma } from "./prisma";
import { getProductRecord, peersFor, recordSession, toProductRecord } from "./repo";
import {
  CompareMatrixSchema,
  FitConfidenceSummarySchema,
  StyleOccasionSummarySchema,
  ValueConfidenceSummarySchema,
  type CompareMatrix,
  type FitConfidenceSummary,
  type GenerationMeta,
  type ProductRecord,
  type StyleOccasionSummary,
  type ValueConfidenceSummary
} from "./schemas";
import { buildStyleOccasion } from "./style-occasion";
import { cachedThemes, themeIdsForCompare } from "./themes";
import { buildValueConfidence } from "./value-confidence";

/**
 * Orchestration only. Every summary is computed by the rule-based engines first,
 * then optionally rephrased by an LLM under the same schema. Nothing here can
 * produce a claim that the review evidence does not already support.
 */

export class CoachError extends Error {
  constructor(
    message: string,
    readonly status = 400
  ) {
    super(message);
  }
}

/** Accepts a wishlist item id or a product id, so the API is forgiving. */
async function resolveProduct(userId: string, id: string): Promise<{
  product: ProductRecord;
  wishlistItemId: string | null;
}> {
  const item = await prisma.wishlistItem.findFirst({
    where: { id, userId },
    include: { product: true }
  });
  if (item) return { product: toProductRecord(item.product), wishlistItemId: item.id };

  const byProduct = await prisma.wishlistItem.findFirst({
    where: { productId: id, userId, removedAt: null },
    include: { product: true }
  });
  if (byProduct) return { product: toProductRecord(byProduct.product), wishlistItemId: byProduct.id };

  const record = await getProductRecord(id);
  if (!record) throw new CoachError(`Unknown item or product: ${id}`, 404);
  return { product: record, wishlistItemId: null };
}

export interface AnalyzeResult {
  fit?: FitConfidenceSummary;
  style?: StyleOccasionSummary;
  meta: GenerationMeta;
}

export async function analyze(input: {
  userId: string;
  productId: string;
  wishlistItemId?: string;
  type: "fit" | "style" | "both";
}): Promise<AnalyzeResult> {
  const { product, wishlistItemId } = await resolveProduct(input.userId, input.productId);
  const wants = (kind: "fit" | "style") => input.type === kind || input.type === "both";

  let fit: FitConfidenceSummary | undefined;
  let style: StyleOccasionSummary | undefined;
  let meta: GenerationMeta = {
    provider: "rule-based",
    model: "phase5-review-synthesis",
    latencyMs: 0,
    evidenceIds: []
  };

  if (wants("fit")) {
    const base = buildFitConfidence(product);
    const refined = await refine({
      value: base,
      schema: FitConfidenceSummarySchema,
      instruction:
        "Rewrite only the prose in keySignals, sizePattern and returnRiskFlags so a shopper can read it quickly. Keep every id, band and number identical.",
      evidenceIds: base.evidenceReviewIds
    });
    fit = refined.value;
    meta = refined.meta;
  }

  if (wants("style")) {
    const base = buildStyleOccasion(product);
    const refined = await refine({
      value: base,
      schema: StyleOccasionSummarySchema,
      instruction:
        "Rewrite only the verdict and caution prose for readability. Keep every id and occasion name identical.",
      evidenceIds: base.evidenceReviewIds
    });
    style = refined.value;
    if (meta.provider === "rule-based") meta = refined.meta;
  }

  await recordSession({
    userId: input.userId,
    wishlistItemId: input.wishlistItemId ?? wishlistItemId,
    type: input.type === "style" ? "style" : "fit",
    payload: input,
    output: { fit, style },
    meta
  });

  return { fit, style, meta };
}

export async function compare(input: {
  userId: string;
  itemIds: string[];
}): Promise<{ matrix: CompareMatrix; products: ProductRecord[]; meta: GenerationMeta }> {
  const resolved = await Promise.all(
    input.itemIds.map((id) => resolveProduct(input.userId, id))
  );
  const products = resolved.map((entry) => entry.product);
  const themes = await cachedThemes();

  let matrix: CompareMatrix;
  try {
    matrix = buildCompareMatrix({ products, themeIds: themeIdsForCompare(themes) });
  } catch (error) {
    if (error instanceof CompareError) throw new CoachError(error.message, 422);
    throw error;
  }

  const refined = await refine({
    value: matrix,
    schema: CompareMatrixSchema,
    instruction:
      "Rewrite only the rationale, wouldChangeIf and dimension rationale prose. Keep every id and score identical.",
    evidenceIds: matrix.evidenceReviewIds
  });

  await recordSession({
    userId: input.userId,
    wishlistItemId: resolved[0]?.wishlistItemId ?? null,
    type: "compare",
    payload: input,
    output: refined.value,
    meta: refined.meta
  });

  return { matrix: refined.value, products, meta: refined.meta };
}

export async function valueConfidence(input: {
  userId: string;
  productId: string;
  wishlistItemId?: string;
  occasionsPerMonth?: number;
}): Promise<{ value: ValueConfidenceSummary; meta: GenerationMeta }> {
  const { product, wishlistItemId } = await resolveProduct(input.userId, input.productId);
  const peers = await peersFor(input.userId, product.category, product.id);

  const base = buildValueConfidence({
    product,
    peers,
    occasionsPerMonth: input.occasionsPerMonth
  });
  const refined = await refine({
    value: base,
    schema: ValueConfidenceSummarySchema,
    instruction:
      "Rewrite only headline, wearBasis, qualitySignals, peerContext.note and whatWouldChangeIt for readability. Never mention discounts, sales or waiting for a price. Keep every id and number identical.",
    evidenceIds: base.evidenceReviewIds
  });

  await recordSession({
    userId: input.userId,
    wishlistItemId: input.wishlistItemId ?? wishlistItemId,
    type: "value",
    payload: input,
    output: refined.value,
    meta: refined.meta
  });

  return { value: refined.value, meta: refined.meta };
}
