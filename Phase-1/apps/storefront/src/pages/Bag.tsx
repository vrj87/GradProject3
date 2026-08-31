import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatInr } from "../data/products";
import { PAYMENT_METHODS, type PaymentMethod } from "../lib/placedOrders";
import { useStore } from "../store";
import { STUDIO_ENTRY } from "../lib/studioFlow";

export function Bag() {
  const { bag, product, updateQty, removeFromBag, moveToWishlist, placeOrder } = useStore();
  const navigate = useNavigate();
  const [payment, setPayment] = useState<PaymentMethod>("UPI");
  const lines = bag.map((item) => ({ ...item, product: product(item.productId) }));
  const rows = lines.filter((row) => row.product);
  const stale = lines.filter((row) => !row.product);

  const total = rows.reduce((sum, row) => sum + (row.product?.price ?? 0) * row.qty, 0);
  const fromRoom = rows.filter((row) => row.fromWishlist).length;

  function checkout() {
    const created = placeOrder(payment);
    if (!created.length) return;
    navigate(`/orders?placed=${created.map((order) => order.id).join(",")}`);
  }

  return (
    <div className="bg-[#fafafa] min-h-[60vh]">
      <div className="max-w-5xl mx-auto px-4 py-8 grid md:grid-cols-[1fr_320px] gap-4">
        <div>
          <h1 className="font-bold text-[16px] mb-4">
            My Bag <span className="text-myntra-muted font-normal">{rows.length} items</span>
          </h1>
          {stale.map((row) => (
            <div
              key={`stale-${row.productId}-${row.size}`}
              className="flex items-center gap-4 bg-white border border-myntra-border p-3 mb-3"
            >
              <div className="flex-1 text-sm">
                <div className="font-bold">This bag line is no longer in the catalogue</div>
                <p className="text-myntra-muted text-xs mt-1">
                  {row.productId} · size {row.size} · it was still counted in your bag badge.
                </p>
              </div>
              <button
                type="button"
                className="border border-myntra-border font-bold px-4 py-2 text-[11px] tracking-[0.08em]"
                onClick={() => removeFromBag(row.productId, row.size)}
              >
                REMOVE
              </button>
            </div>
          ))}
          {lines.length === 0 && (
            <div className="bg-white border border-myntra-border text-center py-16">
              <p className="font-bold">There is nothing in your bag. Let&apos;s add some items.</p>
              <Link
                to={STUDIO_ENTRY}
                className="inline-block mt-4 border border-myntra-pink text-myntra-pink font-bold px-6 py-2 text-sm"
              >
                HANG A SAVE IN THE ROOM
              </Link>
            </div>
          )}
          {rows.map((row) => (
            <div
              key={`${row.productId}-${row.size}`}
              className="flex gap-4 bg-white border border-myntra-border p-3 mb-3 relative"
            >
              <Link to={`/product/${row.productId}`}>
                <img src={row.product?.image} alt="" className="w-28 h-36 object-cover" />
              </Link>
              <div className="flex-1 text-sm pr-6">
                <div className="font-bold">{row.product?.brand}</div>
                <div className="text-myntra-muted">{row.product?.name}</div>
                <div className="text-myntra-muted text-xs mt-1">Sold by: {row.product?.seller}</div>
                <div className="flex items-center gap-4 mt-3">
                  <div className="border border-myntra-border px-2 py-1 text-xs font-bold">
                    Size: {row.size}
                  </div>
                  <div className="border border-myntra-border px-2 py-1 text-xs font-bold flex items-center gap-2">
                    Qty:
                    <button type="button" onClick={() => updateQty(row.productId, row.size, row.qty - 1)}>
                      −
                    </button>
                    <span>{row.qty}</span>
                    <button type="button" onClick={() => updateQty(row.productId, row.size, row.qty + 1)}>
                      +
                    </button>
                  </div>
                </div>
                <div className="mt-3">
                  <b>{formatInr(row.product?.price ?? 0)}</b>
                </div>
                <p className="text-xs text-myntra-muted mt-2">14 days return available</p>
                <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-myntra-border">
                  <button
                    type="button"
                    className="text-[11px] font-bold tracking-[0.08em] text-myntra-pink"
                    onClick={() => moveToWishlist(row.productId, row.size)}
                  >
                    MOVE TO WISHLIST
                  </button>
                  <button
                    type="button"
                    className="text-[11px] font-bold tracking-[0.08em] text-myntra-muted hover:text-myntra-dark"
                    onClick={() => removeFromBag(row.productId, row.size)}
                  >
                    REMOVE
                  </button>
                </div>
              </div>
              <button
                type="button"
                className="absolute top-1 right-1 p-2 text-2xl text-myntra-muted leading-none hover:text-myntra-dark"
                aria-label={`Remove ${row.product?.brand ?? "item"} size ${row.size} from bag`}
                onClick={() => removeFromBag(row.productId, row.size)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <aside className="bg-white border border-myntra-border p-4 h-fit">
          <h2 className="font-bold text-[12px] text-myntra-muted mb-3">PRICE DETAILS ({rows.length} Items)</h2>
          <div className="flex justify-between text-sm py-1">
            <span>Total MRP</span>
            <span>{formatInr(total)}</span>
          </div>
          <div className="flex justify-between text-sm py-1">
            <span>Platform Fee</span>
            <span>{rows.length ? "₹20" : "₹0"}</span>
          </div>
          <div className="flex justify-between font-bold border-t border-myntra-border mt-3 pt-3">
            <span>Total Amount</span>
            <span>{formatInr(total + (rows.length ? 20 : 0))}</span>
          </div>
          <div className="mt-4 border-t border-myntra-border pt-3">
            <p className="font-bold text-[12px] text-myntra-muted">PAYMENT METHOD</p>
            <div className="mt-2 space-y-1.5">
              {PAYMENT_METHODS.map((method) => (
                <label key={method} className="flex items-center gap-2 text-[13px]">
                  <input
                    type="radio"
                    name="payment-method"
                    className="accent-myntra-pink"
                    checked={payment === method}
                    onChange={() => setPayment(method)}
                  />
                  {method}
                </label>
              ))}
            </div>
          </div>
          <button
            type="button"
            disabled={!rows.length}
            onClick={checkout}
            className="w-full mt-4 bg-myntra-pink text-white font-bold py-3 disabled:opacity-40"
          >
            PLACE ORDER
          </button>
          <p className="text-[11px] text-myntra-muted mt-2">
            Demo checkout — no payment is collected. Every item is at MRP; there is no coupon field.
          </p>
          {fromRoom > 0 && (
            <p className="text-[11px] text-myntra-pink font-bold mt-2">
              {fromRoom} {fromRoom === 1 ? "item" : "items"} came from the fitting room. Placing the
              order is the W2P 30d event — no coupon was applied.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
