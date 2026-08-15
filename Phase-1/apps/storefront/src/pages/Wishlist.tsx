import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { addedDaysAgo } from "../data/demoWishlist";
import { discount, formatInr, PRODUCTS, type Product } from "../data/products";
import { useStore } from "../store";

export function Wishlist() {
  const { wishlist, addToBag, removeFromWishlist } = useStore();
  const items = PRODUCTS.filter((item) => wishlist.includes(item.id));
  const [picking, setPicking] = useState<Product | null>(null);
  const [size, setSize] = useState("");
  const [toast, setToast] = useState("");
  const [compareOn, setCompareOn] = useState(false);
  const [compare, setCompare] = useState<string[]>([]);

  const crowded = items.filter((item) => item.cluster === "kurta-set").length >= 3;
  const compared = useMemo(
    () => items.filter((item) => compare.includes(item.id)),
    [items, compare]
  );

  function flash(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  }

  function remove(id: string, name: string) {
    removeFromWishlist(id);
    setCompare((prev) => prev.filter((item) => item !== id));
    if (picking?.id === id) setPicking(null);
    flash(`${name} removed from wishlist`);
  }

  function toggleCompare(id: string) {
    setCompare((prev) => {
      if (prev.includes(id)) return prev.filter((item) => item !== id);
      if (prev.length >= 3) {
        flash("You can compare up to 3 items");
        return prev;
      }
      return [...prev, id];
    });
  }

  function openMove(product: Product) {
    setPicking(product);
    setSize(product.sizes[0]);
  }

  function confirmMove() {
    if (!picking || !size) return;
    addToBag(picking.id, size);
    removeFromWishlist(picking.id);
    setCompare((prev) => prev.filter((item) => item !== picking.id));
    flash("Item added to bag");
    setPicking(null);
  }

  return (
    <div className="bg-white min-h-[60vh]">
      <div className="max-w-[1080px] mx-auto px-4 py-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-[16px] font-bold">
            My Wishlist <span className="text-myntra-muted font-normal">{items.length} items</span>
          </h1>
          {items.length > 1 && (
            <button
              type="button"
              onClick={() => {
                setCompareOn((on) => !on);
                setCompare([]);
              }}
              className="text-[13px] font-bold text-myntra-pink"
            >
              {compareOn ? "Cancel compare" : "Compare similar"}
            </button>
          )}
        </div>

        {crowded && items.length > 0 && (
          <div className="mt-3 bg-[#fff4f6] border border-[#ffd4de] px-3 py-2 text-[13px]">
            You have several similar festive sets saved. Compare up to 3, then move one to bag or remove the rest.
          </div>
        )}

        {items.length === 0 ? (
          <div className="text-center py-24">
            <div className="mx-auto w-16 h-16 rounded-full border-2 border-myntra-pink text-myntra-pink text-3xl flex items-center justify-center">
              ♡
            </div>
            <h2 className="font-bold text-lg mt-6">Your wishlist is empty</h2>
            <p className="text-myntra-muted text-sm mt-2 max-w-sm mx-auto">
              Add items that you like to your wishlist. Review them anytime and easily move them to the bag.
            </p>
            <Link
              to="/shop/women"
              className="inline-block mt-6 border border-myntra-pink text-myntra-pink font-bold px-8 py-2.5 text-sm tracking-wide"
            >
              CONTINUE SHOPPING
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 mt-4 border-l border-t border-myntra-border">
            {items.map((product) => (
              <article key={product.id} className="border-r border-b border-myntra-border bg-white">
                <div className="relative">
                  <Link to={`/product/${product.id}`} className="block">
                    <div className="aspect-[3/4] overflow-hidden bg-myntra-bg">
                      <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={() => remove(product.id, product.brand)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/95 shadow text-myntra-muted text-lg leading-none hover:text-myntra-dark"
                    aria-label={`Remove ${product.name} from wishlist`}
                    title="Remove from wishlist"
                  >
                    ×
                  </button>
                  {compareOn && (
                    <label className="absolute top-2 left-2 bg-white/95 px-1.5 py-1 text-[11px] font-bold flex items-center gap-1">
                      <input
                        type="checkbox"
                        className="accent-myntra-pink"
                        checked={compare.includes(product.id)}
                        onChange={() => toggleCompare(product.id)}
                      />
                      Compare
                    </label>
                  )}
                </div>
                <div className="px-3 pt-3 pb-1">
                  <div className="font-bold text-[14px] truncate">{product.brand}</div>
                  <div className="text-myntra-muted text-[13px] truncate">{product.name}</div>
                  <div className="text-[13px] mt-1">
                    <b>{formatInr(product.price)}</b>{" "}
                    <span className="line-through text-myntra-muted text-[12px]">
                      {formatInr(product.mrp)}
                    </span>{" "}
                    <span className="text-myntra-gold text-[12px]">({discount(product)}% OFF)</span>
                  </div>
                  {addedDaysAgo(product.id) != null && (
                    <div className="text-[11px] text-myntra-muted mt-1">
                      Saved {addedDaysAgo(product.id)} days ago
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className="w-full border-t border-myntra-border py-3 text-[13px] font-bold text-myntra-pink tracking-wide hover:bg-[#fff4f6]"
                  onClick={() => openMove(product)}
                >
                  MOVE TO BAG
                </button>
              </article>
            ))}
          </div>
        )}

        {compared.length >= 2 && (
          <div className="mt-8 border border-myntra-border">
            <div className="px-4 py-3 border-b border-myntra-border font-bold text-sm">
              Compare ({compared.length})
            </div>
            <div className="grid md:grid-cols-3 divide-x divide-myntra-border">
              {compared.map((product) => (
                <div key={product.id} className="p-4 text-[13px]">
                  <img src={product.image} alt="" className="w-full aspect-[3/4] object-cover mb-3" />
                  <div className="font-bold">{product.brand}</div>
                  <div className="text-myntra-muted">{product.name}</div>
                  <div className="mt-1">{formatInr(product.price)}</div>
                  <p className="mt-2"><b>Fit:</b> {product.fit}</p>
                  <p><b>Occasion:</b> {product.occasion}</p>
                  <p className="text-myntra-muted mt-2">{product.fitNote}</p>
                  <button
                    type="button"
                    className="mt-3 w-full bg-myntra-pink text-white font-bold py-2 text-xs"
                    onClick={() => openMove(product)}
                  >
                    MOVE TO BAG
                  </button>
                  <button
                    type="button"
                    className="mt-2 w-full text-myntra-muted text-xs font-bold"
                    onClick={() => remove(product.id, product.brand)}
                  >
                    REMOVE
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {picking && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-0 md:p-6">
          <div className="bg-white w-full max-w-md p-5">
            <div className="flex justify-between items-start gap-4">
              <div className="flex gap-3">
                <img src={picking.image} alt="" className="w-14 h-[72px] object-cover" />
                <div className="text-sm">
                  <div className="font-bold">{picking.brand}</div>
                  <div className="text-myntra-muted">{picking.name}</div>
                  <div className="mt-1">{formatInr(picking.price)}</div>
                </div>
              </div>
              <button type="button" className="text-2xl leading-none text-myntra-muted" onClick={() => setPicking(null)}>
                ×
              </button>
            </div>
            <div className="font-bold text-sm mt-5 mb-3">Select Size</div>
            <div className="flex flex-wrap gap-2">
              {picking.sizes.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setSize(option)}
                  className={`min-w-12 h-12 rounded-full border text-sm ${size === option ? "border-myntra-pink text-myntra-pink" : "border-myntra-border"}`}
                >
                  {option}
                </button>
              ))}
            </div>
            <p className="text-[12px] text-myntra-muted mt-3">{picking.fitNote}</p>
            <button
              type="button"
              onClick={confirmMove}
              className="w-full mt-5 bg-myntra-pink text-white font-bold py-3 text-sm tracking-wide"
            >
              DONE
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#282c3f] text-white text-sm px-5 py-2.5 shadow-card max-w-[90%]">
          {toast}
        </div>
      )}
    </div>
  );
}
