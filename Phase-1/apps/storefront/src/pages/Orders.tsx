import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AccountNav } from "../components/AccountNav";
import { ORDERS, ORDER_FILTERS, type OrderStatus } from "../data/orders";
import { PRODUCTS, formatInr } from "../data/products";

const STATUS_COLOR: Record<OrderStatus, string> = {
  Delivered: "bg-myntra-green",
  Returned: "bg-myntra-gold",
  Cancelled: "bg-[#f16565]",
  Exchanged: "bg-[#526cd0]"
};

export function Orders() {
  const [filter, setFilter] = useState<(typeof ORDER_FILTERS)[number]>("All");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    return ORDERS.map((order) => ({
      order,
      product: PRODUCTS.find((item) => item.id === order.productId)
    })).filter((row) => {
      if (!row.product) return false;
      if (filter !== "All" && row.order.status !== filter) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        row.product.brand.toLowerCase().includes(q) ||
        row.product.name.toLowerCase().includes(q) ||
        row.order.id.includes(q)
      );
    });
  }, [filter, query]);

  return (
    <div className="bg-myntra-bg min-h-[60vh]">
      <div className="max-w-5xl mx-auto px-4 py-8 grid md:grid-cols-[220px_1fr] gap-4">
        <AccountNav />
        <div>
          <div className="bg-white border border-myntra-border p-4 mb-3">
            <h1 className="text-[16px] font-bold">All Orders</h1>
            <p className="text-[12px] text-myntra-muted mt-1">
              {ORDERS.length} orders in the last year · none from your current wishlist
            </p>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search in orders"
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
            {rows.map(({ order, product }) => {
              if (!product) return null;
              return (
                <article key={order.id} className="bg-white border border-myntra-border">
                  <div className="flex items-center gap-2 px-4 py-2.5 border-b border-myntra-border text-[13px]">
                    <span className={`w-2.5 h-2.5 rounded-full ${STATUS_COLOR[order.status]}`} />
                    <b>{order.status}</b>
                    <span className="text-myntra-muted">On {order.updatedOn}</span>
                  </div>
                  <Link to={`/product/${product.id}`} className="flex gap-4 p-4 hover:bg-[#fafafa]">
                    <img src={product.image} alt="" className="w-20 h-24 object-cover shrink-0" />
                    <div className="flex-1 min-w-0 text-[13px]">
                      <div className="font-bold">{product.brand}</div>
                      <div className="text-myntra-muted truncate">{product.name}</div>
                      <div className="text-myntra-muted mt-1">
                        Size: {order.size} · Qty: {order.qty}
                      </div>
                      <div className="mt-1">{formatInr(product.price)}</div>
                      <div className="text-[11px] text-myntra-muted mt-2">
                        Order #{order.id} · Paid by {order.payment} · Placed {order.placedOn}
                      </div>
                    </div>
                    <span className="text-myntra-muted self-center text-xl">›</span>
                  </Link>
                  <div className="px-4 py-2.5 border-t border-myntra-border text-[12px] text-myntra-muted flex justify-between">
                    <span>
                      {order.status === "Delivered" && "Exchange/Return window closed"}
                      {order.status === "Returned" && "Refund completed · fit did not work"}
                      {order.status === "Cancelled" && "You cancelled this order"}
                      {order.status === "Exchanged" && "Replacement delivered"}
                    </span>
                    {order.status === "Delivered" && (
                      <span className="text-myntra-pink font-bold">Rate Product</span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
