import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { StudioFlow } from "./StudioFlow";
import { SurveyBanner } from "./SurveyBanner";
import { loadDiscovery, type DiscoveryPayload } from "../lib/fetchDiscovery";
import { friendlyImpact, friendlyShare, friendlySource, friendlyTheme } from "../lib/friendlyLabels";
import { publicReviewUrl, reviewLinkLabel, storeListingUrl } from "../lib/sourceUrls";
import { STUDIO_ENTRY, STUDIO_WHY } from "../lib/studioFlow";
import { PRODUCTS } from "../data/products";
import { useStore } from "../store";

const THEME_LINKS: Record<string, string> = {
  FitSizeAnxiety: STUDIO_ENTRY,
  ComparisonParalysis: STUDIO_ENTRY,
  ReturnFearDelay: "/shop/women?cat=western"
};

export function HomeFitInsight() {
  const [data, setData] = useState<DiscoveryPayload | null>(null);
  const { wishlist } = useStore();
  const saved = PRODUCTS.filter((item) => wishlist.includes(item.id)).slice(0, 3);
  const nonPrice = (data?.ranking ?? []).filter((row) => !row.priceFlag).slice(0, 2);

  useEffect(() => {
    loadDiscovery().then((payload) => {
      if (payload) setData(payload);
    });
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

        <div>
          <div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
              Name the doubt on one body. Keep one hanger.
            </h2>
            <p className="mt-3 text-white/80 text-sm md:text-base max-w-xl">
              Wishlist already shows intent. Studio hangs two similar saves on a shared silhouette,
              names bust / length / foot, and keeps one look so a save can become a bag add inside
              30 days — without a sale.
            </p>
            {data?.stats && (
              <div className="flex flex-wrap gap-2 mt-4 text-[11px] font-bold">
                <span className="bg-white/10 px-2 py-1">{data.stats.rawCount} reviews collected</span>
                <span className="bg-white/10 px-2 py-1">{data.stats.normalizedCount} about wishlists</span>
                {Object.entries(data.stats.sourceCoverage ?? {})
                  .filter(([source]) => !["fixture", "interview"].includes(source))
                  .map(([source, count]) => (
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
            <div className="mt-5">
              <StudioFlow current="save" />
            </div>
            <div className="flex flex-wrap gap-3 mt-6">
              <Link
                to={STUDIO_ENTRY}
                className="bg-myntra-pink text-white font-bold px-6 py-3 text-sm tracking-wide"
              >
                OPEN THE ROOM
              </Link>
              <Link
                to={STUDIO_WHY}
                className="bg-white text-myntra-dark font-bold px-6 py-3 text-sm tracking-wide"
              >
                WHY THIS ROOM
              </Link>
            </div>
            <div className="mt-5">
              <SurveyBanner compact />
            </div>
          </div>
        </div>

        {saved.length > 0 && (
          <div className="mt-8 border border-white/15 bg-white text-myntra-dark p-4 md:p-5">
            <div className="flex flex-wrap justify-between gap-3 items-center">
              <div>
                <p className="font-bold text-sm">Still deciding on {wishlist.length} saved items?</p>
                <p className="text-[12px] text-myntra-muted mt-0.5">
                  The comments we keep are about doubt — fit, compare, occasion — not a missing discount.
                </p>
              </div>
              <Link to={STUDIO_ENTRY} className="text-[11px] font-bold text-myntra-pink">
                HANG ONE LOOK →
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
          {nonPrice.map((row) => {
            const theme = data?.themes.find((item) => item.label === row.label || item.id === row.themeId);
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
