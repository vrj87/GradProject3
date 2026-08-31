import type { Gender } from "../data/products";
import { ZONE_SPOT, type PinZone } from "../lib/fittingRoom";

export function DoubtBody({
  zones,
  zone,
  onZone,
  gender
}: {
  zones: PinZone[];
  zone: PinZone | null;
  onZone: (next: PinZone) => void;
  gender: Gender;
}) {
  const figure = gender === "kids" ? "kids" : gender === "men" ? "men" : "women";

  return (
    <div className="relative mx-auto w-[132px] md:w-[148px] select-none">
      <p className="text-[10px] font-bold tracking-[0.18em] text-myntra-pink text-center mb-2">
        NAME THE DOUBT
      </p>
      <div className="relative aspect-[3/5]">
        <svg viewBox="0 0 80 140" className="absolute inset-0 h-full w-full" aria-hidden>
          <ellipse cx="40" cy="18" rx="10" ry="12" className="fill-white/15" />
          <path
            d={
              figure === "men"
                ? "M28 32 L52 32 L58 72 L54 72 L52 138 L44 138 L42 78 L38 78 L36 138 L28 138 L26 72 L22 72 Z"
                : figure === "kids"
                  ? "M30 32 L50 32 L54 68 L50 68 L49 132 L43 132 L41 74 L39 74 L37 132 L31 132 L30 68 L26 68 Z"
                  : "M30 32 L50 32 L56 70 L52 70 L54 138 L46 138 L42 76 L38 76 L34 138 L26 138 L28 70 L24 70 Z"
            }
            className="fill-white/12 stroke-white/35"
            strokeWidth="1.2"
          />
        </svg>
        {zones.map((id) => {
          const spot = ZONE_SPOT[id];
          const on = zone === id;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={on}
              aria-label={`Doubt: ${spot.label}`}
              onClick={() => onZone(id)}
              className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border text-[9px] font-bold min-w-9 min-h-9 px-1 doubt-hotspot ${
                on
                  ? "bg-myntra-pink text-white border-myntra-pink"
                  : "bg-white/95 text-myntra-pink border-myntra-pink"
              }`}
              style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
            >
              {spot.label.slice(0, 1)}
            </button>
          );
        })}
      </div>
      <div className="flex flex-col gap-1 mt-2">
        {zones.map((id) => (
          <button
            key={`${id}-label`}
            type="button"
            onClick={() => onZone(id)}
            className={`text-[11px] font-bold py-1 ${
              zone === id ? "text-myntra-pink" : "text-white/55"
            }`}
          >
            {ZONE_SPOT[id].label}
          </button>
        ))}
      </div>
    </div>
  );
}
