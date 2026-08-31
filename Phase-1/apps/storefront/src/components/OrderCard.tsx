import { Link } from "react-router-dom";
import { ProductImage } from "./ProductImage";
import { formatInr, type Product } from "../data/products";
import {
  autoTracks,
  countsForW2P,
  formatOrderDate,
  nextStepLine,
  statusFooter,
  w2pLine,
  type OrderStatus,
  type PlacedOrder
} from "../lib/placedOrders";
import { useTick } from "../lib/useTick";

export const STATUS_COLOR: Record<OrderStatus, string> = {
  Placed: "bg-myntra-pink",
  Packed: "bg-myntra-pink",
  Shipped: "bg-[#526cd0]",
  "Out for delivery": "bg-[#526cd0]",
  Delivered: "bg-myntra-green",
  Cancelled: "bg-[#f16565]",
  "Return requested": "bg-myntra-gold",
  Returned: "bg-myntra-gold",
  "Exchange requested": "bg-[#526cd0]",
  Exchanged: "bg-[#526cd0]"
};

export function OrderCard({
  order,
  product,
  fresh = false
}: {
  order: PlacedOrder;
  product: Product;
  fresh?: boolean;
}) {
  const counted = countsForW2P(order);
  const moving = autoTracks(order);
  const now = useTick(1000, moving);
  const nextStep = moving ? nextStepLine(order, now) : null;

  return (
    <article
      className={`bg-white border ${fresh ? "border-myntra-pink ring-1 ring-myntra-pink" : "border-myntra-border"}`}
    >
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-myntra-border text-[13px]">
        <span
          className={`w-2.5 h-2.5 rounded-full ${STATUS_COLOR[order.status]} ${moving ? "order-live" : ""}`}
        />
        <b>{order.status}</b>
        <span className="text-myntra-muted">On {formatOrderDate(order.placedIso)}</span>
        {fresh && (
          <span className="ml-auto bg-myntra-pink text-white text-[10px] font-bold px-1.5 py-0.5">
            JUST PLACED
          </span>
        )}
      </div>
      <Link to={`/orders/${order.id}`} className="flex gap-4 p-4 hover:bg-[#fafafa]">
        <ProductImage product={product} alt="" className="w-20 h-24 object-cover shrink-0" />
        <div className="flex-1 min-w-0 text-[13px]">
          <div className="font-bold">{product.brand}</div>
          <div className="text-myntra-muted truncate">{product.name}</div>
          <div className="text-myntra-muted mt-1">
            Size: {order.size} · Qty: {order.qty}
          </div>
          <div className="mt-1">{formatInr(product.price * order.qty)}</div>
          <div className="text-[11px] text-myntra-muted mt-2">
            Order #{order.id} · {order.payment}
          </div>
          {order.fromWishlist && (
            <div
              className={`text-[11px] font-bold mt-2 ${counted ? "text-myntra-pink" : "text-myntra-muted"}`}
            >
              {w2pLine(order)}
            </div>
          )}
        </div>
        <span className="text-myntra-muted self-center text-xl">›</span>
      </Link>
      <div className="px-4 py-2.5 border-t border-myntra-border text-[12px] text-myntra-muted flex justify-between gap-3">
        <span>{nextStep ? `${nextStep} · no tap needed` : statusFooter(order, now)}</span>
        <Link to={`/orders/${order.id}`} className="text-myntra-pink font-bold shrink-0">
          {order.status === "Delivered" ? "Return / Exchange" : "Track order"}
        </Link>
      </div>
    </article>
  );
}
