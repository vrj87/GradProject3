import { PrismaClient } from "@prisma/client";
import { CATALOG } from "../lib/catalog";

const prisma = new PrismaClient();

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

/**
 * Three personas from 5a. They exist to prove the segment gate does something:
 * only Priya should ever see a coach entry point.
 */
const USERS = [
  {
    id: "user-priya",
    name: "Priya",
    email: "priya@example.com",
    segmentTags: "S2,S4",
    optedOut: false,
    note: "Stalled Shortlister — six kurta sets, two sneakers, nothing bought."
  },
  {
    id: "user-sale-watcher",
    name: "Rohit",
    email: "rohit@example.com",
    segmentTags: "S3",
    optedOut: false,
    note: "S3 control — saves and waits for price timing. Coach is withheld by design."
  },
  {
    id: "user-decided",
    name: "Aisha",
    email: "aisha@example.com",
    segmentTags: "S2",
    optedOut: false,
    note: "Conversion control — already buys from her saves without help."
  }
];

interface SeedItem {
  userId: string;
  productId: string;
  addedDaysAgo: number;
  cartAddedDaysAgo?: number;
  purchasedDaysAgo?: number;
  removedDaysAgo?: number;
}

const ITEMS: SeedItem[] = [
  // Priya: a real shortlist — five ethnic saves plus two footwear, none decided.
  { userId: "user-priya", productId: "p-kurta-anarkali", addedDaysAgo: 21 },
  { userId: "user-priya", productId: "p-kurta-straight", addedDaysAgo: 18 },
  { userId: "user-priya", productId: "p-kurta-festive", addedDaysAgo: 12 },
  { userId: "user-priya", productId: "p-kurta-chikankari", addedDaysAgo: 8 },
  { userId: "user-priya", productId: "p-kurta-printed", addedDaysAgo: 4 },
  { userId: "user-priya", productId: "p-kurta-silk", addedDaysAgo: 1 },
  { userId: "user-priya", productId: "p-sneaker-white", addedDaysAgo: 15 },
  { userId: "user-priya", productId: "p-sneaker-chunky", addedDaysAgo: 6 },

  // Sale-watcher: would pass the predicate on paper, blocked as a control persona.
  { userId: "user-sale-watcher", productId: "p-dress-bodycon", addedDaysAgo: 25 },
  { userId: "user-sale-watcher", productId: "p-dress-midi", addedDaysAgo: 24 },
  { userId: "user-sale-watcher", productId: "p-bag-sling", addedDaysAgo: 20 },

  // Decided: two purchases inside the window trip the already-converting rule.
  { userId: "user-decided", productId: "p-dress-wrap", addedDaysAgo: 20, purchasedDaysAgo: 16 },
  { userId: "user-decided", productId: "p-top-shirt", addedDaysAgo: 14, purchasedDaysAgo: 10 },
  { userId: "user-decided", productId: "p-heels-block", addedDaysAgo: 5, cartAddedDaysAgo: 2 }
];

/**
 * A little demo activity so the funnel is not an empty page on first load.
 * Every row carries `seeded: true` and the dashboard says so out loud.
 */
const EVENTS: Array<{ userId: string; productId?: string; type: string; daysAgo: number }> = [
  { userId: "user-priya", productId: "p-kurta-anarkali", type: "coach_opened", daysAgo: 19 },
  { userId: "user-priya", productId: "p-kurta-anarkali", type: "fit_viewed", daysAgo: 19 },
  { userId: "user-priya", productId: "p-kurta-anarkali", type: "wishlist_revisit", daysAgo: 19 },
  { userId: "user-priya", productId: "p-kurta-straight", type: "coach_opened", daysAgo: 11 },
  { userId: "user-priya", productId: "p-kurta-straight", type: "value_viewed", daysAgo: 11 },
  { userId: "user-priya", productId: "p-kurta-chikankari", type: "compare_started", daysAgo: 7 },
  { userId: "user-priya", productId: "p-kurta-chikankari", type: "compare_completed", daysAgo: 7 },
  { userId: "user-priya", productId: "p-kurta-chikankari", type: "uncertainty_resolved", daysAgo: 7 },
  { userId: "user-priya", productId: "p-sneaker-white", type: "compare_started", daysAgo: 5 }
];

async function main() {
  await prisma.coachEvent.deleteMany();
  await prisma.coachSession.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  for (const product of CATALOG) {
    await prisma.product.create({
      data: {
        id: product.id,
        name: product.name,
        brand: product.brand,
        category: product.category,
        priceInr: product.priceInr,
        sizeChartText: product.sizeChartText ?? null,
        imageUrl: product.imageUrl ?? null,
        reviewsJson: JSON.stringify(product.reviews)
      }
    });
  }

  for (const user of USERS) {
    const count = ITEMS.filter((item) => item.userId === user.id).length;
    await prisma.user.create({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        segmentTags: user.segmentTags,
        optedOut: user.optedOut,
        wishlistCount: count
      }
    });
  }

  const itemIds = new Map<string, string>();
  for (const item of ITEMS) {
    const product = CATALOG.find((entry) => entry.id === item.productId);
    if (!product) throw new Error(`Seed references unknown product ${item.productId}`);

    const created = await prisma.wishlistItem.create({
      data: {
        userId: item.userId,
        productId: item.productId,
        category: product.category,
        addedAt: daysAgo(item.addedDaysAgo),
        cartAddedAt: item.cartAddedDaysAgo ? daysAgo(item.cartAddedDaysAgo) : null,
        purchasedAt: item.purchasedDaysAgo ? daysAgo(item.purchasedDaysAgo) : null,
        removedAt: item.removedDaysAgo ? daysAgo(item.removedDaysAgo) : null,
        status: item.purchasedDaysAgo
          ? "purchased"
          : item.cartAddedDaysAgo
            ? "cart_added"
            : item.removedDaysAgo
              ? "removed"
              : "active"
      }
    });
    itemIds.set(`${item.userId}:${item.productId}`, created.id);
  }

  for (const event of EVENTS) {
    await prisma.coachEvent.create({
      data: {
        userId: event.userId,
        wishlistItemId: event.productId
          ? (itemIds.get(`${event.userId}:${event.productId}`) ?? null)
          : null,
        type: event.type,
        metaJson: JSON.stringify({ seeded: true }),
        createdAt: daysAgo(event.daysAgo)
      }
    });
  }

  console.log(`Seeded ${CATALOG.length} products, ${USERS.length} users, ${ITEMS.length} saves, ${EVENTS.length} demo events.`);
  for (const user of USERS) {
    console.log(`  ${user.id} — ${user.note}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
