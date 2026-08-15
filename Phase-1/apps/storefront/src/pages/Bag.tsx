import { Link } from "react-router-dom";
import { discount, formatInr } from "../data/products";
import { useStore } from "../store";

export function Bag() {
  const { bag, product, updateQty, removeFromBag } = useStore();
  const rows = bag
    .map((item) => ({ ...item, product: product(item.productId) }))
    .filter((item) => item.product);

  const mrp = rows.reduce((sum, row) => sum + (row.product?.mrp ?? 0) * row.qty, 0);
  const total = rows.reduce((sum, row) => sum + (row.product?.price ?? 0) * row.qty, 0);

  return (
    <div className="bg-[#fafafa] min-h-[60vh]">
      <div className="max-w-5xl mx-auto px-4 py-8 grid md:grid-cols-[1fr_320px] gap-4">
        <div>
          <h1 className="font-bold text-[16px] mb-4">
            My Bag <span className="text-myntra-muted font-normal">{rows.length} items</span>
          </h1>
          {rows.length === 0 && (
            <div className="bg-white border border-myntra-border text-center py-16">
              <p className="font-bold">There is nothing in your bag. Let&apos;s add some items.</p>
              <Link
                to="/wishlist"
                className="inline-block mt-4 border border-myntra-pink text-myntra-pink font-bold px-6 py-2 text-sm"
              >
                ADD ITEMS FROM WISHLIST
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
                  <b>{formatInr(row.product?.price ?? 0)}</b>{" "}
                  <span className="line-through text-myntra-muted text-xs">
                    {formatInr(row.product?.mrp ?? 0)}
                  </span>{" "}
                  {row.product && (
                    <span className="text-myntra-gold text-xs">({discount(row.product)}% OFF)</span>
                  )}
                </div>
                <p className="text-xs text-myntra-muted mt-2">14 days return available</p>
              </div>
              <button
                type="button"
                className="absolute top-2 right-3 text-2xl text-myntra-muted leading-none hover:text-myntra-dark"
                aria-label="Remove from bag"
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
            <span>{formatInr(mrp)}</span>
          </div>
          <div className="flex justify-between text-sm py-1 text-myntra-green">
            <span>Discount on MRP</span>
            <span>-{formatInr(mrp - total)}</span>
          </div>
          <div className="flex justify-between text-sm py-1">
            <span>Platform Fee</span>
            <span>{rows.length ? "₹20" : "₹0"}</span>
          </div>
          <div className="flex justify-between font-bold border-t border-myntra-border mt-3 pt-3">
            <span>Total Amount</span>
            <span>{formatInr(total + (rows.length ? 20 : 0))}</span>
          </div>
          <button
            type="button"
            disabled={!rows.length}
            className="w-full mt-4 bg-myntra-pink text-white font-bold py-3 disabled:opacity-40"
          >
            PLACE ORDER
          </button>
          <p className="text-[11px] text-myntra-muted mt-2">
            Demo checkout — no payment is collected.
          </p>
        </aside>
      </div>
    </div>
  );
}
