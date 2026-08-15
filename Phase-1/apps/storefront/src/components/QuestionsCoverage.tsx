import { useEffect, useState } from "react";
import { friendlyTheme } from "../lib/friendlyLabels";

const QUESTIONS = [
  { id: 1, text: "Why do users add fashion products to their wishlist?" },
  { id: 2, text: "What prevents wishlisted products from eventually being purchased?" },
  { id: 3, text: "What uncertainties remain after users have identified a product they like?" },
  { id: 4, text: "What causes users to postpone a purchase?" },
  { id: 5, text: "How do users compare multiple shortlisted products?" },
  { id: 6, text: "What information do users seek outside Myntra before purchasing?" },
  { id: 7, text: "What role do fit, size, styling, price, reviews, occasion, and social validation play?" },
  { id: 8, text: "When is the wishlist genuine purchase intent vs a bookmark?" },
  { id: 9, text: "How do these behaviors differ across user segments?" },
  { id: 10, text: "What unmet needs emerge consistently across conversations?" }
] as const;

interface Theme {
  id: string;
  label: string;
  researchQuestionIds?: number[];
}

interface Payload {
  themes: Theme[];
  stats?: { researchQuestionGaps?: number[]; readyForPhase2?: boolean };
}

export function QuestionsCoverage() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/discovery")
      .then((res) => {
        if (!res.ok) throw new Error("Research coverage is not available right now.");
        return res.json();
      })
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, []);

  const gaps = new Set(data?.stats?.researchQuestionGaps ?? []);

  return (
    <div className="bg-myntra-bg min-h-[60vh]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold">Q1–Q10 research coverage</h2>
        <p className="text-myntra-muted mt-2 text-sm max-w-2xl">
          Every assignment question must map to a theme or be logged as a gap. Empty cells were not guessed.
        </p>
        {error && <p className="text-myntra-pink mt-4">{error}</p>}
        {data && (
          <div className="mt-6 space-y-3">
            {QUESTIONS.map((question) => {
              const themes = data.themes.filter((theme) =>
                (theme.researchQuestionIds ?? []).includes(question.id)
              );
              const isGap = themes.length === 0 || gaps.has(question.id);
              return (
                <article
                  key={question.id}
                  className="bg-white border border-myntra-border p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-myntra-pink">Q{question.id}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 ${
                        isGap ? "bg-myntra-gold/20 text-myntra-gold" : "bg-myntra-pink/10 text-myntra-pink"
                      }`}
                    >
                      {isGap ? "GAP" : `${themes.length} theme${themes.length === 1 ? "" : "s"}`}
                    </span>
                  </div>
                  <p className="font-bold mt-1">{question.text}</p>
                  <p className="text-sm text-myntra-muted mt-2">
                    {themes.length
                      ? themes.map((theme) => friendlyTheme(theme.label)).join(" · ")
                      : "No linked theme in Phase 1 output"}
                  </p>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
