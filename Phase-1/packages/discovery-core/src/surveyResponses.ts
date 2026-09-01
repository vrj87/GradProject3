import { SURVEY_QUESTIONS, type SurveyRole } from "./survey.js";

/**
 * Real answers from the Google Form export. Everything here is derived from the
 * sheet at read time: no counts are typed by hand, so the artefacts and the
 * write-up cannot drift from the responses.
 */

export interface SurveyResponse {
  id: string;
  submittedAt: string;
  answers: Record<number, string[]>;
}

/** Checkbox questions arrive as one comma-joined string per respondent. */
export const MULTI_SELECT_QUESTION_IDS = [1, 7, 10, 11] as const;

/** Sliders. The export carries the number but not the scale bounds. */
export const SCALE_QUESTION_IDS = [9, 14] as const;

function isMulti(id: number): boolean {
  return (MULTI_SELECT_QUESTION_IDS as readonly number[]).includes(id);
}

function isScale(id: number): boolean {
  return (SCALE_QUESTION_IDS as readonly number[]).includes(id);
}

function comparable(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/**
 * Maps each question to its column. Header text is matched first so a reordered
 * export still lands correctly; column order is only a fallback.
 */
export function mapColumns(header: string[]): Map<number, number> {
  const columns = new Map<number, number>();
  const seen = new Set<number>();

  for (const question of SURVEY_QUESTIONS) {
    const wanted = comparable(question.text);
    const at = header.findIndex(
      (cell, index) => !seen.has(index) && comparable(cell) === wanted
    );
    if (at >= 0) {
      columns.set(question.id, at);
      seen.add(at);
    }
  }

  for (const question of SURVEY_QUESTIONS) {
    if (columns.has(question.id)) continue;
    const fallback = question.id; // column 0 is the form timestamp
    if (fallback < header.length && !seen.has(fallback)) {
      columns.set(question.id, fallback);
      seen.add(fallback);
    }
  }

  return columns;
}

function toIso(stamp: string): string {
  const parsed = new Date(stamp);
  return Number.isNaN(parsed.getTime()) ? stamp : parsed.toISOString();
}

/** Option labels in this form contain no commas, so ", " is a safe separator. */
function splitAnswer(raw: string, multi: boolean): string[] {
  const value = raw.trim();
  if (!value) return [];
  return multi ? value.split(/,\s+/).map((part) => part.trim()).filter(Boolean) : [value];
}

export function normalizeResponses(rows: string[][]): SurveyResponse[] {
  const [header, ...body] = rows;
  if (!header) return [];
  const columns = mapColumns(header);

  return body
    .filter((row) => row.some((cell) => cell.trim().length > 0))
    .map((row, index) => {
      const answers: Record<number, string[]> = {};
      for (const question of SURVEY_QUESTIONS) {
        const at = columns.get(question.id);
        const raw = at === undefined ? "" : row[at] ?? "";
        const value = splitAnswer(raw, isMulti(question.id));
        if (value.length) answers[question.id] = value;
      }
      return {
        id: `r${String(index + 1).padStart(2, "0")}`,
        submittedAt: toIso(row[0] ?? ""),
        answers
      };
    });
}

export interface AnswerTally {
  answer: string;
  count: number;
}

export function tally(responses: SurveyResponse[], questionId: number): AnswerTally[] {
  const counts = new Map<string, number>();
  for (const response of responses) {
    for (const answer of response.answers[questionId] ?? []) {
      counts.set(answer, (counts.get(answer) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([answer, count]) => ({ answer, count }))
    .sort((a, b) => b.count - a.count || a.answer.localeCompare(b.answer));
}

export function answered(responses: SurveyResponse[], questionId: number): number {
  return responses.filter((response) => (response.answers[questionId] ?? []).length > 0).length;
}

/**
 * The assignment forbids monetary incentives as the core lever, so Q12 is split
 * on exactly that line: a discount is an incentive, everything else is
 * information the shopper was missing.
 */
export type Lever = "monetary" | "information";

export function unlockLever(answer: string): Lever {
  return /price drop|discount|coupon|sale/i.test(answer) ? "monetary" : "information";
}

export type BarrierKind = "price" | "quality" | "fit" | "timing" | "undecided" | "other";

/** Q8, the single main reason a wishlisted item went unbought. */
export function barrierKind(answer: string): BarrierKind {
  if (/expensive|discount|price/i.test(answer)) return "price";
  if (/quality/i.test(answer)) return "quality";
  if (/size|fit/i.test(answer)) return "fit";
  if (/occasion|need it/i.test(answer)) return "timing";
  if (/deciding|unsure|not sure whether i want/i.test(answer)) return "undecided";
  return "other";
}

/** Q5 answers that describe someone whose saves usually stall. */
const STALLING_PURCHASE_RATES = ["Almost never", "Sometimes"];

export interface SegmentSplit {
  usesWishlist: number;
  stalls: number;
  /** Uses a wishlist and rarely converts — the P1 Wishlist Staller. */
  inSegment: number;
  inSegmentIds: string[];
}

export function segmentSplit(responses: SurveyResponse[]): SegmentSplit {
  const uses = (response: SurveyResponse) => response.answers[3]?.[0] === "Yes";
  const stalls = (response: SurveyResponse) =>
    STALLING_PURCHASE_RATES.includes(response.answers[5]?.[0] ?? "");
  const inSegment = responses.filter((response) => uses(response) && stalls(response));

  return {
    usesWishlist: responses.filter(uses).length,
    stalls: responses.filter(stalls).length,
    inSegment: inSegment.length,
    inSegmentIds: inSegment.map((response) => response.id)
  };
}

export interface ScaleSummary {
  id: number;
  text: string;
  values: number[];
  mean: number;
  min: number;
  max: number;
}

export function scaleSummary(responses: SurveyResponse[], questionId: number): ScaleSummary {
  const question = SURVEY_QUESTIONS.find((item) => item.id === questionId);
  const values = responses
    .map((response) => Number(response.answers[questionId]?.[0]))
    .filter((value) => Number.isFinite(value));
  const total = values.reduce((sum, value) => sum + value, 0);

  return {
    id: questionId,
    text: question?.text ?? `Q${questionId}`,
    values,
    mean: values.length ? Number((total / values.length).toFixed(2)) : 0,
    min: values.length ? Math.min(...values) : 0,
    max: values.length ? Math.max(...values) : 0
  };
}

export interface QuestionSummary {
  id: number;
  text: string;
  role: SurveyRole;
  multiSelect: boolean;
  answered: number;
  tallies: AnswerTally[];
}

export interface SurveySummary {
  respondents: number;
  window: { from: string; to: string };
  questions: QuestionSummary[];
  /** Q8 grouped by the kind of doubt behind it. */
  mainBarriers: Array<{ kind: BarrierKind; count: number }>;
  /** Q12 split against the no-incentive constraint. */
  unlock: { monetary: number; information: number };
  segment: SegmentSplit;
  scales: ScaleSummary[];
  generatedAt: string;
}

export function summarizeSurvey(
  responses: SurveyResponse[],
  now = new Date()
): SurveySummary {
  const stamps = responses.map((response) => response.submittedAt).sort();
  const barrierCounts = new Map<BarrierKind, number>();
  for (const response of responses) {
    const answer = response.answers[8]?.[0];
    if (!answer) continue;
    const kind = barrierKind(answer);
    barrierCounts.set(kind, (barrierCounts.get(kind) ?? 0) + 1);
  }

  const unlock = { monetary: 0, information: 0 };
  for (const response of responses) {
    const answer = response.answers[12]?.[0];
    if (!answer) continue;
    unlock[unlockLever(answer)] += 1;
  }

  return {
    respondents: responses.length,
    window: { from: stamps[0] ?? "", to: stamps.at(-1) ?? "" },
    questions: SURVEY_QUESTIONS.map((question) => ({
      id: question.id,
      text: question.text,
      role: question.role,
      multiSelect: isMulti(question.id),
      answered: answered(responses, question.id),
      tallies: tally(responses, question.id)
    })),
    mainBarriers: [...barrierCounts.entries()]
      .map(([kind, count]) => ({ kind, count }))
      .sort((a, b) => b.count - a.count),
    unlock,
    segment: segmentSplit(responses),
    scales: SCALE_QUESTION_IDS.map((id) => scaleSummary(responses, id)),
    generatedAt: now.toISOString()
  };
}

export { isMulti as isMultiSelectQuestion, isScale as isScaleQuestion };
