import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SURVEY_FORM_URL, SURVEY_SHEET_URL } from "../lib/researchLinks";
import { formatWindow, loadSurvey, type SurveyPayload } from "../lib/fetchSurvey";
import { STUDIO_ENTRY, STUDIO_WHY } from "../lib/studioFlow";

const ROLE_LABEL: Record<string, string> = {
  screen: "Screening",
  evidence: "Evidence",
  "survey-only": "Form only"
};

function Bar({ count, of }: { count: number; of: number }) {
  const pct = of > 0 ? Math.round((count / of) * 100) : 0;
  return (
    <div className="h-1.5 bg-myntra-bg mt-1">
      <div className="h-full bg-myntra-pink" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Survey() {
  const [data, setData] = useState<SurveyPayload | null>(null);
  const [error, setError] = useState("");
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    loadSurvey()
      .then((payload) => {
        if (!payload) throw new Error("The response file is not available right now.");
        setData(payload);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  const summary = data?.summary;
  const n = summary?.respondents ?? 0;

  return (
    <div className="bg-myntra-bg min-h-[60vh]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-[11px] font-bold tracking-[0.18em] text-myntra-pink">
          QUESTIONNAIRE RESPONSES
        </p>
        <h1 className="text-xl md:text-2xl font-bold mt-1">
          Every answer we have, counted in the open
        </h1>
        <p className="text-sm text-myntra-muted mt-2 max-w-2xl">
          These are the real replies to the shopper questionnaire, read straight from the form
          export. No answer is edited, weighted, or invented, and the counts are computed rather
          than typed — so this page disagrees with us when the responses do.
        </p>

        {error && <p className="text-myntra-pink mt-4 text-sm">{error}</p>}

        {summary && (
          <>
            <div className="bg-white border border-myntra-border p-4 mt-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-2xl font-bold">{n}</p>
                  <p className="text-[11px] text-myntra-muted">
                    respondents · {formatWindow(summary.window)}
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{summary.segment.usesWishlist}</p>
                  <p className="text-[11px] text-myntra-muted">use a wishlist today</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{summary.segment.stalls}</p>
                  <p className="text-[11px] text-myntra-muted">rarely buy what they save</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{summary.segment.inSegment}</p>
                  <p className="text-[11px] text-myntra-muted">match the staller segment</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-myntra-pink p-4 mt-3">
              <p className="text-[11px] font-bold tracking-[0.18em] text-myntra-pink">
                WHAT WOULD UNLOCK THE PURCHASE
              </p>
              <p className="text-[13px] mt-2">
                <b>{summary.unlock.information}</b> asked for information they did not have.{" "}
                <b>{summary.unlock.monetary}</b> asked for a price drop. The brief rules out
                discounts as the lever, so only the first group is ours to serve — and the margin
                is one person wide.
              </p>
              {summary.mainBarriers.length > 0 && (
                <p className="text-[12px] text-myntra-muted mt-2">
                  Main reason a save went unbought:{" "}
                  {summary.mainBarriers.map((row) => `${row.kind} ${row.count}`).join(" · ")}.
                  Price leads, which is a genuine challenge to a fit-first reading.
                </p>
              )}
            </div>

            <div className="mt-6 space-y-3">
              {summary.questions.map((question) => (
                <article key={question.id} className="bg-white border border-myntra-border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold text-myntra-pink">Q{question.id}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-myntra-bg text-myntra-muted">
                      {ROLE_LABEL[question.role] ?? question.role}
                    </span>
                    {question.multiSelect && (
                      <span className="text-[10px] text-myntra-muted">pick many</span>
                    )}
                    <span className="text-[10px] text-myntra-muted ml-auto">
                      {question.answered}/{n} answered
                    </span>
                  </div>
                  <p className="font-bold mt-1 text-[14px]">{question.text}</p>

                  <ul className="mt-3 space-y-2">
                    {question.tallies.map((row) => (
                      <li key={row.answer}>
                        <div className="flex justify-between gap-3 text-[13px]">
                          <span>{row.answer}</span>
                          <b className="shrink-0">{row.count}</b>
                        </div>
                        <Bar count={row.count} of={n} />
                      </li>
                    ))}
                  </ul>

                  {summary.scales
                    .filter((scale) => scale.id === question.id)
                    .map((scale) => (
                      <p key={scale.id} className="text-[12px] text-myntra-muted mt-3">
                        Mean {scale.mean} · answers ranged {scale.min}–{scale.max}. The export does
                        not carry the slider bounds, so read this as relative.
                      </p>
                    ))}
                </article>
              ))}
            </div>

            {data.responses.length > 0 && (
              <div className="bg-white border border-myntra-border p-4 mt-3">
                <button
                  type="button"
                  onClick={() => setShowRaw((prev) => !prev)}
                  className="text-[12px] font-bold text-myntra-pink"
                >
                  {showRaw ? "HIDE" : "SHOW"} EVERY INDIVIDUAL RESPONSE →
                </button>
                {showRaw && (
                  <div className="mt-3 space-y-3">
                    {data.responses.map((response) => (
                      <div key={response.id} className="border-t border-myntra-border pt-3">
                        <p className="text-[11px] font-bold text-myntra-muted">
                          {response.id} · {new Date(response.submittedAt).toLocaleString("en-IN")}
                        </p>
                        <ul className="mt-1 space-y-0.5">
                          {summary.questions.map((question) => {
                            const answer = response.answers[String(question.id)];
                            if (!answer?.length) return null;
                            return (
                              <li key={question.id} className="text-[12px]">
                                <span className="text-myntra-muted">Q{question.id}:</span>{" "}
                                {answer.join(", ")}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="bg-white border border-myntra-border p-4 mt-3 text-[12px] text-myntra-muted">
              <p>
                Generated {new Date(summary.generatedAt).toLocaleString("en-IN")} by{" "}
                <code>npm run survey</code>, straight from the form export. Raw files:{" "}
                <a href="/survey/survey-summary.json" className="font-bold text-myntra-pink">
                  summary JSON
                </a>{" "}
                ·{" "}
                <a href="/survey/survey-responses.json" className="font-bold text-myntra-pink">
                  every response
                </a>
                .
              </p>
              <p className="mt-2">
                The original Google sheet is{" "}
                <a
                  href={SURVEY_SHEET_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-myntra-pink"
                >
                  here
                </a>
                , but it is private to the form owner — which is why this page exists.
              </p>
            </div>
          </>
        )}

        <div className="flex flex-wrap gap-4 mt-6">
          <a
            href={SURVEY_FORM_URL}
            target="_blank"
            rel="noreferrer"
            className="bg-myntra-pink text-white font-bold px-5 py-2.5 text-[13px]"
          >
            ADD YOUR OWN ANSWERS →
          </a>
          <Link to={STUDIO_WHY} className="text-[13px] font-bold text-myntra-pink self-center">
            HOW THIS SHAPED THE BUILD →
          </Link>
          <Link to={STUDIO_ENTRY} className="text-[13px] font-bold text-myntra-pink self-center">
            OPEN THE FITTING ROOM →
          </Link>
        </div>
      </div>
    </div>
  );
}
