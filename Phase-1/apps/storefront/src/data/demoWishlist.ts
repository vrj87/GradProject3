/** Demo shopper shortlist for storefront testing. Matches the brief: several similar saves, fit doubt, not only waiting for a sale. */
export const DEMO_WISHLIST_SEED = "priya-shortlist-v1";

export const DEMO_WISHLIST: Array<{ id: string; addedDaysAgo: number }> = [
  { id: "w-kurta-1", addedDaysAgo: 3 },
  { id: "w-kurta-2", addedDaysAgo: 5 },
  { id: "w-kurta-3", addedDaysAgo: 6 },
  { id: "w-kurta-4", addedDaysAgo: 8 },
  { id: "w-kurta-6", addedDaysAgo: 11 },
  { id: "w-kurta-7", addedDaysAgo: 12 },
  { id: "w-sneaker-1", addedDaysAgo: 4 },
  { id: "w-sneaker-2", addedDaysAgo: 7 },
  { id: "w-sneaker-3", addedDaysAgo: 9 },
  { id: "w-dress-1", addedDaysAgo: 2 },
  { id: "w-dress-3", addedDaysAgo: 10 },
  { id: "w-saree-1", addedDaysAgo: 14 }
];

export const DEMO_WISHLIST_IDS = DEMO_WISHLIST.map((item) => item.id);

export function addedDaysAgo(id: string): number | undefined {
  return DEMO_WISHLIST.find((item) => item.id === id)?.addedDaysAgo;
}
