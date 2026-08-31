import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AccountNav } from "../components/AccountNav";
import { OrderCard } from "../components/OrderCard";
import { ORDERS } from "../data/orders";
import { PRODUCTS, type Product } from "../data/products";
import {
  ORDER_FILTERS,
  adaptLegacy,
  matchesFilter,
  orderBucket,
  w2pCount,
  type OrderFilter,
  type PlacedOrder
} from "../lib/placedOrders";
import { STUDIO_ENTRY, STUDIO_WHY } from "../lib/studioFlow";
import { useStore } from "../store";

export function Orders() {
  const [filter, setFilter] = useState<OrderFilter>("All");
  const [query, setQuery] = useState("");
  const { orders } = useStore();
  const [params] = useSearchParams();
  const justPlaced = (params.get("placed") ?? "").split(",").filter(Boolean);

  const all = useMemo<Array<{ order: PlacedOrder; product: Product }>>(() => {
    const rows = [...orders, ...ORDERS.map(adaptLegacy)];
    return rows.flatMap((order) => {
      const product = PRODUCTS.find((item) => item.id === order.productId);
      return product ? [{ order, product }] : [];
    });
  }, [orders]);

  const rows = all.filter(({ order, product }) => {
    if (!matchesFilter(order.status, filter)) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      product.brand.toLowerCase().includes(q) ||
      product.name.toLowerCase().includes(q) ||
      order.id.includes(q)
    );
  });

  const counted = w2pCount(orders);
  const active = all.filter(({ order }) => orderBucket(order.status) === "Active").length;
  const fresh = all.find(({ order }) => justPlaced.includes(order.id));

  return (
    <div className="bg-myntra-bg min-h-[60vh]">
      <div className="max-w-5xl mx-auto px-4 py-8 grid md:grid-cols-[220px_1fr] gap-4">
        <AccountNav />
        <div>
          {fresh && (
            <div className="bg-white border border-myntra-pink p-4 mb-3">
              <p className="text-[11px] font-bold tracking-[0.18em] text-myntra-pink">
                ORDER PLACED · NO COUPON
              </p>
              <h2 className="font-bold text-lg mt-1">
                {fresh.product.brand} · size {fresh.order.size} is on its way
              </h2>
              <p className="text-[13px] text-myntra-muted mt-1">
                {fresh.order.fromWishlist
                  ? "This is the north-star event: a wishlisted item purchased inside 30 days, settled by fit instead of a discount."
                  : "This one came straight from the shop, so it does not count for W2P 30d."}
              </p>
              <div className="flex flex-wrap gap-4 mt-3">
                <Link
                  to={`/orders/${fresh.order.id}`}
                  className="text-[12px] font-bold text-myntra-pink"
                >
                  TRACK THIS ORDER →
                </Link>
                <Link to={STUDIO_ENTRY} className="text-[12px] font-bold text-myntra-pink">
                  BACK TO THE ROOM →
                </Link>
                <Link to={STUDIO_WHY} className="text-[12px] font-bold text-myntra-pink">
                  SEE HOW W2P IS COUNTED →
                </Link>
              </div>
            </div>
          )}

          <div className="bg-white border border-myntra-border p-4 mb-3">
            <h1 className="text-[16px] font-bold">All Orders</h1>
            <p className="text-[12px] text-myntra-muted mt-1">
              {all.length} orders · {active} in transit ·{" "}
              {counted > 0
                ? `${counted} from your wishlist inside 30 days, bought without a coupon`
                : "none from your current wishlist yet"}
            </p>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by brand, item, or order id"
              className="mt-3 w-full border border-myntra-border px-3 py-2 text-sm outline-none"
            />
            <div className="flex flex-wrap gap-2 mt-3">
              {ORDER_FILTERS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFilter(item)}
                  className={`text-[12px] font-bold px-3 py-1 border ${filter === item ? "border-myntra-pink text-myntra-pink bg-[#fff4f6]" : "border-myntra-border text-myntra-muted"}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {rows.length === 0 && (
            <div className="bg-white border border-myntra-border text-center py-16">
              <p className="font-bold">No orders found</p>
              <Link to="/shop/women" className="inline-block mt-3 text-myntra-pink text-sm font-bold">
                CONTINUE SHOPPING
              </Link>
            </div>
          )}

          <div className="space-y-3">
            {rows.map(({ order, product }) => (
              <OrderCard
                key={order.id}
                order={order}
                product={product}
                fresh={justPlaced.includes(order.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
