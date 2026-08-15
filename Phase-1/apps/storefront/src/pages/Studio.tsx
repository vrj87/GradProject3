import { useSearchParams } from "react-router-dom";
import { DownloadScrapeData } from "../components/DownloadScrapeData";
import { InsightsPanel } from "../components/InsightsPanel";
import { LiveListenPanel } from "../components/LiveListenPanel";
import { Phase2Panel } from "../components/Phase2Panel";
import { QuestionsCoverage } from "../components/QuestionsCoverage";

const VIEWS = [
  { id: "listen", label: "Live voices" },
  { id: "stories", label: "Shopper stories" },
  { id: "questions", label: "Q1–Q10" },
  { id: "focus", label: "What to focus on" }
] as const;

type ViewId = (typeof VIEWS)[number]["id"];

function isView(value: string | null): value is ViewId {
  return VIEWS.some((view) => view.id === value);
}

export function Studio() {
  const [params, setParams] = useSearchParams();
  const view = isView(params.get("view")) ? params.get("view")! : "listen";

  return (
    <div className="bg-white">
      <div className="bg-[#1a0a10] text-white">
        <div className="max-w-6xl mx-auto px-4 py-8 md:py-10">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[11px] font-bold tracking-[0.25em] text-myntra-pink">MYNTRA STUDIO</p>
            <span className="bg-myntra-pink text-white text-[9px] font-bold px-1.5 py-0.5">
              LIVE COLLECTION
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mt-2">Live shopper voices</h1>
          <p className="text-white/75 text-sm mt-2 max-w-2xl">
            We collect public App Store and Play Store reviews as they come in, keep the ones about
            saving and fit, and turn them into Fit Insight. No discounts. No made-up quotes.
          </p>
          <DownloadScrapeData />
          <div className="flex gap-6 mt-6 text-sm font-bold overflow-x-auto no-scrollbar">
            {VIEWS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setParams({ view: item.id })}
                className={`pb-2 border-b-2 shrink-0 ${
                  view === item.id
                    ? "border-myntra-pink text-myntra-pink"
                    : "border-transparent text-white/55 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      {view === "listen" && <LiveListenPanel />}
      {view === "stories" && <InsightsPanel />}
      {view === "questions" && <QuestionsCoverage />}
      {view === "focus" && <Phase2Panel />}
    </div>
  );
}
