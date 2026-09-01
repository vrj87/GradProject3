import { CoachError, compare } from "@/lib/coach";
import { bad, fromZod, ok } from "@/lib/http";
import { getUserWithItems, recordEvent, toSegmentUser } from "@/lib/repo";
import { CompareRequestSchema } from "@/lib/schemas";
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

  const parsed = CompareRequestSchema.safeParse(payload);
  if (!parsed.success) return fromZod(parsed.error);
  const input = parsed.data;

  const user = await getUserWithItems(input.userId);
  if (!user) return bad(`Unknown user: ${input.userId}`, 404);

  const eligibility = coachEligibility(toSegmentUser(user, user.wishlistItems));
  if (!eligibility.eligible) {
    return bad("Coach is not offered to this shopper.", 403, { eligibility });
  }

  await recordEvent({ userId: input.userId, type: "compare_started" });

  try {
    const result = await compare(input);
    await recordEvent({
      userId: input.userId,
      type: "compare_completed",
      meta: { itemIds: input.itemIds, winner: result.matrix.recommendation.itemId }
    });
    return ok({ matrix: result.matrix, products: result.products, meta: result.meta, eligibility });
  } catch (error) {
    if (error instanceof CoachError) return bad(error.message, error.status);
    if (error instanceof ZodError) return fromZod(error, 422);
    return bad("Compare failed.", 500);
  }
}
