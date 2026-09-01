import { COACH_EVENTS, isCoachEvent } from "@/lib/events";
import { bad, fromZod, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { recordEvent } from "@/lib/repo";
import { EventRequestSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return bad("Body must be JSON.");
  }

  const parsed = EventRequestSchema.safeParse(payload);
  if (!parsed.success) return fromZod(parsed.error);
  const input = parsed.data;

  if (!isCoachEvent(input.type)) {
    return bad(`Unknown event type: ${input.type}`, 422, { allowed: COACH_EVENTS });
  }

  const user = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!user) return bad(`Unknown user: ${input.userId}`, 404);

  // Simulated purchase intent, labelled as a proxy everywhere it surfaces.
  if (input.type === "cart_add_simulated" && input.wishlistItemId) {
    await prisma.wishlistItem.update({
      where: { id: input.wishlistItemId },
      data: { cartAddedAt: new Date(), status: "cart_added" }
    });
  }

  const event = await recordEvent({
    userId: input.userId,
    wishlistItemId: input.wishlistItemId,
    type: input.type,
    meta: input.meta
  });

  return ok({ event: { id: event.id, type: event.type, createdAt: event.createdAt } }, 201);
}

export async function GET() {
  return ok({ events: COACH_EVENTS });
}
