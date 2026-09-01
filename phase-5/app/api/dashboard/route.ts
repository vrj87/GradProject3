import { EVENT_METRIC } from "@/lib/events";
import { ok } from "@/lib/http";
import { buildFunnel } from "@/lib/metrics";
import { prisma } from "@/lib/prisma";
import { toSegmentUser } from "@/lib/repo";
import { coachEligibility } from "@/lib/segment";

export const dynamic = "force-dynamic";

export async function GET() {
  const users = await prisma.user.findMany({ include: { wishlistItems: true } });

  const audience = users.map((user) => {
    const eligibility = coachEligibility(toSegmentUser(user, user.wishlistItems));
    return { id: user.id, name: user.name, segmentTags: user.segmentTags, eligibility };
  });

  const eligibleUserIds = audience
    .filter((entry) => entry.eligibility.eligible)
    .map((entry) => entry.id);

  const [items, events] = await Promise.all([
    prisma.wishlistItem.findMany(),
    prisma.coachEvent.findMany()
  ]);

  const funnel = buildFunnel(
    {
      eligibleUserIds,
      items: items.map((item) => ({
        id: item.id,
        userId: item.userId,
        addedAt: item.addedAt,
        cartAddedAt: item.cartAddedAt,
        purchasedAt: item.purchasedAt,
        removedAt: item.removedAt
      })),
      events: events.map((event) => ({
        userId: event.userId,
        wishlistItemId: event.wishlistItemId,
        type: event.type,
        createdAt: event.createdAt
      }))
    },
    EVENT_METRIC
  );

  const seeded = events.filter((event) => {
    try {
      return Boolean((JSON.parse(event.metaJson) as { seeded?: boolean }).seeded);
    } catch {
      return false;
    }
  }).length;

  return ok({
    funnel,
    audience,
    provenance: {
      totalEvents: events.length,
      seededEvents: seeded,
      liveEvents: events.length - seeded,
      note:
        seeded > 0
          ? `${seeded} of ${events.length} events came from the demo seed, not from a real session. Interact with /mvp to add live ones.`
          : "All events came from real interactions with this deployment."
    }
  });
}
