import { useMemo, useState } from "react";
import { ProductImage } from "./ProductImage";
import type { Product } from "../data/products";
import { formatInr } from "../data/products";
import {
  buildRoomCompare,
  parseRoomWearsPerMonth,
  ROOM_COACH_TABS,
  type FitBand,
  type RoomCoachLook,
  type RoomCoachTab,
  type WorthVerdict
} from "../lib/roomCoach";
import type { PinZone } from "../lib/fittingRoom";

const BAND_CHIP: Record<FitBand, string> = {
  high: "bg-[#e5f8ed] text-[#03a685]",
  moderate: "bg-[#fff6e5] text-[#d67b00]",
  low: "bg-[#fce8ec] text-myntra-pink"
};

const WORTH_CHIP: Record<WorthVerdict, string> = {
  "worth-it-now": "bg-[#e5f8ed] text-[#03a685]",
  "worth-it-if": "bg-[#fff6e5] text-[#d67b00]",
  hold: "bg-[#fce8ec] text-myntra-pink"
};

const WORTH_LABEL: Record<WorthVerdict, string> = {
  "worth-it-now": "Worth it now",
  "worth-it-if": "Worth it, with a condition",
  hold: "Hold"
};

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5 text-[13px] text-myntra-muted">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-myntra-pink" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function FitColumn({ look, product }: { look: RoomCoachLook; product: Product }) {
  const fit = look.fit;
  return (
    <div>
      <p className={`inline-block text-[11px] font-bold tracking-wide px-2 py-1 ${BAND_CHIP[fit.band]}`}>
        {fit.band} confidence
      </p>
      <p className="font-bold text-[15px] mt-2 leading-snug">{fit.sizePattern}</p>
      <p className="text-[13px] mt-2">
        Try <b>{fit.suggestedSize}</b> — {fit.sizeWhy}
      </p>
      <p className="text-[11px] font-bold tracking-[0.14em] text-myntra-muted mt-4">WHAT THE REVIEWS SAY</p>
      <div className="mt-2">
        <Bullets items={fit.signals} />
      </div>
      <p className="text-[11px] font-bold tracking-[0.14em] text-myntra-muted mt-4">BODY</p>
      <div className="mt-2">
        <Bullets items={fit.bodyNotes} />
      </div>
      <p className="text-[11px] font-bold tracking-[0.14em] text-myntra-muted mt-4">RETURN RISK</p>
      <div className="mt-2">
        <Bullets items={fit.returnRisk} />
      </div>
      <p className="text-[11px] text-myntra-muted mt-3">{product.fit} · {product.material}</p>
    </div>
  );
}

function WearColumn({ look }: { look: RoomCoachLook }) {
  const wear = look.wear;
  return (
    <div>
      <p className="text-[11px] font-bold tracking-[0.14em] text-myntra-muted">OCCASIONS REVIEWERS NAMED</p>
      <ul className="mt-2 space-y-2">
        {wear.occasions.map((row) => (
          <li key={row.name} className="border border-myntra-border p-3">
            <p className="font-bold capitalize">{row.name}</p>
            <p className="text-[13px] text-myntra-muted mt-1">{row.verdict}</p>
          </li>
        ))}
      </ul>
      <p className="text-[11px] font-bold tracking-[0.14em] text-myntra-muted mt-4">PAIRINGS</p>
      <div className="mt-2">
        <Bullets items={wear.pairings} />
      </div>
      <p className="text-[11px] font-bold tracking-[0.14em] text-myntra-muted mt-4">WATCH OUT FOR</p>
      <div className="mt-2">
        <Bullets items={wear.cautions} />
      </div>
    </div>
  );
}

function WorthColumn({ look }: { look: RoomCoachLook }) {
  const worth = look.worth;
  return (
    <div>
      <p className={`inline-block text-[11px] font-bold tracking-wide px-2 py-1 ${WORTH_CHIP[worth.verdict]}`}>
        {WORTH_LABEL[worth.verdict]}
      </p>
      <p className="font-bold text-[15px] mt-2 leading-snug">{worth.headline}</p>
      <div className="grid grid-cols-3 gap-2 mt-3">
        <div className="border border-myntra-border p-2">
          <p className="text-[10px] font-bold tracking-wide text-myntra-muted">PRICE</p>
          <p className="font-bold">{formatInr(worth.priceInr)}</p>
        </div>
        <div className="border border-myntra-border p-2">
          <p className="text-[10px] font-bold tracking-wide text-myntra-muted">PER WEAR</p>
          <p className="font-bold">{formatInr(worth.costPerWearInr)}</p>
        </div>
        <div className="border border-myntra-border p-2">
          <p className="text-[10px] font-bold tracking-wide text-myntra-muted">WEARS</p>
          <p className="font-bold">{worth.wearsAssumed}</p>
        </div>
      </div>
      <p className="text-[12px] text-myntra-muted mt-2">Based on {worth.wearBasis}.</p>
      <p className="text-[11px] font-bold tracking-[0.14em] text-myntra-muted mt-4">AGAINST THE OTHER HANGER</p>
      <p className="text-[13px] mt-1">{worth.peerNote}</p>
      <p className="text-[11px] font-bold tracking-[0.14em] text-myntra-muted mt-4">QUALITY SIGNALS</p>
      <div className="mt-2">
        <Bullets items={worth.qualitySignals} />
      </div>
      <p className="text-[11px] font-bold tracking-[0.14em] text-myntra-muted mt-4">WHAT WOULD CHANGE THIS</p>
      <div className="mt-2">
        <Bullets items={worth.whatWouldChangeIt} />
      </div>
    </div>
  );
}

export function RoomCoachCompare({
  left,
  right,
  zone,
  usual,
  between,
  peers,
  onKeep,
  onClose
}: {
  left: Product;
  right: Product;
  zone: PinZone | null;
  usual: string;
  between: boolean;
  peers?: Product[];
  onKeep: (id: string) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<RoomCoachTab>("fit");
  const [wearsInput, setWearsInput] = useState("");
  const [wearsPerMonth, setWearsPerMonth] = useState<number | undefined>(undefined);
  const [wearError, setWearError] = useState<string | null>(null);

  const compare = useMemo(
    () =>
      buildRoomCompare(left, right, zone, {
        usual,
        between,
        occasionsPerMonth: wearsPerMonth,
        peers
      }),
    [left, right, zone, usual, between, wearsPerMonth, peers]
  );
  const pair = [left, right];
  const pick = pair.find((item) => item.id === compare.recommendation.itemId) ?? left;

  function applyEstimate() {
    const parsed = parseRoomWearsPerMonth(wearsInput);
    if (parsed === undefined) {
      setWearError("Enter how many times a month you would wear it, up to 31.");
      return;
    }
    setWearError(null);
    setWearsPerMonth(parsed);
    setTab("worth");
  }

  return (
    <section id="studio-room-coach" className="mt-5 bg-white text-myntra-dark p-4 md:p-5">
      <div className="flex flex-wrap items-start gap-3">
        <div>
          <p className="text-[11px] font-bold tracking-[0.18em] text-myntra-pink">COACH ON THIS PAIR</p>
          <h3 className="font-bold text-lg mt-1">Finish the call on these two hangers</h3>
          <p className="text-[13px] text-myntra-muted mt-1 max-w-xl">
            Will it fit, where I&apos;d wear it, and is it worth it — on this pair, in this room.
          </p>
        </div>
        <button type="button" onClick={onClose} className="ml-auto text-[12px] font-bold text-myntra-pink">
          CLOSE
        </button>
      </div>

      <nav className="mt-4 flex flex-wrap gap-2" aria-label="Coach questions">
        {ROOM_COACH_TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`px-3 py-2 text-[13px] font-bold border ${
              tab === item.id
                ? "bg-myntra-pink text-white border-myntra-pink"
                : "border-myntra-border text-myntra-dark bg-white"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="mt-4 overflow-x-auto">
        <div className="grid grid-cols-2 gap-4 min-w-[520px]">
          {pair.map((item) => (
            <div key={item.id} className="min-w-0">
              <ProductImage
                product={item}
                alt={item.brand}
                className="w-14 h-[76px] object-cover mb-2"
              />
              <p className="font-bold">{item.brand}</p>
              <p className="text-myntra-muted text-[12px]">{item.name}</p>
              <p className="text-[12px] mt-0.5">{formatInr(item.price)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        {pair.map((item) => {
          const look = compare.looks.find((row) => row.itemId === item.id);
          if (!look) return null;
          return (
            <div key={`${item.id}-${tab}`} className="min-w-0">
              {tab === "fit" && <FitColumn look={look} product={item} />}
              {tab === "wear" && <WearColumn look={look} />}
              {tab === "worth" && <WorthColumn look={look} />}
            </div>
          );
        })}
      </div>

      {tab === "worth" && (
        <form
          className="mt-5 border border-myntra-border p-3"
          onSubmit={(event) => {
            event.preventDefault();
            applyEstimate();
          }}
        >
          <p className="text-[11px] font-bold tracking-[0.14em] text-myntra-muted">YOUR OWN ESTIMATE</p>
          <p className="text-[13px] text-myntra-muted mt-1">
            Times you would wear either look in a typical month — recalculates cost per wear on both hangers.
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <input
              type="number"
              min={0}
              max={31}
              step="any"
              value={wearsInput}
              onChange={(event) => setWearsInput(event.target.value)}
              inputMode="decimal"
              placeholder="Wears per month"
              className="w-40 border border-myntra-border px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={wearsInput.trim() === ""}
              className="bg-myntra-pink text-white font-bold px-4 py-2 text-[12px] disabled:opacity-40"
            >
              Recalculate
            </button>
          </div>
          {wearError && <p className="text-[12px] text-myntra-pink mt-2">{wearError}</p>}
        </form>
      )}

      <div className="mt-4 border-l-2 border-myntra-pink pl-3">
        <p className="font-bold">{compare.recommendation.rationale}</p>
        <p className="text-[13px] text-myntra-muted mt-1">{compare.recommendation.wouldChangeIf}</p>
      </div>

      <div className="flex flex-wrap gap-3 mt-4">
        <button
          type="button"
          className="bg-myntra-pink text-white font-bold px-5 py-2.5 text-sm"
          onClick={() => onKeep(pick.id)}
        >
          KEEP {pick.brand.toUpperCase()}
        </button>
        {pair
          .filter((item) => item.id !== pick.id)
          .map((item) => (
            <button
              key={item.id}
              type="button"
              className="border border-myntra-pink text-myntra-pink font-bold px-5 py-2.5 text-sm"
              onClick={() => onKeep(item.id)}
            >
              KEEP {item.brand.toUpperCase()} INSTEAD
            </button>
          ))}
      </div>
    </section>
  );
}
