import { bad, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { recordEvent } from "@/lib/repo";

export const dynamic = "force-dynamic";

/**
 * A removal is a completed decision under the Phase 4 lock, so it is recorded
 * as `item_removed` and counted in the funnel rather than treated as churn.
 */
export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  const item = await prisma.wishlistItem.findUnique({ where: { id } });
  if (!item) return bad(`Unknown wishlist item: ${id}`, 404);
  if (item.removedAt) return ok({ item, alreadyRemoved: true });

  const updated = await prisma.wishlistItem.update({
    where: { id },
    data: { removedAt: new Date(), status: "removed" }
  });
  await prisma.user.update({
    where: { id: item.userId },
    data: { wishlistCount: { decrement: 1 } }
  });
  await recordEvent({
    userId: item.userId,
    wishlistItemId: id,
    type: "item_removed",
    meta: { reason: "decided against it" }
  });

  return ok({ item: updated, countedAs: "completed decision" });
}
