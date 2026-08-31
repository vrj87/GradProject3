import { Link, useSearchParams } from "react-router-dom";
import { StudioFlow } from "../components/StudioFlow";
import { WhyStudio } from "../components/WhyStudio";
import {
  STUDIO_TABS,
  STUDIO_WHY,
  activateFlowStep,
  activateStudioView,
  flowFromView,
  isStudioView,
  studioSurface
} from "../lib/studioFlow";
import { Decide } from "./Decide";

export function Studio() {
  const [params, setParams] = useSearchParams();
  const rawView = params.get("view");
  const view = isStudioView(rawView) ? rawView : "room";
  const surface = studioSurface(view);
  const flow = flowFromView(view, params.get("step"));

  function openTab(id: "room" | "why") {
    if (id === "room") {
      if (surface === "room") {
        activateStudioView("room");
        return;
      }
      setParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("view", "room");
        if (!next.get("step")) next.set("step", "hang");
        return next;
      });
      activateStudioView("room");
      return;
    }
    if (surface === "why") {
      activateStudioView(view === "why" ? "bet" : view);
      return;
    }
    setParams({ view: "why" });
    activateStudioView("why");
  }

  return (
    <div className="bg-white">
      <div className="bg-[#1a0a10] text-white">
        <div className="max-w-6xl mx-auto px-4 pt-6 pb-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[11px] font-bold tracking-[0.25em] text-myntra-pink">MYNTRA STUDIO</p>
            <span className="border border-white/25 text-[9px] font-bold px-1.5 py-0.5 tracking-wide">
              NO COUPON
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mt-2 leading-tight">
            Name the doubt on one body. Keep one hanger.
          </h1>
          <p className="text-white/70 text-sm mt-2 max-w-xl">
            Two similar saves share a silhouette. Tap bust, length, or foot — then keep the look
            you would wear. Size comes from shopper notes. Never a coupon.
          </p>
          <div className="mt-5">
            <StudioFlow current={flow} />
          </div>
          <div className="flex gap-8 text-sm font-bold mt-6">
            {STUDIO_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => openTab(tab.id)}
                className={`pb-3 border-b-2 ${
                  surface === tab.id
                    ? "border-myntra-pink text-myntra-pink"
                    : "border-transparent text-white/55 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      {surface === "room" && <Decide />}
      {surface === "why" && <WhyStudio section={view} />}
      {surface === "room" && (
        <div className="bg-[#1a1216] text-center pb-8">
          <Link
            to={STUDIO_WHY}
            onClick={() => activateFlowStep("bet")}
            className="text-[12px] font-bold text-myntra-pink"
          >
            WHY THIS ROOM · SEE THE BET →
          </Link>
        </div>
      )}
    </div>
  );
}
