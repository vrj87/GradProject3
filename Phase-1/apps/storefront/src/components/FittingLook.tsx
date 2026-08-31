import { useState } from "react";
import { ProductImage } from "./ProductImage";
import { formatInr, type Product } from "../data/products";
import { daysLeft } from "../lib/decidePiles";
import {
  fitPins,
  hangerLabel,
  lookTransitionName,
  pinByZone,
  type PinZone
} from "../lib/fittingRoom";
import { tapPulse } from "../lib/viewTransition";
import { fitClarity } from "../lib/wishlistBlockers";

export function FittingLook({
  product,
  zone,
  onZone,
  onKeep,
  onHangHere,
  keepLabel = "KEEP THIS LOOK",
  large,
  saved = true,
  emphasizeKeep = false,
  dropping = false
}: {
  product: Product;
  zone: PinZone | null;
  onZone: (zone: PinZone) => void;
  onKeep?: () => void;
  onHangHere?: (id: string) => void;
  keepLabel?: string;
  large?: boolean;
  saved?: boolean;
  emphasizeKeep?: boolean;
  dropping?: boolean;
}) {
  const pins = fitPins(product);
  const open = pinByZone(product, zone);
  const left = daysLeft(product.id);
  const wick = Math.max(4, Math.min(100, (left / 30) * 100));
  const popoverId = `fit-note-${product.id}`;
  const activePin = pins.find((pin) => pin.id === zone) ?? pins[0];
  const vt = lookTransitionName(product.id);
  const [over, setOver] = useState(false);

  function chooseZone(id: PinZone) {
    tapPulse();
    onZone(id);
  }

  return (
    <article
      className={`bg-white border border-myntra-border flex flex-col look-card ${dropping ? "look-drop" : ""} ${
        over ? "look-drop-target" : ""
      }`}
      style={{ viewTransitionName: vt, ["--look-vt" as string]: vt }}
      onDragOver={(event) => {
        if (!onHangHere) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        if (!onHangHere) return;
        event.preventDefault();
        setOver(false);
        const id = event.dataTransfer.getData("text/product-id");
        if (id && id !== product.id) onHangHere(id);
      }}
    >
      <div className="h-3 relative hanger-hook" aria-hidden>
        <span className="hanger-wick" style={{ width: `${wick}%` }} />
      </div>
      <div className={`relative overflow-hidden bg-myntra-bg ${large ? "aspect-[3/4]" : "aspect-[3/4]"}`}>
        <ProductImage
          product={product}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {zone && activePin && (
          <div
            className="fit-spotlight pointer-events-none absolute inset-0"
            style={{
              ["--spot-x" as string]: activePin.x,
              ["--spot-y" as string]: activePin.y
            }}
          />
        )}
        <span className="absolute top-2 left-2 bg-black/75 text-white text-[10px] font-bold px-1.5 py-0.5">
          {hangerLabel(product.id, saved)}
        </span>
        {pins.map((pin) => (
          <button
            key={pin.id}
            type="button"
            aria-label={`Fit note: ${pin.label}`}
            aria-pressed={zone === pin.id}
            popoverTarget={popoverId}
            onClick={() => chooseZone(pin.id)}
            className={`absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full text-[10px] font-bold border ${
              zone === pin.id
                ? "bg-myntra-pink text-white border-myntra-pink"
                : "bg-white text-myntra-pink border-myntra-pink"
            }`}
            style={{ left: pin.x, top: pin.y }}
          >
            {pin.label.slice(0, 1)}
          </button>
        ))}
        {open && (
          <div className="absolute inset-x-0 bottom-0 bg-white/95 p-3 text-left">
            <p className="text-[10px] font-bold tracking-[0.16em] text-myntra-pink">{open.label.toUpperCase()}</p>
            <p className="text-[12px] mt-1 leading-snug">{open.hint}</p>
            {open.quote && (
              <p className="text-[12px] text-myntra-muted mt-1 leading-snug">
                “{open.quote.slice(0, 140)}”
                {open.who ? ` — ${open.who}` : ""}
                {open.sizeBought ? ` · ${open.sizeBought}` : ""}
              </p>
            )}
          </div>
        )}
      </div>
      <div
        id={popoverId}
        popover="auto"
        className="fit-popover w-[min(280px,80vw)] bg-white text-myntra-dark p-3 text-left shadow-card"
      >
        {open ? (
          <>
            <p className="text-[10px] font-bold tracking-[0.16em] text-myntra-pink">{open.label.toUpperCase()}</p>
            <p className="text-[12px] mt-1 leading-snug">{open.hint}</p>
            {open.quote && (
              <p className="text-[12px] text-myntra-muted mt-1 leading-snug">
                “{open.quote.slice(0, 180)}”
                {open.who ? ` — ${open.who}` : ""}
                {open.sizeBought ? ` · ${open.sizeBought}` : ""}
              </p>
            )}
          </>
        ) : (
          <p className="text-[12px] text-myntra-muted">Tap a body zone to read the fit note.</p>
        )}
      </div>
      <div className="p-3 flex-1">
        <p className="font-bold text-sm">{product.brand}</p>
        <p className="text-[12px] text-myntra-muted truncate">{product.name}</p>
        <p className="text-[12px] mt-1">{formatInr(product.price)}</p>
        <p className="text-[11px] text-myntra-muted mt-1">{fitClarity(product).reason}</p>
      </div>
      {onKeep && (
        <button
          type="button"
          className={`mx-3 mb-3 bg-myntra-pink text-white font-bold py-2.5 text-[12px] tracking-wide ${
            emphasizeKeep ? "ring-2 ring-offset-2 ring-myntra-pink animate-pulse" : ""
          }`}
          onClick={onKeep}
        >
          {keepLabel}
        </button>
      )}
    </article>
  );
}
