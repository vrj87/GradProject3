import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { friendlyImpact, friendlyShare, friendlySource, friendlyTheme } from "../lib/friendlyLabels";
import { publicReviewUrl, reviewLinkLabel, storeListingUrl } from "../lib/sourceUrls";
import { PRODUCTS } from "../data/products";
import { useStore } from "../store";

interface RankRow {
  rank: number;
  label: string;
  impactOnW2P: string;
  estimatedFrequency: number;
}

interface Theme {
  id: string;
  label: string;
  summary: string;
  quotes: Array<{ text: string; source: string; reviewId?: string; url?: string }>;
}

interface Payload {
  themes: Theme[];
  ranking: RankRow[];
  stats?: {
    rawCount: number;
    normalizedCount: number;
    validatedThemeCount: number;
    sourceCoverage: Record<string, number>;
  };
}

const THEME_LINKS: Record<string, string> = {
  FitSizeAnxiety: "/shop/women?cat=ethnic",
  ReturnFearDelay: "/shop/women?cat=western"
};

const FALLBACK: Payload = {
  themes: [
    {
      id: "fit",
      label: "FitSizeAnxiety",
      summary: "Shoppers save festive sets, then wait because bust, length, or size still feels uncertain.",
      quotes: [{ text: "Print is lovely. I usually wear M but the bust felt snug — thinking of exchanging for L.", source: "review" }]
    },
    {
      id: "return",
      label: "ReturnFearDelay",
      summary: "People hesitate when they think they will need to send a piece back after trying it at home.",
      quotes: [{ text: "Easy returns, so I may order two sizes and send one back.", source: "review" }]
    }
  ],
  ranking: [
    { rank: 1, label: "FitSizeAnxiety", impactOnW2P: "high", estimatedFrequency: 0.42 },
    { rank: 2, label: "ReturnFearDelay", impactOnW2P: "medium", estimatedFrequency: 0.28 }
  ]
};

const STEPS = [
  { n: "01", title: "Collect live reviews", text: "Pull the latest public notes from the App Store and Play Store." },
  { n: "02", title: "Keep fit and save talk", text: "Drop short or off-topic comments. Keep size, returns, and shortlists." },
  { n: "03", title: "Show the pattern", text: "Group the repeating worry so you can pick one look and move it to bag." }
];

export function HomeFitInsight() {
  const [data, setData] = useState<Payload>(FALLBACK);
  const { wishlist } = useStore();
  const saved = PRODUCTS.filter((item) => wishlist.includes(item.id)).slice(0, 3);

  useEffect(() => {
    fetch("/api/discovery")
      .then((res) => (res.ok ? res.json() : null))
      .then((payload: Payload | null) => {
        if (payload?.ranking?.length || payload?.stats) setData({ ...FALLBACK, ...payload });
      })
      .catch(() => undefined);
  }, []);

  return (
    <section className="relative overflow-hidden bg-[#1a0a10] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#ff3f6c55,transparent_42%)]" />
      <div className="relative max-w-[1200px] mx-auto px-4 py-10 md:py-14">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <p className="text-[11px] font-bold tracking-[0.28em] text-myntra-pink">MYNTRA STUDIO</p>
          <span className="bg-myntra-pink text-white text-[9px] font-bold px-1.5 py-0.5 tracking-wide">
            ONLY HERE
          </span>
        </div>

        <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-8 items-end">
          <div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
              Live shopper voices
            </h2>
            <p className="mt-3 text-white/80 text-sm md:text-base max-w-xl">
              We collect public store reviews as they come in, keep comments about saving and fit,
              and turn them into Fit Insight — so you can decide, not wait for a sale.
            </p>
            {data.stats && (
              <div className="flex flex-wrap gap-2 mt-4 text-[11px] font-bold">
                <span className="bg-white/10 px-2 py-1">{data.stats.rawCount} reviews collected</span>
                <span className="bg-white/10 px-2 py-1">{data.stats.normalizedCount} about wishlists</span>
                {Object.entries(data.stats.sourceCoverage).map(([source, count]) => (
                  <a
                    key={source}
                    href={storeListingUrl(source)}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-white/10 px-2 py-1 hover:bg-white/20"
                  >
                    {friendlySource(source)} · {count}
                  </a>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-3 mt-6">
              <Link
                to="/studio"
                className="bg-myntra-pink text-white font-bold px-6 py-3 text-sm tracking-wide"
              >
                SEE LIVE VOICES
              </Link>
              <Link
                to="/wishlist"
                className="border border-white/40 text-white font-bold px-6 py-3 text-sm tracking-wide hover:bg-white/10"
              >
                COMPARE WISHLIST
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {STEPS.map((step) => (
              <div key={step.n} className="border border-white/15 bg-white/5 p-3 md:p-4">
                <div className="text-myntra-pink text-[11px] font-bold tracking-[0.18em]">{step.n}</div>
                <h3 className="font-bold text-[13px] md:text-sm mt-2 leading-snug">{step.title}</h3>
                <p className="hidden sm:block text-[11px] text-white/65 mt-1 leading-relaxed">{step.text}</p>
              </div>
            ))}
          </div>
        </div>

        {saved.length > 0 && (
          <div className="mt-8 border border-white/15 bg-white text-myntra-dark p-4 md:p-5">
            <div className="flex flex-wrap justify-between gap-3 items-center">
              <div>
                <p className="font-bold text-sm">Still deciding on {wishlist.length} saved items?</p>
                <p className="text-[12px] text-myntra-muted mt-0.5">
                  Shoppers in your shoes usually wait on fit — not on a discount.
                </p>
              </div>
              <Link to="/wishlist" className="text-[11px] font-bold text-myntra-pink">
                SEE YOUR SHORTLIST →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              {saved.map((item) => (
                <Link key={item.id} to={`/product/${item.id}`} className="flex gap-2 items-center">
                  <img src={item.image} alt="" className="w-12 h-16 object-cover" />
                  <div className="min-w-0">
                    <div className="text-[12px] font-bold truncate">{item.brand}</div>
                    <div className="text-[11px] text-myntra-muted line-clamp-2">{item.fitNote}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4 mt-6">
          {data.ranking.slice(0, 2).map((row) => {
            const theme = data.themes.find((item) => item.label === row.label);
            const quote = theme?.quotes[0];
            const quoteUrl = quote
              ? publicReviewUrl({
                  source: quote.source,
                  url: quote.url,
                  reviewId: quote.reviewId
                })
              : "";
            return (
              <article key={row.label} className="bg-white text-myntra-dark p-5">
                <div className="text-[11px] font-bold text-myntra-pink">
                  #{row.rank} · {friendlyImpact(row.impactOnW2P)}
                </div>
                <h3 className="font-bold text-lg mt-1">{friendlyTheme(row.label)}</h3>
                <p className="text-[13px] text-myntra-muted mt-1">{theme?.summary}</p>
                <p className="text-[12px] mt-2">{friendlyShare(row.estimatedFrequency)}</p>
                {quote && (
                  <div className="mt-3 border-l-2 border-myntra-pink pl-3">
                    <p className="text-[13px]">“{quote.text}”</p>
                    {quoteUrl && (
                      <a
                        href={quoteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block mt-2 text-[12px] font-bold text-myntra-pink"
                      >
                        {reviewLinkLabel(quote.source)} →
                      </a>
                    )}
                  </div>
                )}
                <Link
                  to={THEME_LINKS[row.label] ?? "/studio"}
                  className="inline-block mt-4 text-[12px] font-bold text-myntra-pink"
                >
                  SHOP THIS WORRY →
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
