import type { Product } from "../data/products";

export interface DiscoveryTheme {
  id: string;
  label: string;
  summary: string;
  barrierType?: string;
  quotes: Array<{ text: string; source: string; reviewId: string; url?: string }>;
}

export interface RankRow {
  rank: number;
  label: string;
  themeId?: string;
  barrierType?: string;
  priceFlag?: boolean;
  impactOnW2P: string;
  nonMonetaryFeasibility?: string;
  estimatedFrequency: number;
  score?: number;
}

const CLUSTER_THEME_IDS: Record<string, string[]> = {
  "kurta-set": ["fit-size-anxiety", "styling-occasion", "comparison-paralysis"],
  "white-sneaker": ["fit-size-anxiety", "comparison-paralysis"],
  "midi-dress": ["styling-occasion", "fit-size-anxiety", "comparison-paralysis"],
  saree: ["styling-occasion", "social-validation", "fit-size-anxiety"]
};

function themeKey(theme: DiscoveryTheme): string {
  return theme.id || theme.label;
}

export function themesById(themes: DiscoveryTheme[]): Map<string, DiscoveryTheme> {
  return new Map(themes.map((theme) => [themeKey(theme), theme]));
}

export function blockerForProduct(
  product: Product,
  themes: DiscoveryTheme[],
  ranking: RankRow[]
): DiscoveryTheme | null {
  const preferred = CLUSTER_THEME_IDS[product.cluster] ?? ["fit-size-anxiety"];
  const byId = themesById(themes);
  for (const id of preferred) {
    const theme = byId.get(id) ?? themes.find((item) => item.label.toLowerCase().includes(id.split("-")[0]));
    const row = ranking.find((item) => item.themeId === id || item.label === theme?.label);
    if (theme && !row?.priceFlag) return theme;
  }
  const first = ranking.find((row) => !row.priceFlag);
  if (!first) return themes[0] ?? null;
  return byId.get(first.themeId ?? "") ?? themes.find((theme) => theme.label === first.label) ?? null;
}

export function similarCount(items: Product[], cluster: string): number {
  return items.filter((item) => item.cluster === cluster).length;
}

/** Higher = easier to settle size without a sale. Discount is never an input. */
export function fitClarity(product: Product): { score: number; reason: string } {
  const note = product.fitNote.toLowerCase();
  if (/\btrue to size\b|\btrue at the waist\b|\busually true\b/.test(note)) {
    return { score: 3, reason: "Shoppers call this close to true to size" };
  }
  if (/between sizes|consider the larger|size up|half a size|pick the larger/.test(note)) {
    return { score: 2, reason: "There is a clear size action on the page" };
  }
  if (/runs (a little )?(small|large)|snug|varies|check the/.test(note)) {
    return { score: 1, reason: "Fit still needs a check" };
  }
  return { score: 2, reason: "A size note is on the page" };
}

export function pickByFitNotDiscount(
  products: Product[],
  daysSaved: (id: string) => number | undefined
): Product | null {
  if (products.length < 2) return null;
  return [...products].sort((a, b) => {
    const clarity = fitClarity(b).score - fitClarity(a).score;
    if (clarity !== 0) return clarity;
    return (daysSaved(b.id) ?? 0) - (daysSaved(a.id) ?? 0);
  })[0];
}
