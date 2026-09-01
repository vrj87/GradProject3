import { CoachError, valueConfidence } from "@/lib/coach";
import { bad, fromZod, ok } from "@/lib/http";
import { getUserWithItems, markPrompted, recordEvent, toSegmentUser } from "@/lib/repo";
import { ValueRequestSchema } from "@/lib/schemas";
import { coachEligibility } from "@/lib/segment";
import { ZodError } from "zod";

export const dynamic = "force-dynamic";

/**
 * The surface Phase 4 named as the largest evidenced gap. It answers "is this
 * worth the price" with wear evidence, never with a price movement.
 */
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return bad("Body must be JSON.");
  }

  const parsed = ValueRequestSchema.safeParse(payload);
  if (!parsed.success) return fromZod(parsed.error);
  const input = parsed.data;

  const user = await getUserWithItems(input.userId);
  if (!user) return bad(`Unknown user: ${input.userId}`, 404);

  const eligibility = coachEligibility(toSegmentUser(user, user.wishlistItems));
  if (!eligibility.eligible) {
    return bad("Coach is not offered to this shopper.", 403, { eligibility });
  }

  try {
    const result = await valueConfidence(input);
    await recordEvent({
      userId: input.userId,
      wishlistItemId: input.wishlistItemId,
      type: "value_viewed",
      meta: { verdict: result.value.verdict, costPerWearInr: result.value.costPerWearInr }
    });
    if (input.wishlistItemId) await markPrompted(input.wishlistItemId);
    return ok({ ...result, eligibility });
  } catch (error) {
    if (error instanceof CoachError) return bad(error.message, error.status);
    if (error instanceof ZodError) return fromZod(error, 422);
    return bad("Value confidence failed to produce valid output.", 500);
  }
}
