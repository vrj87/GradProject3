import { PRODUCTS } from "../data/products";
import type { PinZone } from "./fittingRoom";
import { rewriteCoachWithLlm, resolveCoachLlm, type CoachGenerationMeta, type CoachLlmStatus } from "./coachLlm";
import {
  buildCoachLook,
  buildRoomCompare,
  type RoomCoachLook,
  type RoomCompare
} from "./roomCoach";

export interface CoachInsightsRequest {
  itemIds: string[];
  peerIds?: string[];
  zone?: PinZone | null;
  usual?: string;
  between?: boolean;
}

export interface CoachInsightsResponse {
  looks: RoomCoachLook[];
  recommendation: RoomCompare["recommendation"] | null;
  meta: CoachGenerationMeta;
}

function productById(id: string) {
  return PRODUCTS.find((item) => item.id === id) ?? null;
}

function evidenceFor(ids: string[]): string {
  return ids
    .map((id) => {
      const product = productById(id);
      if (!product) return "";
      const reviews = product.reviews.map((review) => `${review.name} (${review.sizeBought}): ${review.text}`).join(" | ");
      return `${product.brand} ${product.name}. Fit: ${product.fit}. Note: ${product.fitNote}. Occasion: ${product.occasion}. Reviews: ${reviews}`;
    })
    .filter(Boolean)
    .join("\n");
}

export async function generateCoachInsights(
  body: CoachInsightsRequest,
  env: Record<string, string | undefined> = process.env
): Promise<CoachInsightsResponse | { error: string }> {
  const ids = body.itemIds.filter(Boolean).slice(0, 2);
  const products = ids.map(productById);
  if (products.some((item) => !item) || products.length === 0) {
    return { error: "Unknown product." };
  }
  const zone = body.zone ?? null;
  const usual = body.usual ?? "M";
  const between = body.between ?? false;
  const peers = (body.peerIds ?? [])
    .map(productById)
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  let looks: RoomCoachLook[];
  let recommendation: RoomCompare["recommendation"] | null = null;

  if (products.length === 1) {
    looks = [buildCoachLook(products[0]!, zone, { usual, between, peers })];
  } else {
    const compare = buildRoomCompare(products[0]!, products[1]!, zone, { usual, between, peers });
    looks = compare.looks;
    recommendation = compare.recommendation;
  }

  const rewritten = await rewriteCoachWithLlm({
    looks,
    recommendation,
    evidence: evidenceFor(ids),
    env
  });

  return {
    looks: rewritten.looks,
    recommendation: rewritten.recommendation,
    meta: rewritten.meta
  };
}

export function coachLlmStatus(env: Record<string, string | undefined> = process.env): CoachLlmStatus {
  const config = resolveCoachLlm(env);
  return {
    provider: config?.provider ?? ("rule-based" as const),
    model: config?.model ?? "storefront-review-synthesis",
    configured: Boolean(config)
  };
}
