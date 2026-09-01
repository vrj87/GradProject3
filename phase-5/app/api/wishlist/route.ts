import { triggerFor } from "@/lib/age-triggers";
import { bad, fromZod, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { getProductRecord, getUserWithItems, toProductRecord, toSegmentUser, upsertProduct } from "@/lib/repo";
import { WishlistAddRequestSchema } from "@/lib/schemas";
import { SEGMENT_THRESHOLDS, coachEligibility, comparableCategories } from "@/lib/segment";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const userId = new URL(request.url).searchParams.get("userId");
  if (!userId) return bad("userId is required.");

  const user = await getUserWithItems(userId);
  if (!user) return bad(`Unknown user: ${userId}`, 404);

  const active = user.wishlistItems.filter((item) => !item.removedAt);
  const segmentUser = toSegmentUser(user, user.wishlistItems);
  const eligibility = coachEligibility(segmentUser);
  const comparable = comparableCategories(segmentUser);

  const byCategory = new Map<string, number>();
  for (const item of active) {
    byCategory.set(item.category, (byCategory.get(item.category) ?? 0) + 1);
  }

  const now = new Date();
  const windowMs = SEGMENT_THRESHOLDS.windowDays * 24 * 60 * 60 * 1000;
  const inWindow = (date: Date) => {
    const ms = now.getTime() - date.getTime();
    return ms >= 0 && ms <= windowMs;
  };
  const recent = user.wishlistItems.filter((item) => !item.removedAt && inWindow(item.addedAt));
  const purchased = recent.filter((item) => item.purchasedAt && inWindow(item.purchasedAt));
  const largest = [...byCategory.entries()].sort((a, b) => b[1] - a[1])[0];

  return ok({
    user: {
      id: user.id,
      name: user.name,
      segmentTags: segmentUser.segmentTags,
      optedOut: user.optedOut
    },
    eligibility,
    comparableCategories: comparable,
    contract: {
      optedOut: user.optedOut,
      recentSaves: recent.length,
      purchasesInWindow: purchased.length,
      largestCategory: largest?.[0] ?? null,
      largestCategoryCount: largest?.[1] ?? 0,
      comparableCategories: comparable,
      thresholds: SEGMENT_THRESHOLDS
    },
    items: active.map((item) => ({
      id: item.id,
      productId: item.productId,
      category: item.category,
      addedAt: item.addedAt,
      status: item.status,
      cartAddedAt: item.cartAddedAt,
      purchasedAt: item.purchasedAt,
      product: toProductRecord(item.product),
      trigger: eligibility.eligible
        ? triggerFor(
            { addedAt: item.addedAt, lastPromptAt: item.lastPromptAt },
            { comparableCount: byCategory.get(item.category) ?? 0 }
          )
        : null
    }))
  });
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return bad("Body must be JSON.");
  }

  const parsed = WishlistAddRequestSchema.safeParse(payload);
  if (!parsed.success) return fromZod(parsed.error);
  const { userId, productId } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return bad(`Unknown user: ${userId}`, 404);

  const record = await getProductRecord(productId);
  if (!record) return bad(`Unknown product: ${productId}`, 404);
  await upsertProduct(record);

  const existing = await prisma.wishlistItem.findFirst({
    where: { userId, productId, removedAt: null }
  });
  if (existing) return ok({ item: existing, created: false });

  const item = await prisma.wishlistItem.create({
    data: { userId, productId, category: record.category }
  });
  await prisma.user.update({
    where: { id: userId },
    data: { wishlistCount: { increment: 1 } }
  });

  return ok({ item, created: true }, 201);
}
