import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { loadPhase2, type Phase2Payload } from "../lib/fetchDiscovery";
import { STUDIO_ENTRY } from "../lib/studioFlow";
import { friendlyTheme } from "../lib/friendlyLabels";
import { SurveyBanner } from "./SurveyBanner";
import { SURVEY_QUESTIONS } from "../lib/surveyQuestions";

const RISKS = [
  {
    title: "App-store noise",
    text: "Many public reviews are about delivery or support, not wishlists. We drop those. Residual noise is why quotes must still match the review text."
  },
  {
    title: "Sale-waiting is real",
    text: "Price timing shows up often. Treating it as the product would raise conversion with coupons and fail the brief. We rank it, then set it aside."
  },
  {
    title: "Interviews are not done yet",
    text: "We will not invent respondents. The eight questions below are what we will ask 5–6 shoppers who save, stall on fit, and keep comparing."
  },
  {
    title: "A size tool could delay some buys",
    text: "If the note says “runs small,” some people may wait longer. Guardrail: time-to-bag should not get worse while uncertainty resolution goes up."
  }
];

export function NextResearchPanel() {
  const [data, setData] = useState<Phase2Payload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadPhase2()
      .then((payload) => {
        if (!payload) throw new Error("This view is not available right now.");
        setData(payload);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  const seeds = data?.nomination.interviewSeeds ?? [];

  return (
    <div className="bg-myntra-bg min-h-[60vh]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold">What we would ask next</h2>
        <p className="text-myntra-muted mt-2 text-sm max-w-2xl">
          Public comments nominated fit-and-compare as the non-sale problem. Interviews must
          confirm or kill that — they are not written yet, and we will not fake them.
        </p>
        <div className="mt-5">
          <SurveyBanner compact />
        </div>
        {error && <p className="text-myntra-pink mt-4">{error}</p>}

        <div className="bg-white border border-myntra-border p-5 mt-6">
          <p className="text-[11px] font-bold tracking-[0.18em] text-myntra-pink">WHO TO TALK TO</p>
          <p className="font-bold mt-1">
            Shoppers who save items, wait on fit, and keep two or three similar looks.
          </p>
          <p className="text-sm text-myntra-muted mt-2">
            Five or six conversations. Same eight prompts for each person. If they mostly wait for
            a sale, we change the problem — we do not force Fit Insight.
          </p>
        </div>

        <h3 className="font-bold mt-8 mb-3">Questionnaire prompts we also scrape for</h3>
        <ol className="space-y-2">
          {SURVEY_QUESTIONS.filter((question) => question.role === "evidence").map((question) => (
            <li key={question.id} className="bg-white border border-myntra-border p-3 text-sm">
              <span className="font-bold text-myntra-pink">Q{question.id}.</span> {question.text}
            </li>
          ))}
        </ol>

        <ol className="mt-6 space-y-3">
          {seeds.map((seed) => (
            <li key={seed.briefQuestion} className="bg-white border border-myntra-border p-4">
              <p className="text-[11px] font-bold text-myntra-pink">Prompt {seed.briefQuestion}</p>
              <p className="font-bold mt-1">{seed.prompt}</p>
              <p className="text-sm text-myntra-muted mt-2">
                Tied to: {seed.linkedThemeIds.map((id) => friendlyTheme(id)).join(" · ")}
              </p>
            </li>
          ))}
        </ol>

        <h3 className="font-bold mt-10 mb-3">How this could fail</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {RISKS.map((risk) => (
            <article key={risk.title} className="bg-white border border-myntra-border p-4">
              <h4 className="font-bold">{risk.title}</h4>
              <p className="text-sm text-myntra-muted mt-2">{risk.text}</p>
            </article>
          ))}
        </div>

        <p className="text-sm mt-8">
          Try the non-discount path on your shortlist:{" "}
          <Link to={STUDIO_ENTRY} className="font-bold text-myntra-pink">
            hang similar saves in the Studio room →
          </Link>
        </p>
      </div>
    </div>
  );
}
