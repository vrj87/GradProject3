import { useEffect, useState } from "react";

interface Theme {
  id: string;
  label: string;
  summary: string;
  barrierType: string;
  metricNode: string;
  estimatedFrequency: number;
  impactOnW2P: string;
  quotes: Array<{ text: string; source: string; reviewId: string }>;
}

interface RankRow {
  rank: number;
  label: string;
  metricNode: string;
  impactOnW2P: string;
  estimatedFrequency: number;
  score: number;
  priceFlag: boolean;
}

interface Payload {
  themes: Theme[];
  ranking: RankRow[];
  stats: {
    rawCount: number;
    normalizedCount: number;
    extractionMethod: string;
    readyForPhase2: boolean;
    sourceCoverage: Record<string, number>;
  };
}

export function InsightsPanel() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/discovery")
      .then((res) => {
        if (!res.ok) throw new Error("Run npm run discovery:refresh first.");
        return res.json();
      })
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <div className="bg-myntra-bg min-h-[60vh]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <p className="text-xs font-bold tracking-[0.2em] text-myntra-pink">LIVE SCRAPE</p>
        <h2 className="text-2xl font-bold mt-1">Why wishlists do not convert in 30 days</h2>
        <p className="text-myntra-muted mt-2 max-w-2xl text-sm">
          App Store and Play Store reviews, ranked as opportunity areas — not a sentiment summary.
        </p>
        {error && <p className="text-myntra-pink mt-4">{error}</p>}
        {data && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-8">
              <Stat label="Reviews scraped" value={String(data.stats.rawCount)} />
              <Stat label="Wishlist-relevant" value={String(data.stats.normalizedCount)} />
              <Stat label="Method" value={data.stats.extractionMethod} />
              <Stat
                label="Ready for interviews"
                value={data.stats.readyForPhase2 ? "Yes" : "Not yet"}
              />
            </div>
            <h3 className="font-bold mb-3">Ranked opportunities</h3>
            <div className="overflow-x-auto bg-white border border-myntra-border mb-10">
              <table className="w-full text-sm">
                <thead className="bg-myntra-bg text-left">
                  <tr>
                    <th className="p-3">#</th>
                    <th>Theme</th>
                    <th>Node</th>
                    <th>Impact</th>
                    <th>Freq</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {data.ranking.map((row) => (
                    <tr key={row.label} className="border-t border-myntra-border">
                      <td className="p-3 font-bold text-myntra-pink">{row.rank}</td>
                      <td>
                        {row.label}
                        {row.priceFlag ? " · price flag" : ""}
                      </td>
                      <td className="capitalize">{row.metricNode}</td>
                      <td>{row.impactOnW2P}</td>
                      <td>{row.estimatedFrequency}</td>
                      <td>{row.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h3 className="font-bold mb-3">Themes from live reviews</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {data.themes.map((theme) => (
                <article key={theme.id} className="bg-white border border-myntra-border p-4">
                  <div className="text-xs uppercase text-myntra-pink font-bold">
                    {theme.barrierType} · {theme.metricNode}
                  </div>
                  <h4 className="font-bold text-lg mt-1">{theme.label}</h4>
                  <p className="text-sm text-myntra-muted mt-1">{theme.summary}</p>
                  <ul className="mt-3 space-y-2 text-sm">
                    {theme.quotes.map((quote) => (
                      <li key={quote.reviewId} className="border-l-2 border-myntra-pink pl-3">
                        “{quote.text}”
                        <div className="text-xs text-myntra-muted mt-1">{quote.source}</div>
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
      <div className="font-bold text-lg capitalize">{value}</div>
    </div>
  );
}
