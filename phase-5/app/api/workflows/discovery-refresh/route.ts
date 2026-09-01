import { loadDiscoveryStats } from "@/lib/artefacts";
import { bad, fromZod, guardWebhook, ok } from "@/lib/http";
import { z } from "zod";

export const dynamic = "force-dynamic";

const BodySchema = z.object({
  runId: z.string().optional(),
  status: z.enum(["started", "succeeded", "failed"]),
  rawCount: z.number().int().nonnegative().optional(),
  normalizedCount: z.number().int().nonnegative().optional(),
  message: z.string().optional()
});

/** Callback for the 12-hour n8n scrape workflow. */
export async function POST(request: Request) {
  const denied = guardWebhook(request);
  if (denied) return denied;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return bad("Body must be JSON.");
  }

  const parsed = BodySchema.safeParse(payload);
  if (!parsed.success) return fromZod(parsed.error);

  const stats = await loadDiscoveryStats();
  return ok({
    acknowledged: parsed.data,
    onDisk: stats
      ? { raw: stats.rawCount, normalized: stats.normalizedCount, themes: stats.validatedThemeCount }
      : null,
    note: "The app reads Phase-1/data/discovery from disk. A refresh is visible here only after the pipeline commits new artefacts."
  });
}
