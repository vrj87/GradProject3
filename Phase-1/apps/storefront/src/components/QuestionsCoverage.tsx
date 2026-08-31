import { useEffect, useState } from "react";
import { SurveyBanner } from "./SurveyBanner";
import { loadDiscovery, type DiscoveryPayload } from "../lib/fetchDiscovery";
import { friendlyTheme } from "../lib/friendlyLabels";
import {
  SURVEY_QUESTIONS,
  themesForSurveyQuestion,
  voicesForSurveyQuestion
} from "../lib/surveyQuestions";
import { publicReviewUrl, reviewLinkLabel } from "../lib/sourceUrls";

const ROLE_LABEL: Record<string, string> = {
  evidence: "Scraped for this prompt",
  screen: "Asked in the form",
  "survey-only": "Form only — not scraped"
};

export function QuestionsCoverage() {
  const [data, setData] = useState<DiscoveryPayload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDiscovery()
      .then((payload) => {
        if (!payload) throw new Error("This view is not available right now.");
        setData(payload);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  const evidence = SURVEY_QUESTIONS.filter((question) => question.role === "evidence");
  const heard = evidence.filter((question) => {
    if (!data) return false;
    const themes = themesForSurveyQuestion(question, data.themes);
    const voices = voicesForSurveyQuestion(question, data.voices);
    return themes.length > 0 || voices.length > 0;
  }).length;

  return (
    <div className="bg-myntra-bg min-h-[60vh]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold">Each questionnaire prompt, with live scrape next to it</h2>
        <p className="text-myntra-muted mt-2 text-sm max-w-2xl">
          Screening items stay on the form. Evidence items are the search terms we use on public
          reviews. Empty means we did not find a matching comment — we do not invent one.
        </p>
        <div className="mt-5">
          <SurveyBanner compact />
        </div>
        {error && <p className="text-myntra-pink mt-4">{error}</p>}
        {data && (
          <p className="text-sm mt-5">
            <b>{heard}</b> of {evidence.length} evidence prompts have at least one matching public
            comment in this collection.
          </p>
        )}
        <div className="mt-6 space-y-3">
          {SURVEY_QUESTIONS.map((question) => {
            const themes = data ? themesForSurveyQuestion(question, data.themes) : [];
            const voices = data ? voicesForSurveyQuestion(question, data.voices).slice(0, 2) : [];
            const quote = themes[0]?.quotes[0];
            const heardInScrape = themes.length > 0 || voices.length > 0;
            return (
              <article key={question.id} className="bg-white border border-myntra-border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold text-myntra-pink">Q{question.id}</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 ${
                      question.role === "evidence" && heardInScrape
                        ? "bg-myntra-pink/10 text-myntra-pink"
                        : question.role === "evidence"
                          ? "bg-myntra-gold/20 text-myntra-gold"
                          : "bg-myntra-bg text-myntra-muted"
                    }`}
                  >
                    {question.role === "evidence"
                      ? heardInScrape
                        ? "Heard in scrape"
                        : "Not enough comments yet"
                      : ROLE_LABEL[question.role]}
                  </span>
                </div>
                <p className="font-bold mt-1">{question.text}</p>
                {question.scrapeQueries.length > 0 && (
                  <p className="text-[12px] text-myntra-muted mt-2">
                    Search terms: {question.scrapeQueries.join(" · ")}
                  </p>
                )}
                {themes.length > 0 && (
                  <p className="text-sm mt-2">
                    {themes.map((theme) => friendlyTheme(theme.label)).join(" · ")}
                  </p>
                )}
                {quote && (
                  <blockquote className="mt-3 border-l-2 border-myntra-pink pl-3 text-sm">
                    “{quote.text.slice(0, 220)}”
                    <a
                      href={publicReviewUrl({
                        source: quote.source,
                        url: quote.url,
                        reviewId: quote.reviewId
                      })}
                      target="_blank"
                      rel="noreferrer"
                      className="block mt-1 text-[12px] font-bold text-myntra-pink"
                    >
                      {reviewLinkLabel(quote.source)} →
                    </a>
                  </blockquote>
                )}
                {!quote && voices[0] && (
                  <blockquote className="mt-3 border-l-2 border-myntra-pink pl-3 text-sm">
                    “{voices[0].text.slice(0, 220)}”
                  </blockquote>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
