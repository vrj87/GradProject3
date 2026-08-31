import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { DoubtBody } from "../components/DoubtBody";
import { FittingLook } from "../components/FittingLook";
import { ProductImage } from "../components/ProductImage";
import { PRODUCTS, type Product } from "../data/products";
import {
  CLUSTER_LABEL,
  OCCASION_FILTERS,
  OCCASION_LABELS,
  isOccasionFilter,
  pilesForRoom,
  roomGenderOf,
  type OccasionFilter
} from "../lib/decidePiles";
import {
  ZONE_SPOT,
  hangOnRack,
  hangSlot,
  keepLook,
  lookTransitionName,
  pinByZone,
  sharedZones,
  type PinZone
} from "../lib/fittingRoom";
import { matchingReview, suggestSize } from "../lib/sizeAdvice";
import {
  STUDIO_HANG_ID,
  STUDIO_KEEP_ID,
  STUDIO_ROOM_ID,
  scrollToHangStep,
  scrollToKeepStep
} from "../lib/studioFlow";
import { tapPulse, withViewTransition } from "../lib/viewTransition";
import { useStore } from "../store";

function nowCoach({
  moved,
  bagged,
  winner,
  paired,
  zone
}: {
  moved: string;
  bagged: boolean;
  winner: Product | null;
  paired: boolean;
  zone: PinZone | null;
}) {
  if (moved && bagged) {
    return {
      n: "4",
      title: "Place the order to finish the demo",
      detail:
        "A bag add is not the north star. Place the order from here, or open the bag first — either way it lands in Orders as the W2P 30d event, with no coupon on the path."
    };
  }
  if (moved) {
    return {
      n: "Done",
      title: "Off the rack, without a coupon",
      detail: "Sale-waiting takes a look off. Hang another rack, or open the bag if something is waiting there."
    };
  }
  if (winner) {
    return {
      n: "3",
      title: "Pick a size, then move it to the bag",
      detail:
        "One look stayed. Tap your usual size — the suggestion is from shopper comments, not % off — then move it to the bag."
    };
  }
  if (paired && zone) {
    return {
      n: "2",
      title: "Keep the hanger you would wear",
      detail: "Same zone is lit on both looks. KEEP THIS LOOK. The other falls off the hook."
    };
  }
  if (paired) {
    return {
      n: "2",
      title: "Name the doubt on one body",
      detail: "Tap bust, waist, length, or foot on the silhouette. Both garments spotlight that zone."
    };
  }
  return {
    n: "1",
    title: "Hang two of the same kind",
    detail: "Tap a look on the rack, or drag it onto a hanger, so two similar saves share the body."
  };
}

export function Decide() {
  const { wishlist, bag, addToBag, removeFromWishlist, buyNow, placeOrder } = useStore();
  const items = PRODUCTS.filter((item) => wishlist.includes(item.id));
  const navigate = useNavigate();
  const bagCount = bag.reduce((sum, item) => sum + item.qty, 0);
  const [params, setParams] = useSearchParams();
  const focusId = params.get("item");
  const pileParam = params.get("pile");
  const hangStep = params.get("step") === "hang";
  const keepStep = params.get("step") === "keep";
  const occParam = params.get("occ");
  const night: OccasionFilter = isOccasionFilter(occParam) ? occParam : "any";
  const roomGender = roomGenderOf(items, focusId);
  const groups = useMemo(
    () => pilesForRoom(items, night, roomGender, pileParam),
    [items, night, roomGender, pileParam]
  );

  const [pileKey, setPileKey] = useState("");
  const [rack, setRack] = useState<Product[]>([]);
  const [out, setOut] = useState<Product[]>([]);
  const [zone, setZone] = useState<PinZone | null>(null);
  const [usual, setUsual] = useState(() => localStorage.getItem("myntra-usual-size") || "M");
  const [between, setBetween] = useState(false);
  const [moved, setMoved] = useState("");
  const [bagged, setBagged] = useState(false);
  const [droppingId, setDroppingId] = useState<string | null>(null);
  const [keptId, setKeptId] = useState<string | null>(null);

  const active =
    groups.find((group) => group.id === pileKey) ??
    groups.find((group) => group.items.some((item) => item.id === focusId)) ??
    groups[0];

  const hanging = (active?.items ?? []).filter((item) => item.gender === roomGender);

  useEffect(() => {
    if (pileParam && groups.some((group) => group.id === pileParam)) {
      setPileKey(pileParam);
      return;
    }
    const fromFocus = groups.find((group) => group.items.some((item) => item.id === focusId))?.id;
    if (fromFocus) {
      setPileKey(fromFocus);
      return;
    }
    if (!groups.some((group) => group.id === pileKey) && groups[0]) setPileKey(groups[0].id);
  }, [focusId, groups, pileParam, pileKey]);

  function chooseNight(id: OccasionFilter) {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (id === "any") next.delete("occ");
      else {
        next.set("occ", id);
        next.delete("pile");
      }
      if (!next.get("view")) next.set("view", "room");
      return next;
    });
  }

  useEffect(() => {
    setRack(hangOnRack(hanging, focusId));
    setOut([]);
    setZone(null);
    setDroppingId(null);
    setKeptId(null);
    setBagged(false);
    // pile / occasion / deep-link only — do not reset the rack after a bag.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pileKey, night, focusId, roomGender]);

  useEffect(() => {
    if (keepStep) {
      const timer = window.setTimeout(scrollToKeepStep, 80);
      return () => window.clearTimeout(timer);
    }
    if (hangStep) {
      const timer = window.setTimeout(scrollToHangStep, 80);
      return () => window.clearTimeout(timer);
    }
  }, [keepStep, hangStep, hanging.length]);

  const displayRack = (
    rack.length === 0 && out.length === 0 && !moved ? hangOnRack(hanging, focusId) : rack
  ).filter((item) => item.gender === roomGender);
  const left = displayRack[0] ?? null;
  const right = displayRack[1] ?? null;
  const kept = keptId ? displayRack.find((item) => item.id === keptId) ?? null : null;
  const showPair = !kept && Boolean(left && right);
  const winner = kept ?? (displayRack.length === 1 ? displayRack[0] : null);
  const nextChallenger = kept ? displayRack.find((item) => item.id !== kept.id) ?? null : null;
  const droppedLook = out[0] ?? null;
  const advice = winner ? suggestSize(winner, usual, between) : null;
  const reviewLine = winner && advice ? matchingReview(winner, advice.size) : null;
  const coach = nowCoach({ moved, bagged, winner, paired: showPair, zone });
  const zones = left && right ? sharedZones(left, right) : [];
  const leftPin = left && zone ? pinByZone(left, zone) : null;
  const rightPin = right && zone ? pinByZone(right, zone) : null;
  const keptPin = winner && zone ? pinByZone(winner, zone) : null;
  const namedPin = keptPin?.id === zone ? keptPin : null;

  function chooseZone(next: PinZone) {
    tapPulse();
    withViewTransition(() => setZone(next));
  }

  /** Keeping a look ends the pair and moves to size — it does not queue a third hanger. */
  function keep(id: string) {
    if (droppingId) return;
    const result = keepLook(displayRack, id);
    if (!result.dropped) return;
    setDroppingId(result.dropped.id);
    tapPulse();
    window.setTimeout(() => {
      withViewTransition(() => {
        setOut((list) => [result.dropped!, ...list.filter((item) => item.id !== result.dropped!.id)]);
        setRack(result.kept);
        setKeptId(id);
        setDroppingId(null);
      });
      window.setTimeout(scrollToKeepStep, 60);
    }, 280);
  }

  function challenge(id: string) {
    if (droppingId) return;
    const incoming = hanging.find((item) => item.id === id);
    if (!incoming) return;
    withViewTransition(() => {
      tapPulse();
      const champion = displayRack[0];
      setOut((list) => list.filter((item) => item.id !== id));
      setKeptId(null);
      if (!champion || champion.id === id) {
        setRack(hangOnRack(hanging, id));
        setZone(null);
        return;
      }
      setRack([champion, incoming, ...hanging.filter((item) => item.id !== champion.id && item.id !== id)]);
      setZone(null);
    });
  }

  /** Back to a pair with the look that stayed, when the shopper wants one more round. */
  function hangAnother() {
    if (!nextChallenger) return;
    withViewTransition(() => {
      tapPulse();
      setKeptId(null);
      setZone(null);
    });
    window.setTimeout(scrollToKeepStep, 60);
  }

  function hangOn(slot: "left" | "right", id: string) {
    if (droppingId) return;
    withViewTransition(() => {
      tapPulse();
      setRack(hangSlot(hanging, displayRack, slot, id));
      setOut((list) => list.filter((item) => item.id !== id));
      setKeptId(null);
      setZone(null);
    });
  }

  function finish(product: Product, size: string) {
    addToBag(product.id, size, "wishlist");
    removeFromWishlist(product.id);
    withViewTransition(() => {
      setRack((prev) => prev.filter((item) => item.id !== product.id));
      setKeptId(null);
      setZone(null);
      setBagged(true);
      setMoved(`${product.brand} · size ${size} is in your bag. Price never entered this room.`);
    });
  }

  function orderNow(product: Product, size: string) {
    const order = buyNow(product.id, size, "wishlist");
    if (!order) return;
    removeFromWishlist(product.id);
    navigate(`/orders?placed=${order.id}`);
  }

  /** Order what is already sitting in the bag, without a detour through checkout. */
  function orderBag() {
    const created = placeOrder();
    if (!created.length) return;
    navigate(`/orders?placed=${created.map((order) => order.id).join(",")}`);
  }

  function takeOff(product: Product) {
    removeFromWishlist(product.id);
    withViewTransition(() => {
      setRack((prev) => prev.filter((item) => item.id !== product.id));
      setKeptId(null);
      setZone(null);
      setBagged(false);
      setMoved(`${product.brand} left the hanger. We did not offer a sale.`);
    });
  }

  function clearOut() {
    for (const item of out) removeFromWishlist(item.id);
    setOut([]);
    setMoved("The rest of this rack is clear.");
  }

  function choosePile(id: string) {
    setPileKey(id);
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("pile", id);
      next.delete("item");
      if (!next.get("view")) next.set("view", "room");
      return next;
    });
  }

  return (
    <div id={STUDIO_ROOM_ID} className="bg-[#1a1216] min-h-[60vh] text-white">
      <div className="max-w-[1100px] mx-auto px-4 py-6 md:py-8">
        <div className="bg-myntra-pink text-white p-4 md:p-5">
          <p className="text-[11px] font-bold tracking-[0.22em]">
            DO THIS NOW · STEP {coach.n}
          </p>
          <p className="font-bold text-lg md:text-xl mt-1">{coach.title}</p>
          <p className="text-sm text-white/90 mt-1 max-w-2xl">{coach.detail}</p>
        </div>

        {bagCount > 0 && (
          <div className="bg-white/10 border border-white/20 px-4 py-3 mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="text-[12px] text-white/80">
              <b className="text-white">
                {bagCount} {bagCount === 1 ? "item" : "items"} in your bag
              </b>{" "}
              · waiting to be ordered
            </p>
            <div className="flex flex-wrap gap-4 ml-auto">
              <Link to="/bag" className="text-[12px] font-bold text-white/80 hover:text-white">
                GO TO BAG →
              </Link>
              <button type="button" onClick={orderBag} className="text-[12px] font-bold text-myntra-pink">
                ORDER {bagCount === 1 ? "IT" : "THEM"} NOW →
              </button>
            </div>
          </div>
        )}

        {moved && (
          <div className="mt-4 bg-white text-myntra-dark p-4">
            <p className="font-bold text-sm">{moved}</p>
            {bagged && (
              <p className="text-[12px] text-myntra-muted mt-1">
                Last step: place the order. That purchase — not the save, not the bag add — is what
                W2P 30d counts.
              </p>
            )}
            <div className="flex flex-wrap gap-3 mt-3 items-center">
              {bagged ? (
                <>
                  <button
                    type="button"
                    onClick={orderBag}
                    className="bg-myntra-pink text-white font-bold px-5 py-2.5 text-[12px] tracking-wide"
                  >
                    PLACE THE ORDER →
                  </button>
                  <Link to="/bag" className="text-[12px] font-bold text-myntra-pink">
                    GO TO BAG →
                  </Link>
                </>
              ) : (
                <Link to="/bag" className="text-[12px] font-bold text-myntra-pink">
                  OPEN BAG →
                </Link>
              )}
              {out.length > 0 && (
                <button type="button" className="text-[12px] font-bold text-myntra-pink" onClick={clearOut}>
                  CLEAR THE REST OF THE RACK →
                </button>
              )}
            </div>
          </div>
        )}

        {groups.length === 0 && !moved ? (
          <p id={STUDIO_HANG_ID} className="mt-8 text-sm text-white/80">
            Nothing is hanging.{" "}
            <Link to={`/shop/${roomGender}`} className="font-bold text-myntra-pink">
              Save a few similar looks →
            </Link>
          </p>
        ) : groups.length === 0 ? null : (
          <>
            <div className="mt-5 flex flex-wrap gap-2 items-center">
              {groups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => choosePile(group.id)}
                  className={`shrink-0 px-3 py-1.5 text-[12px] font-bold border ${
                    active?.id === group.id
                      ? "bg-white text-myntra-dark border-white"
                      : "border-white/30 text-white/80"
                  }`}
                >
                  {CLUSTER_LABEL[group.cluster] ?? group.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar mt-3">
              {OCCASION_FILTERS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => chooseNight(id)}
                  className={`shrink-0 px-3 py-1.5 text-[11px] font-bold ${
                    night === id ? "bg-white/20 text-white" : "text-white/50"
                  }`}
                >
                  {OCCASION_LABELS[id]}
                </button>
              ))}
            </div>

            {showPair && left && right && (
              <section
                id={STUDIO_KEEP_ID}
                className={`room-pair mt-6 ${keepStep ? "ring-2 ring-myntra-pink p-3" : ""}`}
              >
                <p className="text-[11px] font-bold tracking-[0.18em] text-white/50 mb-3">
                  ONE BODY · TWO HANGERS · NAME THE DOUBT
                </p>
                <div className="grid grid-cols-2 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-3 items-start">
                  <div className="col-span-2 md:col-span-1 md:col-start-2 md:row-start-1 flex justify-center">
                    <DoubtBody zones={zones} zone={zone} onZone={chooseZone} gender={roomGender} />
                  </div>
                  <div className="md:col-start-1 md:row-start-1">
                    <FittingLook
                      product={left}
                      zone={zone}
                      onZone={chooseZone}
                      onKeep={() => keep(left.id)}
                      onHangHere={(id) => hangOn("left", id)}
                      emphasizeKeep={keepStep || Boolean(zone)}
                      saved={wishlist.includes(left.id)}
                      dropping={droppingId === left.id}
                    />
                  </div>
                  <div className="md:col-start-3 md:row-start-1">
                    <FittingLook
                      product={right}
                      zone={zone}
                      onZone={chooseZone}
                      onKeep={() => keep(right.id)}
                      onHangHere={(id) => hangOn("right", id)}
                      emphasizeKeep={keepStep || Boolean(zone)}
                      saved={wishlist.includes(right.id)}
                      dropping={droppingId === right.id}
                    />
                  </div>
                </div>
                {zone && (leftPin || rightPin) && (
                  <div className="zone-quotes mt-3 grid grid-cols-2 gap-3 text-[12px] text-white/80">
                    <p>
                      <span className="font-bold text-white">{left.brand} · {ZONE_SPOT[zone].label}.</span>{" "}
                      {leftPin?.hint}
                    </p>
                    <p>
                      <span className="font-bold text-white">{right.brand} · {ZONE_SPOT[zone].label}.</span>{" "}
                      {rightPin?.hint}
                    </p>
                  </div>
                )}
              </section>
            )}

            {winner && (
              <section
                id={showPair ? undefined : STUDIO_KEEP_ID}
                className="mt-6 grid md:grid-cols-[minmax(0,280px)_1fr] gap-4 bg-white text-myntra-dark p-4"
              >
                <FittingLook
                  product={winner}
                  zone={zone}
                  onZone={chooseZone}
                  large
                  saved={wishlist.includes(winner.id)}
                />
                <div>
                  <p className="text-[11px] font-bold tracking-[0.18em] text-myntra-pink">THIS LOOK STAYED</p>
                  <h2 className="font-bold text-xl mt-1">{winner.brand}</h2>
                  <p className="text-sm text-myntra-muted">{winner.name}</p>
                  {kept && droppedLook && (
                    <p className="text-[12px] text-myntra-muted mt-2">
                      {droppedLook.brand} left the hanger. No coupon was offered.
                    </p>
                  )}
                  {zone && namedPin ? (
                    <div className="mt-3 border-l-2 border-myntra-pink pl-3">
                      <p className="text-[11px] font-bold tracking-[0.16em] text-myntra-pink">
                        YOU NAMED · {ZONE_SPOT[zone].label.toUpperCase()}
                      </p>
                      <p className="text-[13px] mt-1">{namedPin.hint}</p>
                    </div>
                  ) : (
                    <p className="text-[13px] mt-3">{winner.fitNote}</p>
                  )}
                  <p className="text-[12px] text-myntra-muted mt-4">What do you usually wear?</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {winner.sizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => {
                          setUsual(size);
                          localStorage.setItem("myntra-usual-size", size);
                        }}
                        className={`min-w-11 h-11 rounded-full border text-sm font-bold ${
                          usual === size ? "border-myntra-pink text-myntra-pink" : "border-myntra-border"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                  <label className="flex items-center gap-2 mt-3 text-[13px]">
                    <input
                      type="checkbox"
                      className="accent-myntra-pink"
                      checked={between}
                      onChange={(event) => setBetween(event.target.checked)}
                    />
                    I am between sizes
                  </label>
                  {advice && (
                    <div className="mt-4 border-l-2 border-myntra-pink pl-3">
                      <p className="font-bold">Try {advice.size}</p>
                      <p className="text-[13px] text-myntra-muted mt-1">{advice.why}</p>
                      {reviewLine && <p className="text-[13px] mt-2">“{reviewLine}”</p>}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-3 mt-5">
                    <button
                      type="button"
                      className="bg-myntra-pink text-white font-bold px-5 py-2.5 text-sm"
                      onClick={() => advice && orderNow(winner, advice.size)}
                    >
                      ORDER {advice?.size} NOW
                    </button>
                    <button
                      type="button"
                      className="border border-myntra-pink text-myntra-pink font-bold px-5 py-2.5 text-sm"
                      onClick={() => advice && finish(winner, advice.size)}
                    >
                      MOVE {advice?.size} TO BAG
                    </button>
                    <button
                      type="button"
                      className="border border-myntra-border font-bold px-5 py-2.5 text-sm"
                      onClick={() => takeOff(winner)}
                    >
                      TAKE OFF THE RACK
                    </button>
                    {kept && nextChallenger && (
                      <button
                        type="button"
                        className="font-bold text-[12px] text-myntra-pink"
                        onClick={hangAnother}
                      >
                        HANG IT AGAINST {nextChallenger.brand.toUpperCase()} →
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-myntra-muted mt-3">
                    Order now places it straight away at MRP. Taking it off means you would only buy
                    on a sale — and this room will not add a coupon.
                  </p>
                </div>
              </section>
            )}

            <div
              id={STUDIO_HANG_ID}
              className={`mt-8 ${hangStep ? "ring-2 ring-myntra-pink p-3" : ""}`}
            >
              <p className="text-[11px] font-bold tracking-[0.18em] text-white/50">
                SWAP A LOOK · drag onto a hanger · {CLUSTER_LABEL[active?.cluster ?? ""] ?? "This rack"} ·{" "}
                {hanging.length}
              </p>
              <div className="flex gap-2 overflow-x-auto no-scrollbar mt-3 pb-1">
                {hanging.map((item) => {
                  const live = kept
                    ? kept.id === item.id
                    : displayRack[0]?.id === item.id || displayRack[1]?.id === item.id;
                  const gone = out.some((look) => look.id === item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.setData("text/product-id", item.id);
                        event.dataTransfer.effectAllowed = "move";
                      }}
                      onClick={() => challenge(item.id)}
                      className={`shrink-0 w-[72px] text-left ${gone ? "opacity-40" : ""} ${
                        live ? "ring-2 ring-myntra-pink" : ""
                      }`}
                    >
                      <ProductImage
                        product={item}
                        alt={item.brand}
                        className="w-[72px] h-[96px] object-cover"
                      />
                      <p className="text-[10px] font-bold mt-1 truncate">{item.brand}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {out.length > 0 && (
              <div className="mt-6">
                <p className="text-[11px] font-bold tracking-[0.18em] text-white/50">OFF THE RACK</p>
                <div className="flex gap-2 mt-2 overflow-x-auto no-scrollbar">
                  {out.map((item) => (
                    <ProductImage
                      key={item.id}
                      product={item}
                      alt={item.brand}
                      className="w-14 h-[72px] object-cover opacity-40"
                      style={{ viewTransitionName: lookTransitionName(item.id) }}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
