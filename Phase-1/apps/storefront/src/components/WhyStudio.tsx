import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DownloadScrapeData } from "./DownloadScrapeData";
import { InsightsPanel } from "./InsightsPanel";
import { LiveListenPanel } from "./LiveListenPanel";
import { NextResearchPanel } from "./NextResearchPanel";
import { Phase2Panel } from "./Phase2Panel";
import { QuestionsCoverage } from "./QuestionsCoverage";
import { ScoreHighlights } from "./ScoreHighlights";
import { SurveyBanner } from "./SurveyBanner";
import { SURVEY_FORM_URL } from "../lib/researchLinks";
import {
  EVIDENCE_SECTIONS,
  activateStudioView,
  studioPanelId,
  studioView,
  type StudioViewId
} from "../lib/studioFlow";

export function WhyStudio({ section }: { section: StudioViewId }) {
  const navigate = useNavigate();
  useEffect(() => {
    activateStudioView(section === "why" ? "bet" : section);
  }, [section]);

  const active = section === "why" ? "bet" : section;

  return (
    <div className="bg-myntra-bg">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-white border border-myntra-border p-4 md:p-5">
          <p className="text-[11px] font-bold tracking-[0.2em] text-myntra-pink">WHY THIS ROOM EXISTS</p>
          <h2 className="font-bold text-xl mt-1">Fit is nominated. Interviews can still kill it.</h2>
          <p className="text-sm text-myntra-muted mt-2 max-w-2xl">
            One evidence scroll for a reviewer: the scored bet, live shopper voice, the W2P tree,
            and the eight questions we will actually ask. The shopper path stays in The room.
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            <DownloadScrapeData />
            <a
              href={SURVEY_FORM_URL}
              target="_blank"
              rel="noreferrer"
              className="text-[12px] font-bold text-myntra-pink self-center"
            >
              Open questionnaire →
            </a>
          </div>
          <div className="mt-4">
            <SurveyBanner compact />
          </div>
        </div>

        <nav className="sticky top-[80px] z-20 bg-myntra-bg/95 backdrop-blur py-3 -mx-4 px-4 overflow-x-auto no-scrollbar">
          <div className="flex gap-2">
            {EVIDENCE_SECTIONS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(studioView(item.id))}
                className={`shrink-0 px-3 py-1.5 text-[12px] font-bold border ${
                  active === item.id
                    ? "bg-myntra-pink border-myntra-pink text-white"
                    : "bg-white border-myntra-border text-myntra-dark"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </nav>
      </div>

      <div id={studioPanelId("bet")}>
        <ScoreHighlights />
      </div>
      <div id={studioPanelId("listen")}>
        <LiveListenPanel />
      </div>
      <div id={studioPanelId("stories")}>
        <InsightsPanel />
      </div>
      <div id={studioPanelId("questions")}>
        <QuestionsCoverage />
      </div>
      <div id={studioPanelId("focus")}>
        <Phase2Panel />
      </div>
      <div id={studioPanelId("next")}>
        <NextResearchPanel />
      </div>
    </div>
  );
}