import { useEffect, useState } from "react";
import {
  friendlySource,
  friendlySourceBlurb,
  friendlyWhen
} from "../lib/friendlyLabels";
import { publicReviewUrl, reviewLinkLabel, storeListingUrl } from "../lib/sourceUrls";

interface Voice {
  id: string;
  text: string;
  source: string;
  rating: number | null;
  gatheredAt: string;
  url: string;
}

interface Stats {
  rawCount: number;
  normalizedCount: number;
  droppedMinWords: number;
  droppedIrrelevant: number;
  droppedDuplicates: number;
  validatedThemeCount: number;
  sourceCoverage: Record<string, number>;
  generatedAt: string;
}

interface Payload {
  stats: Stats;
  voices: Voice[];
}

const SOURCE_ORDER = ["play_store", "app_store", "reddit"];
const VOICE_FILTERS = ["all", "play_store", "app_store"] as const;
type VoiceFilter = (typeof VOICE_FILTERS)[number];

const SOURCE_RANK: Record<string, number> = {
  play_store: 0,
  app_store: 1,
  reddit: 2
};

const STEPS = [
  {
    n: "01",
    title: "Collect live reviews",
    text: "We pull the latest public Myntra reviews from the App Store and Play Store, and listen for community threads."
  },
  {
    n: "02",
    title: "Keep the useful ones",
    text: "Short notes and off-topic praise are set aside. We keep comments about saving, fit, size, returns, and comparing looks."
  },
  {
    n: "03",
    title: "Find the repeating worry",
    text: "Similar comments are grouped so you can see why saved items wait — without a coupon in the way."
  }
];

export function LiveListenPanel() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState("");
  const [voiceFilter, setVoiceFilter] = useState<VoiceFilter>("all");

  useEffect(() => {
    fetch("/api/discovery")
      .then((res) => {
        if (!res.ok) throw new Error("Live reviews are not available right now.");
        return res.json();
      })
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, []);

  const stats = data?.stats;
  const coverage = stats?.sourceCoverage ?? {};
  const when = stats?.generatedAt ? friendlyWhen(stats.generatedAt) : "";
  const voices = [...(data?.voices ?? [])].sort(
    (a, b) => (SOURCE_RANK[a.source] ?? 9) - (SOURCE_RANK[b.source] ?? 9)
  );
  const voiceCounts = voices.reduce<Record<string, number>>((acc, voice) => {
    acc[voice.source] = (acc[voice.source] ?? 0) + 1;
    return acc;
  }, {});
  const visibleVoices =
    voiceFilter === "all" ? voices : voices.filter((voice) => voice.source === voiceFilter);

  return (
    <div className="bg-myntra-bg min-h-[60vh]">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">How we listen to shoppers</h2>
          <p className="text-myntra-muted mt-2 text-sm max-w-2xl">
            Fit Insight is not a made-up list. It starts with public reviews we collect live, then
            keeps only the comments that explain why a saved item still sits in the wishlist.
          </p>
          {when && (
            <p className="text-[12px] text-myntra-muted mt-2">Last collected {when}</p>
          )}
        </div>

        {error && <p className="text-myntra-pink">{error}</p>}

        <div className="grid sm:grid-cols-3 gap-3">
          {SOURCE_ORDER.map((source) => {
            const count = coverage[source] ?? 0;
            return (
              <article key={source} className="bg-white border border-myntra-border p-4">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-bold">{friendlySource(source)}</h3>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 ${
                      count > 0 ? "bg-[#e5f4ea] text-myntra-green" : "bg-myntra-bg text-myntra-muted"
                    }`}
                  >
                    {count > 0 ? "LIVE" : "NONE THIS RUN"}
                  </span>
                </div>
                <p className="text-[28px] font-bold mt-2 leading-none">{count}</p>
                <p className="text-[12px] text-myntra-muted mt-2">{friendlySourceBlurb(source)}</p>
                <a
                  href={storeListingUrl(source)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block mt-3 text-[12px] font-bold text-myntra-pink"
                >
                  Open {friendlySource(source)} →
                </a>
              </article>
            );
          })}
        </div>

        {stats && (
          <section className="bg-white border border-myntra-border p-5">
            <h3 className="font-bold">From a pile of reviews to a clear pattern</h3>
            <p className="text-[13px] text-myntra-muted mt-1">
              Every number below is from the latest live collection — nothing is typed in by hand.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
              <Funnel n={stats.rawCount} label="Reviews collected" />
              <Funnel n={stats.droppedMinWords} label="Too short to use" mute />
              <Funnel n={stats.droppedIrrelevant} label="Not about saving or fit" mute />
              <Funnel n={stats.normalizedCount} label="Kept for Fit Insight" />
              <Funnel n={stats.validatedThemeCount} label="Clear patterns" />
            </div>
            {stats.droppedDuplicates > 0 && (
              <p className="text-[12px] text-myntra-muted mt-3">
                {stats.droppedDuplicates} repeat comments were removed.
              </p>
            )}
          </section>
        )}

        <section className="grid md:grid-cols-3 gap-3">
          {STEPS.map((step) => (
            <article key={step.n} className="bg-white border border-myntra-border p-4">
              <div className="text-[11px] font-bold tracking-[0.18em] text-myntra-pink">{step.n}</div>
              <h3 className="font-bold mt-2">{step.title}</h3>
              <p className="text-[13px] text-myntra-muted mt-1 leading-relaxed">{step.text}</p>
            </article>
          ))}
        </section>

        {voices.length ? (
          <section>
            <div className="flex flex-wrap justify-between items-end gap-3 mb-3">
              <div>
                <h3 className="font-bold">Voices from this collection</h3>
                <p className="text-[13px] text-myntra-muted mt-0.5">
                  Real lines about fit, size, returns, and saving — not sale talk.
                </p>
              </div>
              <div className="flex flex-wrap gap-2" role="tablist" aria-label="Choose a store">
                {VOICE_FILTERS.map((filter) => {
                  const count =
                    filter === "all" ? voices.length : voiceCounts[filter] ?? 0;
                  const active = voiceFilter === filter;
                  return (
                    <button
                      key={filter}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setVoiceFilter(filter)}
                      className={`text-[12px] font-bold px-3 py-1.5 border ${
                        active
                          ? "bg-myntra-dark text-white border-myntra-dark"
                          : "bg-white text-myntra-dark border-myntra-border hover:border-myntra-dark"
                      }`}
                    >
                      {filter === "all" ? "All stores" : friendlySource(filter)} · {count}
                    </button>
                  );
                })}
              </div>
            </div>
            {visibleVoices.length ? (
              <div className="grid md:grid-cols-2 gap-3">
                {visibleVoices.map((voice) => (
                  <article key={voice.id} className="bg-white border border-myntra-border p-4">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                      <span className="text-myntra-pink">{friendlySource(voice.source)}</span>
                      {voice.rating != null && (
                        <span className="text-myntra-green">★ {voice.rating}</span>
                      )}
                      <span className="text-myntra-muted font-normal">
                        {friendlyWhen(voice.gatheredAt)}
                      </span>
                    </div>
                    <p className="text-sm mt-2 leading-relaxed">“{voice.text}”</p>
                    <a
                      href={publicReviewUrl({
                        source: voice.source,
                        url: voice.url,
                        reviewId: voice.id
                      })}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block mt-3 text-[12px] font-bold text-myntra-pink"
                    >
                      {reviewLinkLabel(voice.source)} →
                    </a>
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-sm text-myntra-muted bg-white border border-myntra-border p-4">
                No voices from {friendlySource(voiceFilter)} in this collection.
              </p>
            )}
          </section>
        ) : null}
      </div>
    </div>
  );
}

function Funnel({ n, label, mute }: { n: number; label: string; mute?: boolean }) {
  return (
    <div className={mute ? "bg-myntra-bg p-3" : "bg-[#fff4f6] p-3"}>
      <div className={`text-xl font-bold ${mute ? "text-myntra-muted" : "text-myntra-pink"}`}>{n}</div>
      <div className="text-[11px] text-myntra-muted mt-1 leading-snug">{label}</div>
    </div>
  );
}
