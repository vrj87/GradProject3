import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  SURVEY_QUESTIONS,
  barrierKind,
  engineRoot,
  mapColumns,
  normalizeResponses,
  readXlsxRows,
  segmentSplit,
  summarizeSurvey,
  tally,
  unlockLever
} from "../../../packages/discovery-core/src/index.js";

const WORKBOOK = path.join(engineRoot(), "..", "docs", "grad3 survey response.xlsx");

function header(): string[] {
  return ["Timestamp", ...SURVEY_QUESTIONS.map((question) => question.text)];
}

/** Two respondents: one price-led staller, one quality-led converter. */
function fixtureRows(): string[][] {
  return [
    header(),
    [
      "8/28/2026 22:49:40",
      "Myntra",
      "Once every 2–3 months",
      "Yes",
      "1–5",
      "Almost never",
      "1–3 months ago",
      "I want to wait for a better price, I want to compare it with other products",
      "It was too expensive",
      "3",
      "Price/value, Material/fabric",
      "Read customer reviews",
      "Price drop/discount",
      "Understanding whether the price is good",
      "3"
    ],
    [
      "8/29/2026 11:43:44",
      "Myntra, Amazon",
      "Multiple times a month",
      "Yes",
      "More than 50",
      "Almost always",
      "Within the last week",
      "I want to compare it with other products",
      "I wasn't sure about the quality",
      "4",
      "Price/value, Fit, Quality",
      "Read customer reviews, Check size/fit reviews",
      "Better quality information",
      "Understanding product quality",
      "5"
    ]
  ];
}

describe("reading the survey export", () => {
  it("maps every question to a column by its wording", () => {
    const columns = mapColumns(header());
    expect(columns.size).toBe(SURVEY_QUESTIONS.length);
    expect(columns.get(1)).toBe(1);
    expect(columns.get(14)).toBe(14);
  });

  it("still maps questions when the header text is unrecognisable", () => {
    const scrambled = ["Timestamp", ...SURVEY_QUESTIONS.map((question) => `col ${question.id}`)];
    const columns = mapColumns(scrambled);
    expect(columns.get(8)).toBe(8);
  });

  it("splits checkbox answers and leaves single answers whole", () => {
    const [priceLed] = normalizeResponses(fixtureRows());
    expect(priceLed?.answers[7]).toEqual([
      "I want to wait for a better price",
      "I want to compare it with other products"
    ]);
    expect(priceLed?.answers[8]).toEqual(["It was too expensive"]);
    expect(priceLed?.submittedAt).toContain("2026-08-");
  });

  it("counts multi-select answers once per respondent who picked them", () => {
    const responses = normalizeResponses(fixtureRows());
    expect(tally(responses, 10)[0]).toEqual({ answer: "Price/value", count: 2 });
    expect(tally(responses, 11).find((row) => row.answer === "Read customer reviews")?.count).toBe(2);
  });
});

describe("classifying what the answers mean", () => {
  it("separates a discount from information the shopper was missing", () => {
    expect(unlockLever("Price drop/discount")).toBe("monetary");
    expect(unlockLever("Better fit/size information")).toBe("information");
    expect(unlockLever("Knowing whether I should buy now or wait")).toBe("information");
    expect(unlockLever("Easier returns/exchanges")).toBe("information");
  });

  it("groups the main reason a save went unbought", () => {
    expect(barrierKind("It was too expensive")).toBe("price");
    expect(barrierKind("I was waiting for a discount")).toBe("price");
    expect(barrierKind("I wasn't sure about the quality")).toBe("quality");
    expect(barrierKind("I wasn't sure about the size or fit")).toBe("fit");
    expect(barrierKind("I was waiting for the right occasion")).toBe("timing");
    expect(barrierKind("I was still deciding")).toBe("undecided");
  });

  it("counts a wishlist user who rarely converts as in-segment", () => {
    const split = segmentSplit(normalizeResponses(fixtureRows()));
    expect(split.usesWishlist).toBe(2);
    expect(split.inSegment).toBe(1);
    expect(split.inSegmentIds).toEqual(["r01"]);
  });

  it("summarises without inventing a respondent", () => {
    const summary = summarizeSurvey(normalizeResponses(fixtureRows()));
    expect(summary.respondents).toBe(2);
    expect(summary.unlock).toEqual({ monetary: 1, information: 1 });
    expect(summary.questions).toHaveLength(SURVEY_QUESTIONS.length);
    expect(summary.scales.find((scale) => scale.id === 9)?.mean).toBe(3.5);
  });
});

describe("the real workbook", () => {
  it("parses the shipped export and matches the questionnaire", () => {
    const rows = readXlsxRows(readFileSync(WORKBOOK));
    expect(rows[0]?.[1]).toBe(SURVEY_QUESTIONS[0]?.text);

    const responses = normalizeResponses(rows);
    expect(responses.length).toBeGreaterThanOrEqual(9);
    expect(responses.every((response) => response.answers[8]?.length === 1)).toBe(true);
  });

  it("reports price as the leading stated barrier, which the brief bars us from buying off", () => {
    const summary = summarizeSurvey(normalizeResponses(readXlsxRows(readFileSync(WORKBOOK))));
    expect(summary.mainBarriers[0]?.kind).toBe("price");
    // The constraint holds only because more shoppers want information than a discount.
    expect(summary.unlock.information).toBeGreaterThan(summary.unlock.monetary);
  });
});
