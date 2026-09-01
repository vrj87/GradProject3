"use client";

import { useEffect, useState } from "react";
import { inr } from "@/lib/format";
import { ProductImage } from "./ProductImage";
import type { AnalyzeResponse, ValueResponse, WishlistEntry } from "./types";

type Tab = "fit" | "style" | "value";

const BAND_STYLE: Record<string, string> = {
  high: "bg-[color-mix(in_srgb,var(--color-good)_12%,white)] text-[var(--color-good)]",
  moderate: "bg-[color-mix(in_srgb,var(--color-warn)_12%,white)] text-[var(--color-warn)]",
  low: "bg-[color-mix(in_srgb,var(--color-stop)_10%,white)] text-[var(--color-stop)]"
};

const VERDICT_STYLE: Record<string, string> = {
  "worth-it-now": BAND_STYLE.high!,
  "worth-it-if": BAND_STYLE.moderate!,
  hold: BAND_STYLE.low!
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h4 className="label">{title}</h4>
      {children}
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  if (items.length === 0) return <p className="text-sm text-[var(--color-muted)]">Nothing recorded.</p>;
  return (
    <ul className="space-y-1.5 text-sm leading-relaxed">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--color-muted)]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function CoachPanel({
  userId,
  entry,
  onClose,
  onResolved,
  onDecision
}: {
  userId: string;
  entry: WishlistEntry;
  onClose: () => void;
  onResolved: () => void;
  onDecision: (kind: "bag" | "drop") => void;
}) {
  const [tab, setTab] = useState<Tab>("fit");
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [value, setValue] = useState<ValueResponse | null>(null);
  const [occasions, setOccasions] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setBusy(true);
    setError(null);

    (async () => {
      await fetch("/api/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId, wishlistItemId: entry.id, type: "coach_opened" })
      });

      const response = await fetch("/api/coach/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userId,
          productId: entry.productId,
          wishlistItemId: entry.id,
          type: "both"
        })
      });
      const body = await response.json();
      if (cancelled) return;
      if (!response.ok) setError(body.error ?? "Coach unavailable.");
      else setAnalysis(body);
      setBusy(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, entry.id, entry.productId]);

  async function loadValue(occasionsPerMonth?: number) {
    setBusy(true);
    setError(null);
    const response = await fetch("/api/coach/value", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        userId,
        productId: entry.productId,
        wishlistItemId: entry.id,
        occasionsPerMonth
      })
    });
    const body = await response.json();
    if (!response.ok) setError(body.error ?? "Value read unavailable.");
    else setValue(body);
    setBusy(false);
  }

  function selectTab(next: Tab) {
    setTab(next);
    if (next === "value" && !value) void loadValue();
  }

  async function markResolved() {
    await fetch("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        userId,
        wishlistItemId: entry.id,
        type: "uncertainty_resolved",
        meta: { via: tab }
      })
    });
    setResolved(true);
    onResolved();
  }

  const fit = analysis?.fit;
  const style = analysis?.style;
  const provider = value?.meta.provider ?? analysis?.meta.provider;

  return (
    <aside className="fixed inset-y-0 right-0 z-40 flex w-full max-w-xl flex-col border-l border-[var(--color-line)] bg-white shadow-2xl">
      <header className="flex items-start gap-3 border-b border-[var(--color-line)] px-6 py-4">
        <ProductImage
          src={entry.product.imageUrl}
          alt={`${entry.product.brand} ${entry.product.name}`}
          className="h-12 w-9 shrink-0 rounded-md"
        />
        <div className="min-w-0">
          <p className="label">{entry.product.brand}</p>
          <h3 className="truncate text-base font-bold">{entry.product.name}</h3>
          <p className="text-sm text-[var(--color-muted)]">
            {inr(entry.product.priceInr)} · {entry.product.reviews.length} reviews
          </p>
        </div>
        <button onClick={onClose} className="btn-ghost ml-auto px-3 py-1.5" aria-label="Close coach">
          Close
        </button>
      </header>

      <nav className="flex gap-1 border-b border-[var(--color-line)] px-4 py-2">
        {(
          [
            ["fit", "Will it fit"],
            ["style", "Where I'd wear it"],
            ["value", "Is it worth it"]
          ] as Array<[Tab, string]>
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => selectTab(key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
              tab === key
                ? "bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                : "text-[var(--color-muted)] hover:bg-[var(--color-canvas)]"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
        {error && (
          <p className="rounded-xl bg-[color-mix(in_srgb,var(--color-stop)_8%,white)] p-3 text-sm text-[var(--color-stop)]">
            {error}
          </p>
        )}
        {busy && !error && <p className="text-sm text-[var(--color-muted)]">Reading the reviews…</p>}

        {tab === "fit" && fit && (
          <>
            <div className={`chip ${BAND_STYLE[fit.confidenceBand]}`}>
              {fit.confidenceBand} confidence
            </div>
            <p className="text-lg font-semibold leading-snug">{fit.sizePattern}</p>
            <Section title="What the reviews say">
              <Bullets items={fit.keySignals} />
            </Section>
            <Section title="Body type notes">
              <Bullets items={fit.bodyTypeNotes} />
            </Section>
            <Section title="Return risk">
              <Bullets items={fit.returnRiskFlags} />
            </Section>
            <p className="text-xs italic text-[var(--color-muted)]">{fit.disclaimer}</p>
            <p className="text-xs text-[var(--color-muted)]">
              Evidence: {fit.evidenceReviewIds.join(", ") || "none"}
            </p>
          </>
        )}

        {tab === "style" && style && (
          <>
            <Section title="Occasions reviewers named">
              <ul className="space-y-2 text-sm">
                {style.occasionFit.map((entryFit) => (
                  <li key={entryFit.occasion} className="card p-3">
                    <p className="font-semibold capitalize">{entryFit.occasion}</p>
                    <p className="text-[var(--color-muted)]">{entryFit.verdict}</p>
                  </li>
                ))}
              </ul>
            </Section>
            <Section title="Pairings mentioned">
              <Bullets items={style.pairingSuggestions} />
            </Section>
            <Section title="Watch out for">
              <Bullets items={style.cautionNotes} />
            </Section>
            <p className="text-xs text-[var(--color-muted)]">
              Evidence: {style.evidenceReviewIds.join(", ") || "none"}
            </p>
          </>
        )}

        {tab === "value" && value && (
          <>
            <div className={`chip ${VERDICT_STYLE[value.value.verdict]}`}>{value.value.verdict}</div>
            <p className="text-lg font-semibold leading-snug">{value.value.headline}</p>

            <div className="grid grid-cols-3 gap-3">
              <div className="card p-3">
                <p className="label">Price</p>
                <p className="text-lg font-bold">{inr(value.value.priceInr)}</p>
              </div>
              <div className="card p-3">
                <p className="label">Per wear</p>
                <p className="text-lg font-bold">{inr(value.value.costPerWearInr)}</p>
              </div>
              <div className="card p-3">
                <p className="label">Wears assumed</p>
                <p className="text-lg font-bold">{value.value.wearsAssumed}</p>
              </div>
            </div>

            <p className="text-sm text-[var(--color-muted)]">Based on {value.value.wearBasis}.</p>

            <Section title="How it sits against your other saves">
              <p className="text-sm">{value.value.peerContext.note}</p>
            </Section>
            <Section title="Quality signals">
              <Bullets items={value.value.qualitySignals} />
            </Section>
            <Section title="What would change this">
              <Bullets items={value.value.whatWouldChangeIt} />
            </Section>

            <div className="card space-y-2 p-3">
              <p className="label">Your own estimate</p>
              <div className="flex items-center gap-2">
                <input
                  value={occasions}
                  onChange={(event) => setOccasions(event.target.value)}
                  inputMode="decimal"
                  placeholder="Wears per month"
                  className="w-40 rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-sm"
                />
                <button
                  className="btn-ghost"
                  disabled={busy || occasions.trim() === ""}
                  onClick={() => void loadValue(Number(occasions))}
                >
                  Recalculate
                </button>
              </div>
            </div>

            <p className="text-xs italic text-[var(--color-muted)]">{value.value.disclaimer}</p>
          </>
        )}
      </div>

      <footer className="space-y-3 border-t border-[var(--color-line)] px-6 py-4">
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary" onClick={() => onDecision("bag")}>
            Move to bag
          </button>
          <button className="btn-ghost" onClick={() => onDecision("drop")}>
            Decided against it
          </button>
          <button className="btn-ghost" onClick={() => void markResolved()} disabled={resolved}>
            {resolved ? "Marked resolved" : "My doubt is answered"}
          </button>
        </div>
        <p className="text-xs text-[var(--color-muted)]">
          Dropping an item counts as a completed decision, not a lost sale.
          {provider ? ` Generated by the ${provider} tier.` : ""}
        </p>
      </footer>
    </aside>
  );
}
