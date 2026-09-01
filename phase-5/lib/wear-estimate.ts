/** Shopper-typed wears per month; 31 is daily use. */
export const OCCASIONS_PER_MONTH_MAX = 31;

/** Accepts the number the input gives, or a typed string like "2" / "1,5". */
export function parseOccasionsPerMonth(raw: unknown): number | undefined {
  if (raw === undefined || raw === null || raw === "") return undefined;
  const n = typeof raw === "number" ? raw : Number(String(raw).trim().replace(",", "."));
  if (!Number.isFinite(n)) return undefined;
  return n;
}

export function monthlyEstimateStats(priceInr: number, perMonth: number) {
  const wearsAssumed = Math.max(1, Math.round(perMonth * 12));
  return {
    wearsAssumed,
    costPerWearInr: Math.round(priceInr / Math.max(1, wearsAssumed)),
    wearBasis: `your own estimate of ${perMonth} wear${perMonth === 1 ? "" : "s"} a month over a year`
  };
}
