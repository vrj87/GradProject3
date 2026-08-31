import { addedDaysAgo } from "../data/demoWishlist";
import { PRODUCTS, type Gender, type Product } from "../data/products";
import { fitClarity, pickByFitNotDiscount } from "./wishlistBlockers";

export interface SavePile {
  id: string;
  cluster: string;
  gender: Gender;
  label: string;
  items: Product[];
}

export const CLUSTER_LABEL: Record<string, string> = {
  "kurta-set": "Festive / kurta sets",
  "white-sneaker": "White sneakers",
  "midi-dress": "Dresses",
  saree: "Sarees",
  "casual-top": "Tops",
  "women-jeans": "Jeans",
  heels: "Heels",
  "men-shirt": "Shirts",
  "men-tee": "T-shirts",
  "men-jeans": "Jeans",
  "men-kurta": "Kurta sets",
  "men-sneaker": "Sneakers",
  "kids-set": "Sets",
  "kids-ethnic": "Ethnic",
  "kids-dress": "Dresses"
};

const DEPT: Record<Gender, string> = {
  women: "Women",
  men: "Men",
  kids: "Kids",
  home: "Home",
  beauty: "Beauty"
};

function pileId(gender: Gender, cluster: string): string {
  return `${gender}::${cluster}`;
}

function pileLabel(gender: Gender, cluster: string): string {
  const base = CLUSTER_LABEL[cluster] ?? cluster;
  if (gender === "home" || gender === "beauty") return base;
  return `${DEPT[gender]} · ${base}`;
}

export function daysLeft(id: string): number {
  const saved = addedDaysAgo(id) ?? 0;
  return Math.max(0, 30 - saved);
}

/** Full catalog rack for every cluster the shopper has saved — same gender only. */
export function roomPilesFrom(saved: Product[]): SavePile[] {
  const keys = [...new Set(saved.map((item) => pileId(item.gender, item.cluster)))];
  return keys
    .map((id) => {
      const item = saved.find((row) => pileId(row.gender, row.cluster) === id);
      if (!item) {
        return { id, cluster: "", gender: "women" as Gender, label: "", items: [] as Product[] };
      }
      return {
        id,
        cluster: item.cluster,
        gender: item.gender,
        label: pileLabel(item.gender, item.cluster),
        items: PRODUCTS.filter((row) => row.gender === item.gender && row.cluster === item.cluster)
      };
    })
    .filter((pile) => pile.items.length >= 2)
    .sort((a, b) => b.items.length - a.items.length);
}

export function pilesFrom(items: Product[]): SavePile[] {
  const groups = new Map<string, Product[]>();
  for (const item of items) {
    const id = pileId(item.gender, item.cluster);
    const list = groups.get(id) ?? [];
    list.push(item);
    groups.set(id, list);
  }
  return [...groups.entries()]
    .map(([id, pile]) => ({
      id,
      cluster: pile[0]?.cluster ?? "",
      gender: pile[0]?.gender ?? "women",
      label: pileLabel(pile[0]?.gender ?? "women", pile[0]?.cluster ?? ""),
      items: pile
    }))
    .filter((pile) => pile.items.length >= 2)
    .sort((a, b) => b.items.length - a.items.length);
}

export function mostUrgent(items: Product[]): Product | null {
  if (!items.length) return null;
  return [...items].sort((a, b) => daysLeft(a.id) - daysLeft(b.id))[0] ?? null;
}

export function pickOneInPile(items: Product[]): Product | null {
  return pickByFitNotDiscount(items, addedDaysAgo);
}

export function clearestFit(items: Product[]): Product | null {
  if (!items.length) return null;
  return [...items].sort((a, b) => fitClarity(b).score - fitClarity(a).score)[0] ?? null;
}

export const OCCASION_FILTERS = ["any", "wedding", "party", "work", "everyday"] as const;
export type OccasionFilter = (typeof OCCASION_FILTERS)[number];

export const OCCASION_LABELS: Record<OccasionFilter, string> = {
  any: "Anything",
  wedding: "Wedding",
  party: "Party",
  work: "Work",
  everyday: "Everyday"
};

const OCCASION_RE: Record<Exclude<OccasionFilter, "any">, RegExp> = {
  wedding:
    /wedding|festive|saree|kurta|mehendi|sangeet|reception|lehenga|ethnic|puja|anarkali/,
  party: /party|dress|evening|satin|cocktail|dinner|heel|sequin|date night|night out/,
  work: /office|work|shirt|formal|weekday/,
  everyday: /sneaker|casual|everyday|tee|jean|weekend|play|lounge|running|training/
};

const OCCASION_ALIASES: Record<string, Exclude<OccasionFilter, "any">> = {
  wedding: "wedding",
  party: "party",
  work: "work",
  everyday: "everyday"
};

export function isRoomGender(value: string | null | undefined): value is Gender {
  return value === "women" || value === "men" || value === "kids";
}

export function roomGenderOf(saved: Product[], focusId?: string | null): Gender {
  const focus = PRODUCTS.find((item) => item.id === focusId);
  if (focus && isRoomGender(focus.gender)) return focus.gender;
  const counts = new Map<Gender, number>();
  for (const item of saved) {
    if (!isRoomGender(item.gender)) continue;
    counts.set(item.gender, (counts.get(item.gender) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "women";
}

/** Catalog racks that actually belong to an occasion — one gender, never a leftover sneaker pile. */
export function occasionPiles(event: string, gender: Gender = "women"): SavePile[] {
  if (event === "any" || !event || !isRoomGender(gender)) return [];
  const matched = PRODUCTS.filter((item) => item.gender === gender && occasionMatch(item, event) >= 2);
  return roomPilesFrom(matched)
    .map((pile) => ({
      ...pile,
      items: itemsForOccasion(pile.items, event).filter((item) => item.gender === gender)
    }))
    .filter((pile) => pile.gender === gender && pile.items.length >= 2);
}

export function pilesForRoom(
  saved: Product[],
  event: string,
  gender: Gender,
  pileParam?: string | null
): SavePile[] {
  const scoped = saved.filter((item) => item.gender === gender);
  const piles = event === "any" || !event ? roomPilesFrom(scoped) : occasionPiles(event, gender);
  const sameGender = piles.filter((pile) => pile.gender === gender);
  if (event !== "any" || !pileParam) return sameGender;
  if (sameGender.some((pile) => pile.id === pileParam)) return sameGender;
  const extra = pileFromCatalog(pileParam);
  if (!extra || extra.gender !== gender) return sameGender;
  return [extra, ...sameGender];
}

function occasionHay(product: Product): string {
  return `${product.occasion} ${product.name} ${product.cluster} ${product.category} ${product.description}`.toLowerCase();
}

export function isOccasionFilter(value: string | null | undefined): value is OccasionFilter {
  return !!value && (OCCASION_FILTERS as readonly string[]).includes(value);
}

export function occasionMatch(product: Product, event: string): number {
  if (event === "any" || !event) return 1;
  const rule = OCCASION_RE[event as Exclude<OccasionFilter, "any">];
  if (rule?.test(occasionHay(product))) return 2;
  return fitClarity(product).score > 2 ? 1 : 0;
}

export function itemsForOccasion(items: Product[], event: string): Product[] {
  if (event === "any" || !event) return items;
  return items.filter((item) => occasionMatch(item, event) >= 2);
}

export function pileFromCatalog(id: string): SavePile | undefined {
  const sep = id.indexOf("::");
  if (sep < 1) return undefined;
  const gender = id.slice(0, sep) as Gender;
  const cluster = id.slice(sep + 2);
  if (!cluster || !(["men", "women", "kids", "home", "beauty"] as Gender[]).includes(gender)) {
    return undefined;
  }
  const items = PRODUCTS.filter((row) => row.gender === gender && row.cluster === cluster);
  if (items.length < 2) return undefined;
  return { id, cluster, gender, label: pileLabel(gender, cluster), items };
}

export function matchesShopQuery(product: Product, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (occasionHay(product).includes(q) || product.brand.toLowerCase().includes(q)) return true;
  const alias = OCCASION_ALIASES[q];
  return alias ? occasionMatch(product, alias) >= 2 : false;
}

export function pickForOccasion(items: Product[], event: string): Product | null {
  if (!items.length) return null;
  return [...items].sort((a, b) => {
    const occ = occasionMatch(b, event) - occasionMatch(a, event);
    if (occ !== 0) return occ;
    return fitClarity(b).score - fitClarity(a).score;
  })[0];
}
