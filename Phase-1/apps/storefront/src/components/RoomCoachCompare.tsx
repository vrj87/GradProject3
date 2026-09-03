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
import { buildRoomCompare, parseRoomWearsPerMonth, type RoomCoachTab } from "../lib/roomCoach";
import type { PinZone } from "../lib/fittingRoom";

export function RoomCoachCompare({
  left,
  right,
  zone,
  usual,
  between,
  peers,
  action = "keep",
  onKeep,
  onClose
}: {
  left: Product;
  right: Product;
  zone: PinZone | null;
  usual: string;
  between: boolean;
  peers?: Product[];
  action?: "keep" | "bag";
  onKeep: (id: string) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<RoomCoachTab>("fit");
  const [wearsInput, setWearsInput] = useState("");
  const [wearsPerMonth, setWearsPerMonth] = useState<number | undefined>(undefined);
  const [wearError, setWearError] = useState<string | null>(null);
  const status = useCoachStatus();
  const insights = useCoachInsights({
    itemIds: [left.id, right.id],
    peerIds: peers?.map((item) => item.id),
    zone,
    usual,
    between
  });

  const compare = useMemo(() => {
    if (!insights.ready) return null;
    const local = buildRoomCompare(left, right, zone, {
      usual,
      between,
      occasionsPerMonth: wearsPerMonth,
      peers
    });
    const fromApi = insights.data;
    if (!fromApi?.looks.length) return local;
    return {
      ...local,
      looks: local.looks.map((look) => {
        const llm = fromApi.looks.find((row) => row.itemId === look.itemId);
        if (!llm) return look;
        return {
          ...llm,
          worth: wearsPerMonth === undefined ? llm.worth : look.worth
        };
      }),
      recommendation:
        wearsPerMonth === undefined && fromApi.recommendation ? fromApi.recommendation : local.recommendation
    };
  }, [insights.ready, insights.data, left, right, zone, usual, between, wearsPerMonth, peers]);
  const pair = [left, right];
  const pick = pair.find((item) => item.id === compare?.recommendation.itemId) ?? left;
  const verb = action === "bag" ? "MOVE" : "KEEP";
  const instead = action === "bag" ? "TO BAG INSTEAD" : "INSTEAD";

  useEffect(() => {
    window.setTimeout(() => {
      document.getElementById("studio-room-coach")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 40);
  }, [left.id, right.id]);

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
    <section id="studio-room-coach" className="mt-5 bg-white text-myntra-dark p-4 md:p-5 scroll-mt-28">
      <div className="flex flex-wrap items-start gap-3">
        <div>
          <p className="text-[11px] font-bold tracking-[0.18em] text-myntra-pink">COACH ON THIS PAIR</p>
          <h3 className="font-bold text-lg mt-1">Finish the call on these two hangers</h3>
          <p className="text-[13px] text-myntra-muted mt-1 max-w-xl">
            Will it fit, where I&apos;d wear it, and is it worth it — generated when you ask, on this pair.
          </p>
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

      {!insights.ready || !compare ? (
        <CoachGenerating
          on={`${left.brand} and ${right.brand}`}
          engineLabel={coachEngineLabel(status?.provider)}
          modelNote={coachBannerCopy({ generating: true, provider: status?.provider, model: status?.model }).title}
        />
      ) : (
        <>
          <CoachTabNav tab={tab} onTab={setTab} />

          <div className="mt-4 overflow-x-auto">
            <div className="grid grid-cols-2 gap-4 min-w-[520px]">
              {pair.map((item) => (
                <div key={item.id} className="min-w-0">
                  <ProductImage
                    product={item}
                    alt={item.brand}
                    className="w-14 h-[76px] object-cover mb-2"
                  />
                  <p className="font-bold">{item.brand}</p>
                  <p className="text-myntra-muted text-[12px]">{item.name}</p>
                  <p className="text-[12px] mt-0.5">{formatInr(item.price)}</p>
                </div>
              ))}
            </div>
          </div>

          <CoachQuestion id="coach-fit" title="Will it fit">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pair.map((item) => {
                const look = compare.looks.find((row) => row.itemId === item.id);
                if (!look) return null;
                return <FitColumn key={item.id} look={look} product={item} />;
              })}
            </div>
          </CoachQuestion>
          <CoachQuestion id="coach-wear" title="Where I'd wear it">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pair.map((item) => {
                const look = compare.looks.find((row) => row.itemId === item.id);
                if (!look) return null;
                return <WearColumn key={item.id} look={look} />;
              })}
            </div>
          </CoachQuestion>
          <CoachQuestion id="coach-worth" title="Is it worth it">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pair.map((item) => {
                const look = compare.looks.find((row) => row.itemId === item.id);
                if (!look) return null;
                return <WorthColumn key={item.id} look={look} />;
              })}
            </div>
            <WorthEstimateForm
              value={wearsInput}
              error={wearError}
              hint="Times you would wear either look in a typical month — recalculates cost per wear on both hangers."
              onChange={setWearsInput}
              onSubmit={applyEstimate}
            />
          </CoachQuestion>

          <div className="mt-4 border-l-2 border-myntra-pink pl-3">
            <p className="font-bold">{compare.recommendation.rationale}</p>
            <p className="text-[13px] text-myntra-muted mt-1">{compare.recommendation.wouldChangeIf}</p>
          </div>

          <div className="flex flex-wrap gap-3 mt-4">
            <button
              type="button"
              className="bg-myntra-pink text-white font-bold px-5 py-2.5 text-sm"
              onClick={() => onKeep(pick.id)}
            >
              {verb} {pick.brand.toUpperCase()}
              {action === "bag" ? " TO BAG" : ""}
            </button>
            {pair
              .filter((item) => item.id !== pick.id)
              .map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="border border-myntra-pink text-myntra-pink font-bold px-5 py-2.5 text-sm"
                  onClick={() => onKeep(item.id)}
                >
                  {verb} {item.brand.toUpperCase()} {instead}
                </button>
              ))}
          </div>
        </>
      )}
    </section>
  );
}
