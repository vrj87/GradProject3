/**
 * Reads the questionnaire artefacts written by `npm run survey`. Serving our own
 * copy means the results are public to anyone opening the app, rather than
 * gated behind access to the response sheet.
 */

export interface AnswerTally {
  answer: string;
  count: number;
}

export interface SurveyQuestionSummary {
  id: number;
  text: string;
  role: "screen" | "evidence" | "survey-only";
  multiSelect: boolean;
  answered: number;
  tallies: AnswerTally[];
}

export interface SurveyScale {
  id: number;
  text: string;
  values: number[];
  mean: number;
  min: number;
  max: number;
}

export interface SurveySummary {
  respondents: number;
  window: { from: string; to: string };
  questions: SurveyQuestionSummary[];
  mainBarriers: Array<{ kind: string; count: number }>;
  unlock: { monetary: number; information: number };
  segment: {
    usesWishlist: number;
    stalls: number;
    inSegment: number;
    inSegmentIds: string[];
  };
  scales: SurveyScale[];
  generatedAt: string;
}

export interface SurveyResponse {
  id: string;
  submittedAt: string;
  answers: Record<string, string[]>;
}

export interface SurveyPayload {
  summary: SurveySummary;
  responses: SurveyResponse[];
}

async function readJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    if (!(res.headers.get("content-type") ?? "").includes("json")) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function loadSurvey(): Promise<SurveyPayload | null> {
  const [summary, responses] = await Promise.all([
    readJson<SurveySummary>("/survey/survey-summary.json"),
    readJson<SurveyResponse[]>("/survey/survey-responses.json")
  ]);
  if (!summary) return null;
  return { summary, responses: responses ?? [] };
}

export function formatWindow(window: { from: string; to: string }): string {
  const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
  const from = new Date(window.from);
  const to = new Date(window.to);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return "";
  const fromLabel = from.toLocaleDateString("en-IN", options);
  const toLabel = to.toLocaleDateString("en-IN", options);
  return fromLabel === toLabel ? fromLabel : `${fromLabel} – ${toLabel}`;
}
