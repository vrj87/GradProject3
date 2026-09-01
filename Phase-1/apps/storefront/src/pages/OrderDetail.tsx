import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AccountNav } from "../components/AccountNav";
import { STATUS_COLOR } from "../components/OrderCard";
import { OrderTracker } from "../components/OrderTracker";
import { ProductImage } from "../components/ProductImage";
import { ORDERS } from "../data/orders";
import { formatInr } from "../data/products";
import { productForOrder } from "../lib/orderProduct";
import {
  CANCEL_REASONS,
  RETURN_REASONS,
  adaptLegacy,
  autoTracks,
  canAdvance,
  canCancel,
  canExchange,
  canReturn,
  countsForW2P,
  formatOrderDate,
  formatOrderTime,
  nextStatus,
  nextStepLine,
  returnWindowLeft,
  scheduledIso,
  statusFooter,
  w2pLine
} from "../lib/placedOrders";
import { STUDIO_ENTRY } from "../lib/studioFlow";
import { useTick } from "../lib/useTick";
import { useStore } from "../store";

const PLATFORM_FEE = 20;

type Panel = "none" | "cancel" | "return" | "exchange";

export function OrderDetail() {
  const { id } = useParams();
  const { orders, advance, cancel, startReturn, startExchange } = useStore();
  const [panel, setPanel] = useState<Panel>("none");
  const [reason, setReason] = useState("");
  const [newSize, setNewSize] = useState("");

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [id]);

  const live = orders.find((order) => order.id === id);
  const legacy = ORDERS.find((order) => order.id === id);
  const order = live ?? (legacy ? adaptLegacy(legacy) : null);
  const product = order ? productForOrder(order) : null;
  const moving = Boolean(order && autoTracks(order));
  const now = useTick(1000, moving);

  if (!order || !product) {
    return (
      <div className="bg-myntra-bg min-h-[60vh]">
        <div className="max-w-5xl mx-auto px-4 py-8 grid md:grid-cols-[220px_1fr] gap-4">
          <AccountNav />
          <div className="bg-white border border-myntra-border text-center py-16">
            <p className="font-bold">We could not find that order</p>
            <Link to="/orders" className="inline-block mt-3 text-myntra-pink text-sm font-bold">
              BACK TO ORDERS
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const editable = Boolean(live);
  const items = product.price * order.qty;
  const total = items + PLATFORM_FEE;
  const counted = countsForW2P(order);
  const windowLeft = returnWindowLeft(order);
  const deliveryEta = order.status === "Delivered" ? null : scheduledIso(order, "Delivered");
  const sizes = product.sizes.filter((size) => size !== order.size);

  function openPanel(next: Panel) {
    setPanel(next);
    setReason("");
    setNewSize(sizes[0] ?? "");
  }

  function submit() {
    if (!live) return;
    if (panel === "cancel" && reason) cancel(live.id, reason);
    if (panel === "return" && reason) startReturn(live.id, reason);
    if (panel === "exchange" && newSize) startExchange(live.id, newSize);
    setPanel("none");
    setReason("");
  }

  return (
    <div className="bg-myntra-bg min-h-[60vh]">
      <div className="max-w-5xl mx-auto px-4 py-8 grid md:grid-cols-[220px_1fr] gap-4">
        <AccountNav />
        <div className="space-y-3">
          <div className="bg-white border border-myntra-border p-4">
            <Link to="/orders" className="text-[12px] font-bold text-myntra-pink">
              ← ALL ORDERS
            </Link>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span
                className={`w-2.5 h-2.5 rounded-full ${STATUS_COLOR[order.status]} ${moving ? "order-live" : ""}`}
              />
              <h1 className="text-[16px] font-bold">{order.status}</h1>
              <span className="text-[12px] text-myntra-muted">
                Order #{order.id} · placed {formatOrderDate(order.placedIso)}
              </span>
            </div>
            <p className="text-[13px] text-myntra-muted mt-1">{statusFooter(order, now)}</p>
            {order.fromWishlist && (
              <p
                className={`text-[12px] font-bold mt-2 ${counted ? "text-myntra-pink" : "text-myntra-muted"}`}
              >
                {w2pLine(order)}
              </p>
            )}
          </div>

          <div className="bg-white border border-myntra-border p-4">
            <div className="flex gap-4">
              <Link to={`/product/${product.id}`}>
                <ProductImage product={product} alt="" className="w-24 h-32 object-cover shrink-0" />
              </Link>
              <div className="text-[13px] min-w-0">
                <p className="font-bold">{product.brand}</p>
                <p className="text-myntra-muted">{product.name}</p>
                <p className="text-myntra-muted mt-1">
                  Size: {order.size} · Qty: {order.qty}
                  {order.exchangeSize ? ` · exchanging for ${order.exchangeSize}` : ""}
                </p>
                <p className="mt-1">{formatInr(items)}</p>
                <p className="text-[11px] text-myntra-muted mt-2">Sold by {product.seller}</p>
                <p className="text-[12px] mt-2">{product.fitNote}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-myntra-border p-4">
            <div className="flex flex-wrap items-baseline gap-2">
              <h2 className="font-bold text-[13px]">Tracking</h2>
              {moving && (
                <span className="text-[11px] font-bold tracking-[0.12em] text-myntra-pink">
                  UPDATING BY ITSELF
                </span>
              )}
            </div>
            <OrderTracker order={order} />
            {moving && (
              <p className="text-[12px] text-myntra-muted">
                {nextStepLine(order, now)} · nothing to tap.
                {deliveryEta ? ` Delivery lands around ${formatOrderTime(deliveryEta)}.` : ""}
              </p>
            )}
            {editable && canAdvance(order) && (
              <button
                type="button"
                onClick={() => advance(order.id)}
                className="mt-3 border border-myntra-border font-bold px-4 py-2 text-[12px]"
              >
                SKIP THE WAIT · {nextStatus(order)?.toUpperCase()} NOW
              </button>
            )}
          </div>

          <div className="bg-white border border-myntra-border p-4">
            <h2 className="font-bold text-[13px]">Price details</h2>
            <div className="flex justify-between text-sm py-1 mt-2">
              <span>
                Item MRP {order.qty > 1 ? `× ${order.qty}` : ""}
              </span>
              <span>{formatInr(items)}</span>
            </div>
            <div className="flex justify-between text-sm py-1">
              <span>Platform fee</span>
              <span>{formatInr(PLATFORM_FEE)}</span>
            </div>
            <div className="flex justify-between font-bold border-t border-myntra-border mt-2 pt-2">
              <span>{order.status === "Returned" ? "Refunded" : "Total paid"}</span>
              <span>{formatInr(total)}</span>
            </div>
            <p className="text-[11px] text-myntra-muted mt-2">
              Paid by {order.payment} at full MRP. No coupon, promo code, or markdown was applied on
              this order.
            </p>
          </div>

          {editable && (canCancel(order) || canReturn(order) || canExchange(order)) && (
            <div className="bg-white border border-myntra-border p-4">
              <h2 className="font-bold text-[13px]">Manage this order</h2>
              {order.status === "Delivered" && windowLeft > 0 && (
                <p className="text-[12px] text-myntra-muted mt-1">
                  {windowLeft} {windowLeft === 1 ? "day" : "days"} left in the return window.
                </p>
              )}
              <div className="flex flex-wrap gap-3 mt-3">
                {canCancel(order) && (
                  <button
                    type="button"
                    onClick={() => openPanel("cancel")}
                    className="border border-myntra-border font-bold px-4 py-2 text-[12px]"
                  >
                    CANCEL ORDER
                  </button>
                )}
                {canReturn(order) && (
                  <button
                    type="button"
                    onClick={() => openPanel("return")}
                    className="border border-myntra-border font-bold px-4 py-2 text-[12px]"
                  >
                    RETURN
                  </button>
                )}
                {canExchange(order) && sizes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => openPanel("exchange")}
                    className="border border-myntra-border font-bold px-4 py-2 text-[12px]"
                  >
                    EXCHANGE SIZE
                  </button>
                )}
              </div>

              {panel === "exchange" && (
                <div className="mt-4 border-t border-myntra-border pt-3">
                  <p className="text-[12px] font-bold">Which size should we send instead?</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {sizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setNewSize(size)}
                        className={`min-w-11 h-11 rounded-full border text-sm font-bold ${
                          newSize === size
                            ? "border-myntra-pink text-myntra-pink"
                            : "border-myntra-border"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-myntra-muted mt-2">
                    Same price. An exchange means the room called the size wrong — that is a signal we
                    keep, not something we paper over with a discount.
                  </p>
                </div>
              )}

              {(panel === "cancel" || panel === "return") && (
                <div className="mt-4 border-t border-myntra-border pt-3">
                  <p className="text-[12px] font-bold">
                    {panel === "cancel" ? "Why are you cancelling?" : "Why are you returning it?"}
                  </p>
                  <div className="mt-2 space-y-1.5">
                    {(panel === "cancel" ? CANCEL_REASONS : RETURN_REASONS).map((item) => (
                      <label key={item} className="flex items-center gap-2 text-[13px]">
                        <input
                          type="radio"
                          name="order-reason"
                          className="accent-myntra-pink"
                          checked={reason === item}
                          onChange={() => setReason(item)}
                        />
                        {item}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {panel !== "none" && (
                <div className="flex flex-wrap gap-3 mt-4">
                  <button
                    type="button"
                    disabled={panel === "exchange" ? !newSize : !reason}
                    onClick={submit}
                    className="bg-myntra-pink text-white font-bold px-5 py-2.5 text-[12px] disabled:opacity-40"
                  >
                    {panel === "cancel"
                      ? "CONFIRM CANCELLATION"
                      : panel === "return"
                        ? "REQUEST PICKUP"
                        : `EXCHANGE FOR ${newSize}`}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPanel("none")}
                    className="font-bold text-[12px] text-myntra-muted"
                  >
                    KEEP THIS ORDER
                  </button>
                </div>
              )}
            </div>
          )}

          {order.fromWishlist && (
            <div className="bg-white border border-myntra-pink p-4">
              <p className="text-[11px] font-bold tracking-[0.18em] text-myntra-pink">
                WHERE THIS ORDER CAME FROM
              </p>
              <p className="text-[13px] text-myntra-muted mt-1">
                {order.savedDaysAgo === null
                  ? "Saved on this account."
                  : `Saved ${order.savedDaysAgo} days before the purchase.`}{" "}
                Kept in the fitting room against a similar save, sized from shopper notes.
              </p>
              <Link
                to={STUDIO_ENTRY}
                className="inline-block mt-3 text-[12px] font-bold text-myntra-pink"
              >
                HANG THE NEXT PAIR →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
