import { buildFitConfidence } from "@/lib/fit-confidence";
import { guardWebhook, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { toProductRecord } from "@/lib/repo";

export const dynamic = "force-dynamic";

/**
 * Scores the stored corpus so a scheduled job can see which SKUs are too thin
 * to coach on. Theme extraction itself stays in Phase 1 — it needs the raw
 * discovery corpus and an LLM run, and it writes files this app cannot write.
 */
export async function POST(request: Request) {
  const denied = guardWebhook(request);
  if (denied) return denied;

  const rows = await prisma.product.findMany();
  const bands = { low: 0, moderate: 0, high: 0 };
  const thin: string[] = [];

  for (const row of rows) {
    const product = toProductRecord(row);
    const fit = buildFitConfidence(product);
    bands[fit.confidenceBand] += 1;
    if (fit.confidenceBand === "low") thin.push(product.id);
  }

  return ok({
    ran: "coach-corpus-analysis",
    products: rows.length,
    confidenceBands: bands,
    needsMoreReviews: thin,
    note: "Discovery theme extraction is a Phase 1 job: run npm run phase1:1c from the repo root."
  });
}
