import type { Product as ProductRow, User as UserRow, WishlistItem as WishlistRow } from "@prisma/client";
import { findCatalogProduct } from "./catalog";
import { prisma } from "./prisma";
import { ProductRecordSchema, type ProductRecord } from "./schemas";
import type { SegmentUser } from "./segment";

/** Reviews live as JSON text because SQLite has no JSON column. */
export function toProductRecord(row: ProductRow): ProductRecord {
  let reviews: unknown = [];
  try {
    reviews = JSON.parse(row.reviewsJson);
  } catch {
    reviews = [];
  }

  return ProductRecordSchema.parse({
    id: row.id,
    sourceUrl: row.sourceUrl ?? undefined,
    name: row.name,
    brand: row.brand,
    category: row.category,
    priceInr: row.priceInr,
    sizeChartText: row.sizeChartText ?? undefined,
    imageUrl: row.imageUrl ?? undefined,
    reviews: Array.isArray(reviews) ? reviews : []
  });
}

export function toSegmentUser(user: UserRow, items: WishlistRow[]): SegmentUser {
  return {
    id: user.id,
    optedOut: user.optedOut,
    segmentTags: user.segmentTags ? user.segmentTags.split(",").map((tag) => tag.trim()) : [],
    wishlistItems: items.map((item) => ({
      addedAt: item.addedAt,
      purchasedAt: item.purchasedAt,
      removedAt: item.removedAt,
      category: item.category
    }))
  };
}

export async function getUserWithItems(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      wishlistItems: {
        orderBy: { addedAt: "asc" },
        include: { product: true }
      }
    }
  });
}

/** Database first, demo catalog second — a catalog SKU works before any seed. */
export async function getProductRecord(productId: string): Promise<ProductRecord | null> {
  const row = await prisma.product.findUnique({ where: { id: productId } });
  if (row) return toProductRecord(row);
  const fallback = findCatalogProduct(productId);
  return fallback ?? null;
}

export async function upsertProduct(record: ProductRecord): Promise<void> {
  const data = {
    sourceUrl: record.sourceUrl ?? null,
    name: record.name,
    brand: record.brand,
    category: record.category,
    priceInr: record.priceInr,
    sizeChartText: record.sizeChartText ?? null,
    imageUrl: record.imageUrl ?? null,
    reviewsJson: JSON.stringify(record.reviews)
  };
  await prisma.product.upsert({
    where: { id: record.id },
    create: { id: record.id, ...data },
    update: data
  });
}

/** Comparable saves this shopper already holds — the peer set for value confidence. */
export async function peersFor(
  userId: string,
  category: string,
  excludeProductId: string
): Promise<ProductRecord[]> {
  const items = await prisma.wishlistItem.findMany({
    where: { userId, category, removedAt: null, NOT: { productId: excludeProductId } },
    include: { product: true }
  });
  return items.map((item) => toProductRecord(item.product));
}

export async function recordSession(input: {
  userId: string;
  wishlistItemId?: string | null;
  type: string;
  payload: unknown;
  output: unknown;
  meta: unknown;
}) {
  return prisma.coachSession.create({
    data: {
      userId: input.userId,
      wishlistItemId: input.wishlistItemId ?? null,
      type: input.type,
      inputJson: JSON.stringify(input.payload),
      outputJson: JSON.stringify(input.output),
      generationMetaJson: JSON.stringify(input.meta)
    }
  });
}

export async function recordEvent(input: {
  userId: string;
  wishlistItemId?: string | null;
  type: string;
  meta?: Record<string, unknown>;
}) {
  return prisma.coachEvent.create({
    data: {
      userId: input.userId,
      wishlistItemId: input.wishlistItemId ?? null,
      type: input.type,
      metaJson: JSON.stringify(input.meta ?? {})
    }
  });
}

/** Records that an item was prompted, which the 3-day cap reads. */
export async function markPrompted(wishlistItemId: string) {
  return prisma.wishlistItem.update({
    where: { id: wishlistItemId },
    data: { lastPromptAt: new Date() }
  });
}
