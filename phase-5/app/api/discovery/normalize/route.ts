import { sanitizeReviewText } from "@/lib/guardrails";
import { guardWebhook, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { toProductRecord, upsertProduct } from "@/lib/repo";

export const dynamic = "force-dynamic";

/** Re-sanitizes and de-duplicates the stored review corpus. Idempotent. */
export async function POST(request: Request) {
  const denied = guardWebhook(request);
  if (denied) return denied;

  const rows = await prisma.product.findMany();
  let deduped = 0;
  let rewritten = 0;

  for (const row of rows) {
    const product = toProductRecord(row);
    const seen = new Set<string>();
    let localDeduped = 0;
    const reviews = product.reviews.filter((review) => {
      if (seen.has(review.id)) {
        localDeduped += 1;
        return false;
      }
      seen.add(review.id);
      return true;
    });

    let localRewritten = 0;
    const cleaned = reviews.map((review) => {
      const text = sanitizeReviewText(review.text);
      if (text !== review.text) localRewritten += 1;
      return { ...review, text };
    });

    deduped += localDeduped;
    rewritten += localRewritten;

    if (localDeduped > 0 || localRewritten > 0) {
      await upsertProduct({ ...product, reviews: cleaned });
    }
  }

  return ok({ products: rows.length, deduped, rewritten });
}
