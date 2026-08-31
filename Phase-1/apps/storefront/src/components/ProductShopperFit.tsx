import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FittingLook } from "./FittingLook";
import type { Product } from "../data/products";
import { loadDiscovery } from "../lib/fetchDiscovery";
import { friendlyTheme } from "../lib/friendlyLabels";
import type { PinZone } from "../lib/fittingRoom";
import { publicReviewUrl, reviewLinkLabel } from "../lib/sourceUrls";
import { blockerForProduct, type DiscoveryTheme, type RankRow } from "../lib/wishlistBlockers";
import { studioRoom } from "../lib/studioFlow";

export function ProductShopperFit({ product }: { product: Product }) {
  const [themes, setThemes] = useState<DiscoveryTheme[]>([]);
  const [ranking, setRanking] = useState<RankRow[]>([]);
  const [zone, setZone] = useState<PinZone | null>(null);

  useEffect(() => {
    loadDiscovery().then((payload) => {
      if (!payload) return;
      setThemes(payload.themes);
      setRanking(payload.ranking);
    });
  }, []);

  const blocker = blockerForProduct(product, themes, ranking);
  const quote = blocker?.quotes[0];
  const quoteUrl = quote
    ? publicReviewUrl({ source: quote.source, url: quote.url, reviewId: quote.reviewId })
    : "";

  return (
    <div className="mt-5 border border-[#e0e0e0] p-4">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <div>
          <div className="font-bold text-[13px]">TAP THE BODY — SAME ZONES AS THE ROOM</div>
          <p className="text-[10px] font-bold tracking-wide text-myntra-pink mt-0.5">
            FITTING ROOM · PRICE IS OFF
          </p>
        </div>
        {blocker && (
          <span className="text-[12px] font-bold text-myntra-pink">
            {friendlyTheme(blocker.label)}
          </span>
        )}
      </div>
      <div className="mt-3 max-w-[240px]">
        <FittingLook product={product} zone={zone} onZone={setZone} />
      </div>
      {quote && (
        <blockquote className="mt-3 border-l-2 border-myntra-pink pl-3 text-[13px]">
          “{quote.text.slice(0, 220)}”
          {quoteUrl && (
            <a
              href={quoteUrl}
              target="_blank"
              rel="noreferrer"
              className="block mt-1 font-bold text-myntra-pink text-[12px]"
            >
              {reviewLinkLabel(quote.source)} →
            </a>
          )}
        </blockquote>
      )}
      <div className="flex flex-wrap gap-3 mt-3">
        <Link to={studioRoom(product.id, "hang")} className="text-[12px] font-bold text-myntra-pink">
          HANG IT IN THE ROOM →
        </Link>
        <Link to="/wishlist" className="text-[12px] font-bold text-myntra-pink">
          OPEN WISHLIST →
        </Link>
      </div>
    </div>
  );
}
