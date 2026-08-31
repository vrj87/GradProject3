import type { Product } from "../data/products";

const APPAREL = ["XS", "S", "M", "L", "XL", "XXL"];

function step(sizes: string[], current: string, delta: number): string {
  const order = sizes.every((size) => APPAREL.includes(size)) ? APPAREL : sizes;
  const index = order.findIndex((size) => size === current);
  if (index < 0) return sizes[0] ?? current;
  return order[Math.max(0, Math.min(order.length - 1, index + delta))] ?? current;
}

export function suggestSize(
  product: Product,
  usual: string,
  between: boolean
): { size: string; why: string; shift: "up" | "down" | "same" } {
  const note = product.fitNote.toLowerCase();
  const base = product.sizes.includes(usual) ? usual : product.sizes[0] ?? usual;
  const small = /runs (a little )?(small|snug)|snug|size up|larger one|half a size up|consider the larger/.test(
    note
  );
  const large = /runs (a little )?(large|big)|roomy|smaller uk|try the smaller/.test(note);
  const trueSize = /true to size|true at the waist|usually true|already oversized/.test(note);

  if (small || (between && !large)) {
    const size = step(product.sizes, base, 1);
    return {
      size,
      shift: size === base ? "same" : "up",
      why: between
        ? "You are between sizes and this piece often feels snug. Take the larger of the two."
        : "Shoppers say this runs a little small. Stay with your usual size only if you like a close fit."
    };
  }
  if (large) {
    const size = step(product.sizes, base, -1);
    return {
      size,
      shift: size === base ? "same" : "down",
      why: "Shoppers say this runs a little roomy. If you are between sizes, the smaller one is the safer try."
    };
  }
  if (trueSize) {
    return {
      size: base,
      shift: "same",
      why: "Notes call this close to true to size. Keep the size you already wear."
    };
  }
  return {
    size: base,
    shift: "same",
    why: "Keep the size you already wear unless a pin on the look says otherwise."
  };
}

export function matchingReview(product: Product, size: string): string | null {
  const hit = product.reviews.find(
    (review) => review.sizeBought === size || review.text.toLowerCase().includes(size.toLowerCase())
  );
  return hit?.text ?? product.reviews[0]?.text ?? null;
}
