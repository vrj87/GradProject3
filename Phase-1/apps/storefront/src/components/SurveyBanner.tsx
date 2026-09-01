import { Link } from "react-router-dom";
import { SURVEY_FORM_URL, SURVEY_RESPONSES_URL } from "../lib/researchLinks";

export function SurveyBanner({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "border border-myntra-pink/40 bg-[#fff4f6] p-4" : "bg-myntra-pink text-white p-5 md:p-6"}>
      <p
        className={`text-[11px] font-bold tracking-[0.18em] ${compact ? "text-myntra-pink" : "text-white/80"}`}
      >
        LIVE QUESTIONNAIRE
      </p>
      <h2 className={`font-bold mt-1 ${compact ? "text-[16px] text-myntra-dark" : "text-xl md:text-2xl"}`}>
        The scrape is keyed to the same questions we ask shoppers
      </h2>
      <p className={`text-sm mt-2 max-w-2xl ${compact ? "text-myntra-muted" : "text-white/85"}`}>
        Fit, sale-waiting, compare, quality, and what people check before they buy. Public reviews
        are kept only when they speak to those prompts. The replies are published exactly as they
        came in, including the ones that argue with us.
      </p>
      <div className="flex flex-wrap gap-3 mt-4">
        <a
          href={SURVEY_FORM_URL}
          target="_blank"
          rel="noreferrer"
          className={
            compact
              ? "bg-myntra-pink text-white font-bold px-4 py-2 text-[12px]"
              : "bg-white text-myntra-pink font-bold px-5 py-2.5 text-[13px]"
          }
        >
          TAKE THE 4–5 MIN SURVEY →
        </a>
        <Link
          to={SURVEY_RESPONSES_URL}
          className={
            compact
              ? "text-[12px] font-bold text-myntra-pink self-center"
              : "text-[13px] font-bold text-white self-center"
          }
        >
          SEE RESPONSES →
        </Link>
      </div>
    </div>
  );
}
