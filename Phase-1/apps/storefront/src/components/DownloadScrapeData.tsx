import { useState } from "react";
import {
  downloadJson,
  downloadText,
  scrapeDownloadUrl,
  voicesToCsv
} from "../lib/exportDiscovery";
import { loadDiscovery, type DiscoveryPayload } from "../lib/fetchDiscovery";

export function DownloadScrapeData() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function exportFromApi(
    label: string,
    filename: string,
    build: (payload: DiscoveryPayload) => string | unknown,
    mime: string
  ) {
    setBusy(true);
    setError("");
    try {
      const payload = await loadDiscovery();
      if (!payload) throw new Error("Scrape data is not available right now.");
      const output = build(payload);
      if (typeof output === "string") {
        downloadText(output, filename, mime);
      } else {
        downloadJson(output, filename);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Could not download ${label}.`);
    } finally {
      setBusy(false);
      setOpen(false);
    }
  }

  return (
    <div className="relative mt-5">
      <button
        type="button"
        disabled={busy}
        onClick={() => setOpen((value) => !value)}
        className="text-[12px] font-bold px-4 py-2 border border-white/30 text-white hover:border-myntra-pink hover:text-myntra-pink disabled:opacity-50"
      >
        {busy ? "Preparing download…" : "Download scrape data ↓"}
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-2 z-20 min-w-[240px] bg-white border border-myntra-border shadow-lg text-myntra-dark">
          <a
            href={scrapeDownloadUrl("raw")}
            download="raw-reviews.json"
            onClick={() => setOpen(false)}
            className="block px-4 py-3 text-[13px] hover:bg-myntra-bg border-b border-myntra-border"
          >
            <span className="font-bold">Raw scrape</span>
            <span className="block text-[11px] text-myntra-muted mt-0.5">
              All collected reviews (JSON)
            </span>
          </a>
          <a
            href={scrapeDownloadUrl("normalized")}
            download="normalized-reviews.json"
            onClick={() => setOpen(false)}
            className="block px-4 py-3 text-[13px] hover:bg-myntra-bg border-b border-myntra-border"
          >
            <span className="font-bold">Processed reviews</span>
            <span className="block text-[11px] text-myntra-muted mt-0.5">
              Filtered and deduped (JSON)
            </span>
          </a>
          <button
            type="button"
            onClick={() =>
              exportFromApi(
                "voices CSV",
                "wishlist-voices.csv",
                (payload) => voicesToCsv(payload.voices),
                "text/csv"
              )
            }
            className="block w-full text-left px-4 py-3 text-[13px] hover:bg-myntra-bg border-b border-myntra-border"
          >
            <span className="font-bold">Wishlist voices</span>
            <span className="block text-[11px] text-myntra-muted mt-0.5">
              Fit-relevant quotes (CSV)
            </span>
          </button>
          <button
            type="button"
            onClick={() =>
              exportFromApi("full collection", "discovery-collection.json", (payload) => payload, "application/json")
            }
            className="block w-full text-left px-4 py-3 text-[13px] hover:bg-myntra-bg"
          >
            <span className="font-bold">Full collection</span>
            <span className="block text-[11px] text-myntra-muted mt-0.5">
              Stats, voices, themes, ranking (JSON)
            </span>
          </button>
        </div>
      )}
      {error && <p className="text-[12px] text-myntra-pink mt-2">{error}</p>}
    </div>
  );
}
