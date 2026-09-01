import { analyze, CoachError } from "@/lib/coach";
import { bad, fromZod, ok } from "@/lib/http";
import { getUserWithItems, markPrompted, recordEvent, toSegmentUser } from "@/lib/repo";
import { AnalyzeRequestSchema } from "@/lib/schemas";
import { coachEligibility } from "@/lib/segment";
import { ZodError } from "zod";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return bad("Body must be JSON.");
  }

  const parsed = AnalyzeRequestSchema.safeParse(payload);
  if (!parsed.success) return fromZod(parsed.error);
  const input = parsed.data;

  const user = await getUserWithItems(input.userId);
  if (!user) return bad(`Unknown user: ${input.userId}`, 404);

  // The segment gate is enforced server-side, not just hidden in the UI.
  const eligibility = coachEligibility(toSegmentUser(user, user.wishlistItems));
  if (!eligibility.eligible) {
    return bad("Coach is not offered to this shopper.", 403, { eligibility });
  }

  try {
    const result = await analyze(input);
    await recordEvent({
      userId: input.userId,
      wishlistItemId: input.wishlistItemId,
      type: input.type === "style" ? "style_viewed" : "fit_viewed"
    });
    if (input.wishlistItemId) await markPrompted(input.wishlistItemId);
    return ok({ ...result, eligibility });
  } catch (error) {
    if (error instanceof CoachError) return bad(error.message, error.status);
    if (error instanceof ZodError) return fromZod(error, 422);
    return bad("Coach failed to produce valid output.", 500);
  }
}
