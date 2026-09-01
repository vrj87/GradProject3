"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { daysSince, inr } from "@/lib/format";
import { notifyStorefrontBag, storefrontBagHref } from "@/lib/storefrontBag";
import { CoachPanel } from "./CoachPanel";
import { CompareTable } from "./CompareTable";
import { ProductImage } from "./ProductImage";
import type { CompareResponse, WishlistEntry, WishlistResponse } from "./types";

const TRIGGER_COPY: Record<string, string> = {
  entry: "Day 0",
  "fit-highlight": "Day 3 · fit",
  compare: "Day 7 · compare",
  "decision-prompt": "Day 14 · decide"
};

export function ShortlistRoom({
  personas,
  initialUserId
}: {
  personas: Array<{ id: string; name: string; segmentTags: string }>;
  initialUserId: string;
}) {
  const [userId, setUserId] = useState(initialUserId);
  const [data, setData] = useState<WishlistResponse | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [openItemId, setOpenItemId] = useState<string | null>(null);
  const [compare, setCompare] = useState<CompareResponse | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [bagHref, setBagHref] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState("");

  const load = useCallback(async () => {
    const response = await fetch(`/api/wishlist?userId=${userId}`);
    const body = await response.json();
    if (response.ok) {
      setData(body);
      setSelected([]);
      setOpenItemId(null);
      setCompare(null);
    } else {
      setStatus(body.error ?? "Could not load the shortlist.");
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const entries = data?.items ?? [];
  const openItems = entries.filter((entry) => entry.status !== "cart_added" && entry.status !== "purchased");
  const baggedItems = entries.filter((entry) => entry.status === "cart_added");
  const openEntry = entries.find((entry) => entry.id === openItemId) ?? null;
  const selectedEntries = useMemo(
    () => entries.filter((entry) => selected.includes(entry.id)),
    [entries, selected]
  );
  const selectionCategory = selectedEntries[0]?.category ?? null;

  function toggle(entry: WishlistEntry) {
    setSelected((current) => {
      if (current.includes(entry.id)) return current.filter((id) => id !== entry.id);
      if (current.length >= 3) return current;
      return [...current, entry.id];
    });
  }

  async function runCompare() {
    if (!data) return;
    setBusy(true);
    setStatus(null);
    const response = await fetch("/api/coach/compare", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId, itemIds: selectedEntries.map((entry) => entry.productId) })
    });
    const body = await response.json();
    if (response.ok) setCompare(body);
    else setStatus(body.error ?? "Compare failed.");
    setBusy(false);
  }

  async function moveToBag(entry: WishlistEntry) {
    const response = await fetch("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        userId,
        wishlistItemId: entry.id,
        type: "cart_add_simulated",
        meta: { simulated: true }
      })
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setStatus(body.error ?? "Could not move that look to the bag.");
      return;
    }
    notifyStorefrontBag(entry.product);
    const embedded = typeof window !== "undefined" && window.parent !== window;
    setBagHref(storefrontBagHref(entry.product, !embedded));
    setStatus(`${entry.product.name} is in your bag.`);
    setOpenItemId(null);
    setCompare(null);
    await load();
  }

  async function drop(entry: WishlistEntry) {
    await fetch(`/api/wishlist/${entry.id}`, { method: "DELETE" });
    setStatus(`${entry.product.name} dropped. That counts as a completed decision.`);
    setOpenItemId(null);
    await load();
  }

  async function ingest() {
    if (!url.trim()) return;
    setBusy(true);
    setStatus(null);
    const response = await fetch("/api/products/ingest", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: url.trim() })
    });
    const body = await response.json();
    if (!response.ok) {
      setStatus(body.error ?? "Ingest failed.");
      setBusy(false);
      return;
    }
    await fetch("/api/wishlist", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId, productId: body.product.id })
    });
    setStatus(`${body.tier}: ${body.note}`);
    setUrl("");
    setBusy(false);
    await load();
  }

  function switchShopper(id: string) {
    setUserId(id);
    const next = new URLSearchParams(window.location.search);
    next.set("user", id);
    window.history.replaceState(null, "", `/mvp?${next.toString()}`);
  }

  return (
    <div className="space-y-6">
      <section>
        <p className="label">Demo shopper</p>
        <div className="mt-1 flex flex-wrap gap-2">
          {personas.map((persona) => (
            <button
              key={persona.id}
              onClick={() => switchShopper(persona.id)}
              className={persona.id === userId ? "btn-primary" : "btn-ghost"}
            >
              {persona.name}
              <span className="text-xs opacity-70">{persona.segmentTags}</span>
            </button>
          ))}
        </div>
      </section>

      {data && (
        <section
          className={`card space-y-3 p-4 ${
            data.eligibility.eligible
              ? "border-[color-mix(in_srgb,var(--color-good)_35%,white)] bg-[color-mix(in_srgb,var(--color-good)_6%,white)]"
              : "border-[color-mix(in_srgb,var(--color-warn)_35%,white)] bg-[color-mix(in_srgb,var(--color-warn)_6%,white)]"
          }`}
        >
          <div>
            <p className="label">
              {data.eligibility.eligible ? "Coach is on" : "Coach is withheld"} · {data.eligibility.code}
            </p>
            <p className="mt-1 text-sm">{data.eligibility.reason}</p>
          </div>
          {data.contract && (
            <table className="w-full text-sm">
              <tbody>
                {[
                  ["Opted out", String(data.contract.optedOut), "must be false"],
                  [
                    `Active saves in ${data.contract.thresholds.windowDays} days`,
                    String(data.contract.recentSaves),
                    `at least ${data.contract.thresholds.minRecentSaves}`
                  ],
                  [
                    "Purchases in window",
                    String(data.contract.purchasesInWindow),
                    `at most ${data.contract.thresholds.maxPurchasedInWindow}`
                  ],
                  [
                    "Largest same-category group",
                    data.contract.largestCategory
                      ? `${data.contract.largestCategoryCount} ${data.contract.largestCategory}`
                      : "0",
                    `at least ${data.contract.thresholds.minSameCategory}`
                  ],
                  [
                    "Comparable categories",
                    data.contract.comparableCategories.join(", ") || "none",
                    "at least one"
                  ]
                ].map(([label, value, rule]) => (
                  <tr key={label} className="border-t border-[var(--color-line)]">
                    <th className="py-1.5 text-left font-medium">{label}</th>
                    <td className="py-1.5 font-semibold">{value}</td>
                    <td className="py-1.5 text-right text-xs text-[var(--color-muted)]">{rule}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="text-xs text-[var(--color-muted)]">
            Thresholds come from the Phase 4 segment contract. Switch shopper above to see the gate
            fire without leaving this page.
          </p>
        </section>
      )}

      <section className="card space-y-2 p-4">
        <p className="label">Add from a Myntra product URL</p>
        <div className="flex flex-wrap gap-2">
          <input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://www.myntra.com/..."
            className="min-w-64 flex-1 rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm"
          />
          <button className="btn-ghost" disabled={busy} onClick={() => void ingest()}>
            Add to shortlist
          </button>
        </div>
        <p className="text-xs text-[var(--color-muted)]">
          Only myntra.com is allowed. If the page cannot be read, the closest demo SKU is
          substituted so the flow still works.
        </p>
      </section>

      {status && (
        <p className="rounded-xl bg-[var(--color-accent-soft)] px-4 py-3 text-sm">
          {status}{" "}
          {bagHref && (
            <a
              href={bagHref}
              target="_top"
              className="font-semibold text-[var(--color-accent)]"
            >
              Open bag →
            </a>
          )}
        </p>
      )}

      {baggedItems.length > 0 && (
        <section className="card space-y-3 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="label">In your bag</p>
            <a
              href={bagHref ?? storefrontBagHref(baggedItems[0]!.product)}
              target="_top"
              className="ml-auto text-sm font-semibold text-[var(--color-accent)]"
            >
              Open bag →
            </a>
          </div>
          <ul className="space-y-2">
            {baggedItems.map((entry) => (
              <li key={entry.id} className="flex items-center gap-3">
                <ProductImage
                  src={entry.product.imageUrl}
                  alt={`${entry.product.brand} ${entry.product.name}`}
                  className="h-12 w-9 shrink-0 rounded-md"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{entry.product.name}</p>
                  <p className="text-xs text-[var(--color-muted)]">
                    {entry.product.brand} · {inr(entry.product.priceInr)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {openItems.map((entry) => {
          const isSelected = selected.includes(entry.id);
          const blocked =
            !isSelected &&
            ((selectionCategory !== null && entry.category !== selectionCategory) ||
              selected.length >= 3);
          const age = daysSince(new Date(entry.addedAt));

          return (
            <article key={entry.id} className="card flex flex-col gap-3 p-4">
              <div className="flex items-start gap-3">
                <ProductImage
                  src={entry.product.imageUrl}
                  alt={`${entry.product.brand} ${entry.product.name}`}
                  className="h-[4.5rem] w-14 shrink-0 rounded-lg"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0">
                      <p className="label">{entry.product.brand}</p>
                      <h3 className="truncate font-semibold">{entry.product.name}</h3>
                    </div>
                    <span className="chip ml-auto bg-[var(--color-canvas)] text-[var(--color-muted)]">
                      {entry.category}
                    </span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-lg font-bold">{inr(entry.product.priceInr)}</span>
                    <span className="text-xs text-[var(--color-muted)]">
                      saved {age} day{age === 1 ? "" : "s"} ago · {entry.product.reviews.length} reviews
                    </span>
                  </div>
                </div>
              </div>

              {entry.trigger && !entry.trigger.suppressed && entry.trigger.kind && (
                <div className="rounded-xl bg-[var(--color-canvas)] p-3">
                  <p className="label">{TRIGGER_COPY[entry.trigger.kind]}</p>
                  <p className="mt-1 text-xs">{entry.trigger.message}</p>
                </div>
              )}
              {entry.trigger?.suppressed && entry.trigger.kind !== null && (
                <p className="text-xs italic text-[var(--color-muted)]">
                  Prompt held back: {entry.trigger.reason}
                </p>
              )}

              {entry.status === "cart_added" && (
                <p className="chip bg-[color-mix(in_srgb,var(--color-good)_12%,white)] text-[var(--color-good)]">
                  in bag
                </p>
              )}

              <div className="mt-auto flex flex-wrap gap-2">
                <button
                  className="btn-primary"
                  disabled={!data?.eligibility.eligible}
                  onClick={() => setOpenItemId(entry.id)}
                >
                  Ask the coach
                </button>
                <button
                  className={isSelected ? "btn-primary" : "btn-ghost"}
                  disabled={blocked || !data?.eligibility.eligible}
                  onClick={() => toggle(entry)}
                  title={
                    blocked
                      ? "Compare runs on two or three items from one category."
                      : "Add to the comparison"
                  }
                >
                  {isSelected ? "Selected" : "Compare"}
                </button>
              </div>
            </article>
          );
        })}
      </section>

      {openItems.length === 0 && data && (
        <p className="card p-6 text-center text-sm text-[var(--color-muted)]">
          {baggedItems.length > 0
            ? "Shortlist is clear. Those looks are in the bag."
            : "Nothing saved. Add a Myntra URL above, or run the seed again."}
        </p>
      )}

      {selected.length >= 2 && (
        <div className="sticky bottom-4 z-30 flex flex-wrap items-center gap-3 rounded-2xl bg-[var(--color-ink)] px-5 py-3 text-white shadow-xl">
          <span className="text-sm">
            {selected.length} {selectionCategory} items selected
          </span>
          <button
            className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[var(--color-ink)]"
            disabled={busy}
            onClick={() => void runCompare()}
          >
            {busy ? "Comparing…" : "Compare side by side"}
          </button>
          <button className="text-sm underline" onClick={() => setSelected([])}>
            Clear
          </button>
        </div>
      )}

      {openEntry && (
        <CoachPanel
          userId={userId}
          entry={openEntry}
          onClose={() => setOpenItemId(null)}
          onResolved={() => setStatus("Logged as an uncertainty resolved — that is the leading metric.")}
          onDecision={(kind) => void (kind === "bag" ? moveToBag(openEntry) : drop(openEntry))}
        />
      )}

      {compare && (
        <CompareTable
          matrix={compare.matrix}
          entries={entries}
          onClose={() => setCompare(null)}
          onPick={(entry) => void moveToBag(entry)}
        />
      )}
    </div>
  );
}
