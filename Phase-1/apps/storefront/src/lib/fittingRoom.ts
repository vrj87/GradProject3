import type { Product } from "../data/products";
import { daysLeft } from "./decidePiles";

export type PinZone = "bust" | "waist" | "length" | "foot" | "overall";

export interface FitPin {
  id: PinZone;
  label: string;
  x: string;
  y: string;
  hint: string;
  quote?: string;
  who?: string;
  sizeBought?: string;
}

function sentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+/).map((part) => part.trim()).filter(Boolean);
}

function snippet(note: string, re: RegExp): string {
  return sentences(note).find((part) => re.test(part)) ?? note;
}

function reviewFor(product: Product, re: RegExp) {
  return product.reviews.find((review) => re.test(review.text)) ?? product.reviews[0];
}

function withQuote(product: Product, re: RegExp): Pick<FitPin, "quote" | "who" | "sizeBought"> {
  const hit = reviewFor(product, re);
  if (!hit) return {};
  return { quote: hit.text, who: hit.name, sizeBought: hit.sizeBought };
}

function isFootwear(product: Product): boolean {
  return (
    product.category === "footwear" ||
    product.cluster.includes("sneaker") ||
    product.sizes.some((size) => size.includes("UK"))
  );
}

export function fitPins(product: Product): FitPin[] {
  const hay = `${product.fitNote} ${product.reviews.map((review) => review.text).join(" ")}`.toLowerCase();
  const note = product.fitNote;

  if (isFootwear(product)) {
    return [
      {
        id: "foot",
        label: "Foot",
        x: "48%",
        y: "78%",
        hint: snippet(note, /runs|true|snug|roomy|toe|uk|wide|narrow/i),
        ...withQuote(product, /toe|size|uk|snug|roomy|wide|narrow/i)
      }
    ];
  }

  const pins: FitPin[] = [];
  if (/bust|chest|blouse/.test(hay)) {
    pins.push({
      id: "bust",
      label: "Bust",
      x: "46%",
      y: "28%",
      hint: snippet(note, /bust|chest|blouse|snug|small/i),
      ...withQuote(product, /bust|chest|blouse|snug/i)
    });
  }
  if (/waist|hip|forgiving|cling|true at the waist/.test(hay)) {
    pins.push({
      id: "waist",
      label: "Waist",
      x: "46%",
      y: "48%",
      hint: snippet(note, /waist|hip|forgiving|cling/i),
      ...withQuote(product, /waist|hip|cling/i)
    });
  }
  if (/length|midi|long|short|sleeve|hem|trouser/.test(hay)) {
    pins.push({
      id: "length",
      label: "Length",
      x: "74%",
      y: "72%",
      hint: snippet(note, /length|midi|long|short|sleeve|hem|trouser/i),
      ...withQuote(product, /length|midi|long|short|sleeve/i)
    });
  }
  if (!pins.length) {
    pins.push({
      id: "overall",
      label: "Fit",
      x: "50%",
      y: "38%",
      hint: note,
      ...withQuote(product, /size|fit|true|snug|roomy/i)
    });
  }
  return pins.slice(0, 3);
}

export const ZONE_ORDER: PinZone[] = ["bust", "waist", "length", "foot", "overall"];

export const ZONE_SPOT: Record<PinZone, { x: number; y: number; label: string }> = {
  bust: { x: 50, y: 30, label: "Bust" },
  waist: { x: 50, y: 46, label: "Waist" },
  length: { x: 50, y: 70, label: "Length" },
  foot: { x: 50, y: 90, label: "Foot" },
  overall: { x: 50, y: 38, label: "Fit" }
};

/** Zones that exist on either hanging look — one body, two garments. */
export function sharedZones(left: Product, right: Product): PinZone[] {
  const present = new Set<PinZone>([
    ...fitPins(left).map((pin) => pin.id),
    ...fitPins(right).map((pin) => pin.id)
  ]);
  return ZONE_ORDER.filter((zone) => present.has(zone));
}

export function lookTransitionName(id: string): string {
  return `look${id.replace(/[^a-z0-9]/gi, "")}`;
}

export function pinByZone(product: Product, zone: PinZone | null): FitPin | null {
  if (!zone) return null;
  const pins = fitPins(product);
  return pins.find((pin) => pin.id === zone) ?? pins[0] ?? null;
}

export function uniqueLooks(items: Product[]): Product[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

/** Drop a saved look onto the left or right hanger without mixing the rest of the rack. */
export function hangSlot(
  hanging: Product[],
  current: Product[],
  slot: "left" | "right",
  id: string
): Product[] {
  const incoming = hanging.find((item) => item.id === id);
  if (!incoming) return current.length ? current : hanging;
  const a = current[0];
  const b = current[1];
  const other =
    slot === "left"
      ? (b?.id === incoming.id ? a : b) ?? (a?.id === incoming.id ? undefined : a)
      : (a?.id === incoming.id ? b : a) ?? (b?.id === incoming.id ? undefined : b);
  const pair = slot === "left" ? [incoming, other] : [other, incoming];
  const unique = uniqueLooks(pair.filter((item): item is Product => Boolean(item)));
  const taken = new Set(unique.map((item) => item.id));
  return [...unique, ...hanging.filter((item) => !taken.has(item.id))];
}

export function keepLook(
  current: Product[],
  id: string
): { kept: Product[]; dropped: Product | null } {
  if (current.length < 2) return { kept: current, dropped: null };
  const chosen = current.find((item) => item.id === id);
  const dropped = current[0]?.id === id ? current[1] : current[0];
  if (!chosen || !dropped) return { kept: current, dropped: null };
  return {
    kept: [chosen, ...current.filter((item) => item.id !== chosen.id && item.id !== dropped.id)],
    dropped
  };
}

export function hangOnRack(items: Product[], focusId?: string | null): Product[] {
  const ordered = [...items].sort((a, b) => daysLeft(a.id) - daysLeft(b.id));
  if (!focusId) return ordered;
  const index = ordered.findIndex((item) => item.id === focusId);
  if (index <= 0) return ordered;
  const [focus] = ordered.splice(index, 1);
  return focus ? [focus, ...ordered] : ordered;
}

export function hangerLabel(id: string, saved = true): string {
  if (!saved) return "From shop";
  const left = daysLeft(id);
  if (left <= 0) return "Past 30d";
  if (left <= 7) return `${left}d left`;
  return `${left}d on hanger`;
}
