import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { StudioFlow } from "../components/StudioFlow";
import { addedDaysAgo } from "../data/demoWishlist";
import { formatInr, PRODUCTS, type Product } from "../data/products";
import { loadDiscovery } from "../lib/fetchDiscovery";
import { friendlyTheme } from "../lib/friendlyLabels";
import {
  blockerForProduct,
  fitClarity,
  pickByFitNotDiscount,
  similarCount,
  type DiscoveryTheme,
  type RankRow
} from "../lib/wishlistBlockers";
import { publicReviewUrl, reviewLinkLabel } from "../lib/sourceUrls";
import { STUDIO_SAVE_ID, studioRoom } from "../lib/studioFlow";
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
  const [themes, setThemes] = useState<DiscoveryTheme[]>([]);
  const [ranking, setRanking] = useState<RankRow[]>([]);

  useEffect(() => {
    loadDiscovery().then((payload) => {
      if (!payload) return;
      setThemes(payload.themes);
      setRanking(payload.ranking);
    });
  }, []);

  const topNonPrice = ranking.find((row) => !row.priceFlag);
  const topTheme =
    themes.find((theme) => theme.label === topNonPrice?.label || theme.id === topNonPrice?.themeId) ??
    themes[0];
  const kurtaCount = similarCount(items, "kurta-set");
  const suggested = useMemo(
    () => pickByFitNotDiscount(compared, addedDaysAgo),
    [compared]
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
    addToBag(picking.id, size, "wishlist");
    removeFromWishlist(picking.id);
    setCompare((prev) => prev.filter((item) => item !== picking.id));
    flash("Item added to bag");
    setPicking(null);
  }

  return (
    <div id={STUDIO_SAVE_ID} className="bg-white min-h-[60vh]">
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

        {items.length > 0 && (
          <div className="mt-4">
            <StudioFlow current="save" tone="light" />
          </div>
        )}

        {items.length > 0 && topTheme && (
          <div className="mt-4 border border-myntra-pink bg-[#fff4f6] p-4">
            <p className="text-[11px] font-bold tracking-[0.18em] text-myntra-pink">WHY THESE SAVES WAIT</p>
            <p className="font-bold mt-1">{friendlyTheme(topTheme.label)}</p>
            <p className="text-[13px] text-myntra-muted mt-1">{topTheme.summary}</p>
            {topTheme.quotes[0] && (
              <p className="text-[13px] mt-2">“{topTheme.quotes[0].text}”</p>
            )}
            {kurtaCount >= 2 && (
              <p className="text-[12px] mt-2">
                You have {kurtaCount} similar festive sets. Compare fit notes — not the next sale.
              </p>
            )}
            <div className="flex flex-wrap gap-4 mt-3">
              <Link to={studioRoom(null, "hang")} className="text-[12px] font-bold text-myntra-pink">
                HANG THEM IN THE ROOM →
              </Link>
              <Link to="/studio?view=focus" className="text-[12px] font-bold text-myntra-pink">
                SEE HOW THIS WAS RANKED →
              </Link>
            </div>
          </div>
        )}

        {crowded && items.length > 0 && (
          <div className="mt-3 bg-[#fff4f6] border border-[#ffd4de] px-3 py-2 text-[13px]">
            You have several similar festive sets saved. Compare up to 3 on fit and occasion, then move one to bag.
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
                    <b>{formatInr(product.price)}</b>
                  </div>
                  {addedDaysAgo(product.id) != null && (
                    <div className="text-[11px] text-myntra-muted mt-1">
                      Saved {addedDaysAgo(product.id)} days ago ·{" "}
                      {30 - (addedDaysAgo(product.id) ?? 0) > 0
                        ? `${30 - (addedDaysAgo(product.id) ?? 0)} days left to decide`
                        : "past 30 days"}
                    </div>
                  )}
                  {(() => {
                    const blocker = blockerForProduct(product, themes, ranking);
                    if (!blocker) return null;
                    return (
                      <p className="text-[11px] text-myntra-pink font-bold mt-2">
                        Waiting on {friendlyTheme(blocker.label).toLowerCase()}
                      </p>
                    );
                  })()}
                </div>
                <div className="grid grid-cols-2 border-t border-myntra-border">
                  <Link
                    to={studioRoom(product.id, "hang")}
                    className="py-3 text-center text-[12px] font-bold text-myntra-pink tracking-wide hover:bg-[#fff4f6]"
                  >
                    HANG
                  </Link>
                  <button
                    type="button"
                    className="border-l border-myntra-border py-3 text-[12px] font-bold text-myntra-pink tracking-wide hover:bg-[#fff4f6]"
                    onClick={() => openMove(product)}
                  >
                    MOVE TO BAG
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {compared.length >= 2 && (
          <div className="mt-8 border border-myntra-border">
            <div className="px-4 py-3 border-b border-myntra-border">
              <div className="font-bold text-sm">Compare ({compared.length})</div>
              {suggested && (
                <p className="text-[12px] mt-1">
                  Suggested: <b>{suggested.brand}</b> — {fitClarity(suggested).reason.toLowerCase()}.
                  Every look here is at one price, so the pick can only come from fit.
                </p>
              )}
            </div>
            <div className="grid md:grid-cols-3 divide-x divide-myntra-border">
              {compared.map((product) => {
                const blocker = blockerForProduct(product, themes, ranking);
                const quote = blocker?.quotes[0];
                const isPick = suggested?.id === product.id;
                const clarity = fitClarity(product);
                return (
                <div key={product.id} className={`p-4 text-[13px] ${isPick ? "bg-[#fff4f6]" : ""}`}>
                  {isPick && (
                    <p className="text-[11px] font-bold text-myntra-pink mb-2">SUGGESTED · SETTLE FIT</p>
                  )}
                  <img src={product.image} alt="" className="w-full aspect-[3/4] object-cover mb-3" />
                  <div className="font-bold">{product.brand}</div>
                  <div className="text-myntra-muted">{product.name}</div>
                  <div className="mt-1">{formatInr(product.price)}</div>
                  <p className="mt-2"><b>Fit:</b> {product.fit}</p>
                  <p><b>Occasion:</b> {product.occasion}</p>
                  <p className="text-[12px] mt-1">Size signal: {clarity.reason}</p>
                  <p className="text-myntra-muted mt-2">{product.fitNote}</p>
                  {blocker && (
                    <p className="mt-2 text-[12px]">
                      <b>Shoppers wait on:</b> {friendlyTheme(blocker.label)}
                    </p>
                  )}
                  {quote && (
                    <p className="mt-2 text-[12px] border-l-2 border-myntra-pink pl-2">
                      “{quote.text.slice(0, 160)}”
                      {quote.url || quote.reviewId ? (
                        <>
                          {" "}
                          <a
                            href={publicReviewUrl({
                              source: quote.source,
                              url: quote.url,
                              reviewId: quote.reviewId
                            })}
                            target="_blank"
                            rel="noreferrer"
                            className="font-bold text-myntra-pink"
                          >
                            {reviewLinkLabel(quote.source)} →
                          </a>
                        </>
                      ) : null}
                    </p>
                  )}
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
                );
              })}
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
