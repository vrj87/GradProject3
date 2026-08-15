import { useEffect, useState } from "react";
import {
  friendlyImpact,
  friendlyShare,
  friendlySource,
  friendlyTheme
} from "../lib/friendlyLabels";
import { publicReviewUrl, reviewLinkLabel } from "../lib/sourceUrls";

interface Theme {
  id: string;
  label: string;
  summary: string;
  quotes: Array<{ text: string; source: string; reviewId: string; url?: string }>;
}

interface RankRow {
  rank: number;
  label: string;
  impactOnW2P: string;
  estimatedFrequency: number;
}

interface Payload {
  themes: Theme[];
  ranking: RankRow[];
  stats: {
    rawCount: number;
    normalizedCount: number;
    extractionMethod?: string;
    readyForPhase2?: boolean;
    validatedThemeCount?: number;
    llmStats?: {
      batchesProcessed: number;
      batchesFailed: number;
      gapFillThemes: number;
    };
  };
}

export function InsightsPanel() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/discovery")
      .then((res) => {
        if (!res.ok) throw new Error("Shopper stories are not available right now.");
        return res.json();
      })
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <div className="bg-myntra-bg min-h-[60vh]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold">Why saved items stay in the wishlist</h2>
        <p className="text-myntra-muted mt-2 max-w-2xl text-sm">
          Patterns from the live collection — only comments about saving, fit, size, and returns.
        </p>
        {error && <p className="text-myntra-pink mt-4">{error}</p>}
        {data && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-8 max-w-3xl">
              <Stat label="Reviews we read" value={String(data.stats.rawCount)} />
              <Stat label="About wishlists" value={String(data.stats.normalizedCount)} />
              <Stat
                label="AI extraction"
                value={data.stats.extractionMethod ?? "—"}
              />
              <Stat
                label="Phase 2 ready"
                value={data.stats.readyForPhase2 ? "Yes" : "Not yet"}
              />
            </div>
            <h3 className="font-bold mb-3">What comes up most</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-10">
              {data.ranking.map((row) => (
                <article key={row.label} className="bg-white border border-myntra-border p-4">
                  <div className="text-xs font-bold text-myntra-pink">#{row.rank}</div>
                  <h4 className="font-bold text-lg mt-1">{friendlyTheme(row.label)}</h4>
                  <p className="text-sm text-myntra-muted mt-1">{friendlyImpact(row.impactOnW2P)}</p>
                  <p className="text-sm mt-2">{friendlyShare(row.estimatedFrequency)}</p>
                </article>
              ))}
            </div>
            <h3 className="font-bold mb-3">In their words</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {data.themes.map((theme) => (
                <article key={theme.id} className="bg-white border border-myntra-border p-4">
                  <h4 className="font-bold text-lg">{friendlyTheme(theme.label)}</h4>
                  <p className="text-sm text-myntra-muted mt-1">{theme.summary}</p>
                  <ul className="mt-3 space-y-2 text-sm">
                    {theme.quotes.map((quote) => (
                      <li key={quote.reviewId} className="border-l-2 border-myntra-pink pl-3">
                        “{quote.text}”
                        <div className="text-xs mt-1">
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
                        </div>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-myntra-border p-4">
      <div className="text-xs text-myntra-muted">{label}</div>
      <div className="font-bold text-lg">{value}</div>
    </div>
  );
}
