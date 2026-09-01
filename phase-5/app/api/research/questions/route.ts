import { loadResearchQuestions, loadSurveySummary } from "@/lib/artefacts";
import { ok } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Q1–Q10 discovery coverage plus the Phase 3 questionnaire result. */
export async function GET() {
  const [questions, survey] = await Promise.all([loadResearchQuestions(), loadSurveySummary()]);

  return ok({
    discoveryQuestions: questions,
    primaryResearch: survey
      ? {
          respondents: survey.respondents,
          window: survey.window,
          mainBarriers: survey.mainBarriers,
          unlock: survey.unlock,
          segment: survey.segment
        }
      : null,
    note: "Discovery questions come from themes.json; primary research comes from the Phase 3 questionnaire."
  });
}
