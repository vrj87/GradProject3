import { useEffect, useState, type ReactNode } from "react";
import type { Product } from "../data/products";
import { formatInr } from "../data/products";
import { coachBannerCopy, type CoachGenerationMeta, type CoachLlmStatus } from "../lib/coachLlm";
import { COACH_GENERATE_MS } from "../lib/coachTiming";
import {
  ROOM_COACH_TABS,
  type FitBand,
  type RoomCoachLook,
  type RoomCoachTab,
  type WorthVerdict
} from "../lib/roomCoach";

export { COACH_GENERATE_MS };

function coachSources(engineLabel: string) {
  return [
    {
      id: "lpu",
      label: engineLabel,
      detail: `${engineLabel} is rewriting the fit, wear, and worth read.`
    },
    {
      id: "scrape",
      label: "Scrape",
      detail: "Public reviews and shopper notes on this look."
    },
    {
      id: "research",
      label: "User research",
      detail: "Questionnaire responses from stalled shortlisters."
    }
  ] as const;
}

export function CoachGenerating({
  on,
  modelNote,
  engineLabel = "Groq LPU"
}: {
  on: string;
  modelNote?: string;
  engineLabel?: string;
}) {
  const sources = coachSources(engineLabel);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const tick = window.setInterval(
      () => setStep((current) => (current + 1) % sources.length),
      Math.max(900, Math.floor(COACH_GENERATE_MS / sources.length))
    );
    return () => window.clearInterval(tick);
  }, [sources.length]);

  const current = sources[step]!;

  return (
    <div className="py-6 px-1" role="status" aria-live="polite">
      <p className="text-[11px] font-bold tracking-[0.18em] text-myntra-pink">GENERATING INSIGHTS</p>
      <p className="font-bold text-lg mt-2">
        Reading {on} from {engineLabel}, scrape, and user research…
      </p>
      <p className="text-[13px] text-myntra-muted mt-1">
        Will it fit · Where I&apos;d wear it · Is it worth it
      </p>

      <div
        className="mt-4 h-1 bg-myntra-border overflow-hidden"
        aria-hidden
      >
        <div
          className="h-full bg-myntra-pink"
          style={{
            animation: `coach-generate-bar ${COACH_GENERATE_MS}ms linear forwards`
          }}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
        {sources.map((source, index) => {
          const active = index === step;
          return (
            <div
              key={source.id}
              className={`border p-3 ${
                active
                  ? "border-myntra-pink bg-[#fff4f6]"
                  : "border-myntra-border bg-white"
              }`}
            >
              <p
                className={`text-[11px] font-bold tracking-[0.16em] ${
                  active ? "text-myntra-pink" : "text-myntra-muted"
                }`}
              >
                {source.label.toUpperCase()}
              </p>
              <p className={`text-[13px] mt-1 ${active ? "text-myntra-dark" : "text-myntra-muted"}`}>
                {source.id === "lpu" && modelNote ? modelNote : source.detail}
              </p>
            </div>
          );
        })}
      </div>
      <p className="text-[12px] font-bold text-myntra-pink mt-3">Now: {current.label}</p>
    </div>
  );
}

export function CoachProviderBanner({
  generating,
  meta,
  status,
  error
}: {
  generating: boolean;
  meta?: CoachGenerationMeta | null;
  status?: CoachLlmStatus | null;
  error?: string | null;
}) {
  const copy = coachBannerCopy({
    generating,
    provider: meta?.provider ?? status?.provider,
    model: meta?.model ?? status?.model
  });
  return (
    <div
      id="coach-model"
      className="mt-4 border-2 border-myntra-pink bg-[#fff4f6] p-3"
      role="status"
      aria-live="polite"
    >
      <p className="text-[11px] font-bold tracking-[0.18em] text-myntra-pink">{copy.kicker}</p>
      <p className="font-bold text-[16px] mt-1 text-myntra-dark">{copy.title}</p>
      {error ? (
        <p className="text-[13px] text-myntra-muted mt-1">{error} Showing the grounded local read.</p>
      ) : (
        <p className="text-[13px] text-myntra-muted mt-1">
          {generating
            ? "The key stays on the server. Groq LPU is rewriting the fit, wear, and worth read."
            : "Groq LPU rewrote the grounded fit, wear, and worth read. Numbers and sizes were not invented."}
        </p>
      )}
    </div>
  );
}

export function CoachQuestion({
  id,
  title,
  children
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28 mt-5 border-t border-myntra-border pt-4">
      <h4 className="font-bold text-base">{title}</h4>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export const BAND_CHIP: Record<FitBand, string> = {
  high: "bg-[#e5f8ed] text-[#03a685]",
  moderate: "bg-[#fff6e5] text-[#d67b00]",
  low: "bg-[#fce8ec] text-myntra-pink"
};

export const WORTH_CHIP: Record<WorthVerdict, string> = {
  "worth-it-now": "bg-[#e5f8ed] text-[#03a685]",
  "worth-it-if": "bg-[#fff6e5] text-[#d67b00]",
  hold: "bg-[#fce8ec] text-myntra-pink"
};

export const WORTH_LABEL: Record<WorthVerdict, string> = {
  "worth-it-now": "Worth it now",
  "worth-it-if": "Worth it, with a condition",
  hold: "Hold"
};

export function CoachTabNav({
  tab,
  onTab
}: {
  tab: RoomCoachTab;
  onTab: (next: RoomCoachTab) => void;
}) {
  return (
    <nav className="mt-4 flex flex-wrap gap-2" aria-label="Coach questions">
      {ROOM_COACH_TABS.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => {
            onTab(item.id);
            document.getElementById(`coach-${item.id}`)?.scrollIntoView({
              behavior: "smooth",
              block: "start"
            });
          }}
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
  );
}

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

export function FitColumn({ look, product }: { look: RoomCoachLook; product: Product }) {
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
      <p className="text-[11px] text-myntra-muted mt-3">
        {product.fit} · {product.material}
      </p>
    </div>
  );
}

export function WearColumn({ look }: { look: RoomCoachLook }) {
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

export function WorthColumn({
  look,
  peerHeading = "AGAINST THE OTHER HANGER"
}: {
  look: RoomCoachLook;
  peerHeading?: string;
}) {
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
      <p className="text-[11px] font-bold tracking-[0.14em] text-myntra-muted mt-4">{peerHeading}</p>
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

export function WorthEstimateForm({
  value,
  error,
  hint,
  onChange,
  onSubmit
}: {
  value: string;
  error: string | null;
  hint: string;
  onChange: (next: string) => void;
  onSubmit: () => void;
}) {
  return (
    <form
      className="mt-5 border border-myntra-border p-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <p className="text-[11px] font-bold tracking-[0.14em] text-myntra-muted">YOUR OWN ESTIMATE</p>
      <p className="text-[13px] text-myntra-muted mt-1">{hint}</p>
      <div className="flex flex-wrap items-center gap-2 mt-2">
        <input
          type="number"
          min={0}
          max={31}
          step="any"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          inputMode="decimal"
          placeholder="Wears per month"
          className="w-40 border border-myntra-border px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={value.trim() === ""}
          className="bg-myntra-pink text-white font-bold px-4 py-2 text-[12px] disabled:opacity-40"
        >
          Recalculate
        </button>
      </div>
      {error && <p className="text-[12px] text-myntra-pink mt-2">{error}</p>}
    </form>
  );
}
