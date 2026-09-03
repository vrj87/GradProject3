import { useEffect, useMemo, useState } from "react";
import { ProductImage } from "./ProductImage";
import {
  CoachGenerating,
  CoachProviderBanner,
  CoachQuestion,
  CoachTabNav,
  FitColumn,
  WearColumn,
  WorthColumn,
  WorthEstimateForm
} from "./CoachBriefs";
import type { Product } from "../data/products";
import { formatInr } from "../data/products";
import { useCoachInsights, useCoachStatus } from "../lib/useCoachInsights";
import { coachBannerCopy, coachEngineLabel } from "../lib/coachLlm";
import {
  buildCoachLook,
  buildWorthBrief,
  parseRoomWearsPerMonth,
  type RoomCoachLook,
  type RoomCoachTab
} from "../lib/roomCoach";
import { suggestSize } from "../lib/sizeAdvice";

export function CoachLookPanel({
  product,
  peers,
  usual,
  between,
  onBag,
  onDrop,
  onClose,
  peerHeading = "AGAINST YOUR OTHER SAVES"
}: {
  product: Product;
  peers: Product[];
  usual: string;
  between: boolean;
  onBag: (id: string, size: string) => void;
  onDrop: (id: string) => void;
  onClose: () => void;
  peerHeading?: string;
}) {
  const [tab, setTab] = useState<RoomCoachTab>("fit");
  const [wearsInput, setWearsInput] = useState("");
  const [wearsPerMonth, setWearsPerMonth] = useState<number | undefined>(undefined);
  const [wearError, setWearError] = useState<string | null>(null);
  const status = useCoachStatus();
  const insights = useCoachInsights({
    itemIds: [product.id],
    peerIds: peers.map((item) => item.id),
    usual,
    between
  });
  const advice = suggestSize(product, usual, between);

  const look: RoomCoachLook | null = useMemo(() => {
    if (!insights.ready) return null;
    const fromApi = insights.data?.looks.find((row) => row.itemId === product.id) ?? insights.data?.looks[0];
    if (!fromApi) {
      return buildCoachLook(product, null, { usual, between, peers, occasionsPerMonth: wearsPerMonth });
    }
    if (wearsPerMonth === undefined) return fromApi;
    return { ...fromApi, worth: buildWorthBrief(product, peers, wearsPerMonth) };
  }, [insights.ready, insights.data, product, peers, usual, between, wearsPerMonth]);

  useEffect(() => {
    window.setTimeout(() => {
      document.getElementById("studio-coach-item")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 40);
  }, [product.id]);

  function applyEstimate() {
    const parsed = parseRoomWearsPerMonth(wearsInput);
    if (parsed === undefined) {
      setWearError("Enter how many times a month you would wear it, up to 31.");
      return;
    }
    setWearError(null);
    setWearsPerMonth(parsed);
    setTab("worth");
    document.getElementById("coach-worth")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section id="studio-coach-item" className="bg-white text-myntra-dark p-4 md:p-5 scroll-mt-28">
      <div className="flex flex-wrap items-start gap-3">
        <ProductImage product={product} alt={product.brand} className="w-14 h-[76px] object-cover" />
        <div className="min-w-0">
          <p className="text-[11px] font-bold tracking-[0.18em] text-myntra-pink">COACH ON THIS SAVE</p>
          <h3 className="font-bold text-lg mt-1">{product.brand}</h3>
          <p className="text-[13px] text-myntra-muted">{product.name}</p>
          <p className="text-[13px] mt-0.5">{formatInr(product.price)}</p>
        </div>
        <button type="button" onClick={onClose} className="ml-auto text-[12px] font-bold text-myntra-pink">
          CLOSE
        </button>
      </div>

      <CoachProviderBanner
        generating={!insights.ready}
        meta={insights.data?.meta}
        status={status}
        error={insights.error}
      />

      {!insights.ready || !look ? (
        <CoachGenerating
          on={product.brand}
          engineLabel={coachEngineLabel(status?.provider)}
          modelNote={coachBannerCopy({ generating: true, provider: status?.provider, model: status?.model }).title}
        />
      ) : (
        <>
          <CoachTabNav tab={tab} onTab={setTab} />

          <CoachQuestion id="coach-fit" title="Will it fit">
            <FitColumn look={look} product={product} />
          </CoachQuestion>
          <CoachQuestion id="coach-wear" title="Where I'd wear it">
            <WearColumn look={look} />
          </CoachQuestion>
          <CoachQuestion id="coach-worth" title="Is it worth it">
            <WorthColumn look={look} peerHeading={peerHeading} />
            <WorthEstimateForm
              value={wearsInput}
              error={wearError}
              hint="Times you would wear this look in a typical month — recalculates cost per wear."
              onChange={setWearsInput}
              onSubmit={applyEstimate}
            />
          </CoachQuestion>

          <div className="flex flex-wrap gap-3 mt-5">
            <button
              type="button"
              className="bg-myntra-pink text-white font-bold px-5 py-2.5 text-sm"
              onClick={() => onBag(product.id, advice.size)}
            >
              MOVE {advice.size} TO BAG
            </button>
            <button
              type="button"
              className="border border-myntra-border font-bold px-5 py-2.5 text-sm"
              onClick={() => onDrop(product.id)}
            >
              DROP FROM WISHLIST
            </button>
          </div>
          <p className="text-[11px] text-myntra-muted mt-3">
            Dropping counts as finishing the call. No coupon is offered either way.
          </p>
        </>
      )}
    </section>
  );
}
