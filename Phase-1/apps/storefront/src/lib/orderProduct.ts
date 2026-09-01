import { fallbackImage } from "../data/productImages";
import { PRODUCTS, type Product } from "../data/products";
import type { PlacedOrder } from "./placedOrders";

/**
 * Every placed order keeps a row in All Orders, even after delivery and even
 * when the SKU is a coach snapshot rather than a catalogue id.
 */
export function productForOrder(order: PlacedOrder): Product {
  const catalog = PRODUCTS.find((item) => item.id === order.productId);
  if (catalog) return catalog;

  const image = order.snapshot?.image ?? fallbackImage("women");
  return {
    id: order.productId,
    brand: order.snapshot?.brand ?? "Shortlist look",
    name: order.snapshot?.name ?? "Ordered from the coach",
    gender: "women",
    category: "ethnic",
    price: order.snapshot?.price ?? 0,
    mrp: order.snapshot?.price ?? 0,
    rating: 0,
    ratingCount: 0,
    image,
    images: [image],
    sizes: [order.size],
    colors: [],
    description: "",
    seller: "Coach shortlist",
    material: "",
    fit: "",
    occasion: "",
    fitNote: "",
    cluster: "kurta-set",
    reviews: []
  };
}
