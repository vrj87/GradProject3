import { Link } from "react-router-dom";
import { formatInr } from "../data/products";
import { useStore } from "../store";

export function Bag() {
  const { bag, product, updateQty, removeFromBag } = useStore();
  const rows = bag
    .map((item) => ({ ...item, product: product(item.productId) }))
    .filter((item) => item.product);

  const mrp = rows.reduce((sum, row) => sum + (row.product?.mrp ?? 0) * row.qty, 0);
  const total = rows.reduce((sum, row) => sum + (row.product?.price ?? 0) * row.qty, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 grid md:grid-cols-[1fr_320px] gap-8">
      <div>
        <h1 className="font-bold text-lg mb-4">My Bag ({rows.length} items)</h1>
        {rows.length === 0 && (
          <p className="text-myntra-muted">
            Bag is empty. <Link to="/shop/women" className="text-myntra-pink">Shop now</Link>
          </p>
        )}
        {rows.map((row) => (
          <div
            key={`${row.productId}-${row.size}`}
            className="flex gap-4 border border-myntra-border p-3 mb-3"
          >
            <img src={row.product?.image} alt="" className="w-24 h-32 object-cover" />
            <div className="flex-1 text-sm">
              <div className="font-bold">{row.product?.brand}</div>
              <div className="text-myntra-muted">{row.product?.name}</div>
              <div className="mt-2">Size: {row.size}</div>
              <div className="mt-1">{formatInr(row.product?.price ?? 0)}</div>
              <div className="flex items-center gap-3 mt-3">
                <button
                  type="button"
                  onClick={() => updateQty(row.productId, row.size, row.qty - 1)}
                >
                  −
                </button>
                <span>{row.qty}</span>
                <button
                  type="button"
                  onClick={() => updateQty(row.productId, row.size, row.qty + 1)}
                >
                  +
                </button>
                <button
                  type="button"
                  className="ml-4 text-myntra-pink"
                  onClick={() => removeFromBag(row.productId, row.size)}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <aside className="border border-myntra-border p-4 h-fit">
        <h2 className="font-bold text-sm mb-3">PRICE DETAILS</h2>
        <div className="flex justify-between text-sm py-1">
          <span>Total MRP</span>
          <span>{formatInr(mrp)}</span>
        </div>
        <div className="flex justify-between text-sm py-1 text-myntra-green">
          <span>Discount</span>
          <span>-{formatInr(mrp - total)}</span>
        </div>
        <div className="flex justify-between text-sm py-1">
          <span>Platform fee</span>
          <span>₹20</span>
        </div>
        <div className="flex justify-between font-bold border-t border-myntra-border mt-3 pt-3">
          <span>Total</span>
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
  );
}
