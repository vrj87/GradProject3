import { Fragment, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CoachLookPanel } from "./CoachLookPanel";
import { ProductImage } from "./ProductImage";
import { RoomCoachCompare } from "./RoomCoachCompare";
import { addedDaysAgo } from "../data/demoWishlist";
import { PRODUCTS, formatInr, type Product } from "../data/products";
import { CLUSTER_LABEL } from "../lib/decidePiles";
import { suggestSize } from "../lib/sizeAdvice";
import { studioRoom } from "../lib/studioFlow";
import { useStore } from "../store";

function parsePair(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, 2);
}

export function StudioCoach() {
  const { wishlist, bag, addToBag, removeFromWishlist } = useStore();
  const [params] = useSearchParams();
  const [usual] = useState(() => localStorage.getItem("myntra-usual-size") || "M");
  const saved = useMemo(
    () => PRODUCTS.filter((item) => wishlist.includes(item.id)),
    [wishlist]
  );
  const bagged = useMemo(() => {
    const ids = [...new Set(bag.map((line) => line.productId))];
    return ids
      .map((id) => PRODUCTS.find((item) => item.id === id))
      .filter((item): item is Product => Boolean(item));
  }, [bag]);

  const [openId, setOpenId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>(() => parsePair(params.get("pair")));
  const [compareOpen, setCompareOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const left = saved.find((item) => item.id === selected[0]) ?? null;
  const right = saved.find((item) => item.id === selected[1]) ?? null;
  const compareCluster = left?.cluster ?? null;

  useEffect(() => {
    if (!openId) return;
    document.getElementById("studio-coach-item")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [openId]);

  useEffect(() => {
    if (!compareOpen || !left || !right) return;
    document.getElementById("studio-room-coach")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [compareOpen, left, right]);

  function toggleCompare(id: string, cluster: string) {
    setSelected((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length === 0) return [id];
      const first = saved.find((item) => item.id === current[0]);
      if (first && first.cluster !== cluster) return [id];
      if (current.length >= 2) return [current[0]!, id];
      return [...current, id];
    });
    setCompareOpen(false);
  }

  function bagLook(id: string, size?: string) {
    const product = PRODUCTS.find((item) => item.id === id);
    if (!product) return;
    const pick = size ?? suggestSize(product, usual, false).size;
    addToBag(id, pick, "wishlist");
    removeFromWishlist(id);
    setOpenId(null);
    setCompareOpen(false);
    setSelected((current) => current.filter((item) => item !== id));
    setStatus(`${product.brand} · size ${pick} is in your bag.`);
  }

  function dropLook(id: string) {
    const product = PRODUCTS.find((item) => item.id === id);
    removeFromWishlist(id);
    setOpenId(null);
    setSelected((current) => current.filter((item) => item !== id));
    setStatus(product ? `${product.brand} left the shortlist. That finishes the call.` : "Dropped.");
  }

  return (
    <div id="studio-view-coach" className="bg-[#1a1216] min-h-[70vh] text-white">
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
        <p className="text-[11px] font-bold tracking-[0.22em] text-white/50">YOUR SHORTLIST · THIS APP</p>
        <p className="text-sm text-white/70 mt-2 max-w-2xl">
          Will it fit, where I&apos;d wear it, and is it worth it — on the same wishlist as the rest of
          Myntra. No second server, and no demo shopper switcher.
        </p>

        {status && (
          <div className="mt-4 bg-white text-myntra-dark p-4 flex flex-wrap items-center gap-3">
            <p className="text-sm font-bold">{status}</p>
            <Link to="/bag" className="ml-auto text-[12px] font-bold text-myntra-pink">
              OPEN BAG →
            </Link>
          </div>
        )}

        {bagged.length > 0 && (
          <div className="mt-4 border border-white/20 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-bold tracking-[0.18em] text-white/50">IN YOUR BAG</p>
              <Link to="/bag" className="ml-auto text-[12px] font-bold text-myntra-pink">
                OPEN BAG →
              </Link>
            </div>
            <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
              {bagged.map((item) => (
                <div key={item.id} className="shrink-0 w-[72px]">
                  <ProductImage product={item} alt={item.brand} className="w-[72px] h-[96px] object-cover" />
                  <p className="text-[10px] font-bold mt-1 truncate">{item.brand}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {saved.length === 0 ? (
          <p className="mt-8 text-sm text-white/80">
            Nothing saved yet.{" "}
            <Link to="/shop/women" className="font-bold text-myntra-pink">
              Save a few similar looks →
            </Link>
          </p>
        ) : (
          <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {saved.map((item) => {
              const isSelected = selected.includes(item.id);
              const isOpen = openId === item.id;
              const blocked =
                !isSelected &&
                compareCluster !== null &&
                item.cluster !== compareCluster &&
                selected.length > 0;
              const age = addedDaysAgo(item.id);
              return (
                <Fragment key={item.id}>
                  <article
                    className={`relative z-10 bg-white text-myntra-dark p-4 flex flex-col gap-3 ${
                      isOpen ? "ring-2 ring-myntra-pink" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <ProductImage
                        product={item}
                        alt={item.brand}
                        className="w-14 h-[76px] object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold tracking-[0.14em] text-myntra-pink">
                          {CLUSTER_LABEL[item.cluster] ?? item.cluster}
                        </p>
                        <h3 className="font-bold truncate">{item.brand}</h3>
                        <p className="text-[12px] text-myntra-muted truncate">{item.name}</p>
                        <p className="text-[13px] mt-1">
                          {formatInr(item.price)}
                          {age !== undefined && (
                            <span className="text-myntra-muted text-[12px]">
                              {" "}
                              · saved {age} day{age === 1 ? "" : "s"} ago
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="mt-auto flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="relative z-10 bg-myntra-pink text-white font-bold px-3 py-2 text-[12px]"
                        onClick={() => {
                          setCompareOpen(false);
                          setOpenId((current) => (current === item.id ? null : item.id));
                        }}
                      >
                        {isOpen ? "HIDE COACH" : "ASK THE COACH"}
                      </button>
                      <button
                        type="button"
                        disabled={blocked}
                        className={`relative z-10 font-bold px-3 py-2 text-[12px] border ${
                          isSelected
                            ? "border-myntra-pink text-myntra-pink"
                            : "border-myntra-border text-myntra-dark"
                        } disabled:opacity-40`}
                        onClick={() => toggleCompare(item.id, item.cluster)}
                      >
                        {isSelected ? "SELECTED" : "COMPARE"}
                      </button>
                      <Link
                        to={studioRoom(item.id, "hang")}
                        className="relative z-10 font-bold px-3 py-2 text-[12px] text-myntra-pink self-center"
                      >
                        HANG IN THE ROOM →
                      </Link>
                    </div>
                  </article>
                  {isOpen && (
                    <div className="col-span-full relative z-20">
                      <CoachLookPanel
                        key={item.id}
                        product={item}
                        peers={saved.filter((other) => other.id !== item.id)}
                        usual={usual}
                        between={false}
                        onBag={bagLook}
                        onDrop={dropLook}
                        onClose={() => setOpenId(null)}
                      />
                    </div>
                  )}
                </Fragment>
              );
            })}
          </section>
        )}

        {compareOpen && left && right && (
          <div className="relative z-20 mt-6">
            <RoomCoachCompare
              left={left}
              right={right}
              zone={null}
              usual={usual}
              between={false}
              peers={saved}
              action="bag"
              onKeep={(id) => bagLook(id)}
              onClose={() => setCompareOpen(false)}
            />
          </div>
        )}

        {selected.length >= 2 && left && right && !compareOpen && (
          <div className="sticky bottom-4 z-30 mt-6 flex flex-wrap items-center gap-3 bg-myntra-pink text-white px-5 py-3">
            <span className="text-sm font-bold">
              {left.brand} vs {right.brand}
            </span>
            <button
              type="button"
              className="bg-white text-myntra-pink font-bold px-4 py-2 text-[12px]"
              onClick={() => {
                setOpenId(null);
                setCompareOpen(true);
              }}
            >
              COMPARE SIDE BY SIDE
            </button>
            <button type="button" className="text-[12px] font-bold underline" onClick={() => setSelected([])}>
              CLEAR
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
