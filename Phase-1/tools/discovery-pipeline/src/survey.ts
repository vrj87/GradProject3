import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  SURVEY_QUESTIONS,
  barrierKind,
  engineRoot,
  normalizeResponses,
  readXlsxRows,
  summarizeSurvey,
  unlockLever,
  type SurveyResponse
} from "@myntra/discovery-core";

/**
 * Turns the Google Form export into Phase 3 artefacts. Run it again after new
 * responses arrive; nothing downstream hand-copies a number.
 *
 *   npm run survey            # from Phase-1
 */

const DEFAULT_WORKBOOK = path.join(engineRoot(), "..", "docs", "grad3 survey response.xlsx");

/**
 * Written twice: the artefact copy for reviewers, and the storefront's public
 * copy so the results page can serve them without anyone needing access to the
 * private Google sheet.
 */
function outputDirs(): string[] {
  return [
    path.join(engineRoot(), "data", "survey"),
    path.join(engineRoot(), "apps", "storefront", "public", "survey")
  ];
}

function notesDir(): string {
  return path.join(engineRoot(), "..", "docs", "research", "interview-notes");
}

/**
 * One anonymized record per participant, written from the export rather than
 * summarised by hand — Phase 3 forbids inventing participant material, and
 * generating the notes makes that guarantee mechanical.
 */
function noteFor(response: SurveyResponse, inSegment: boolean): string {
  const answer = (id: number) => response.answers[id]?.join(", ") ?? "—";
  const submitted = new Date(response.submittedAt);
  const day = Number.isNaN(submitted.getTime())
    ? response.submittedAt
    : submitted.toISOString().slice(0, 10);

  const lines = [
    `# Participant ${response.id.toUpperCase()}`,
    "",
    "> Anonymized questionnaire record. No name, email, or contact detail was collected.",
    `> Generated from the form export by \`npm run survey\` — do not edit by hand.`,
    "",
    `- **Submitted:** ${day}`,
    `- **Screening:** ${answer(1)} · shops ${answer(2).toLowerCase()} · uses a wishlist: ${answer(3)}`,
    `- **Saved items:** ${answer(4)} · **buys what they save:** ${answer(5)}`,
    `- **Last unbought save:** ${answer(6)}`,
    `- **In P1 staller segment:** ${inSegment ? "yes" : "no"}`,
    "",
    "## What they said",
    "",
    `- **Why they save (Q7):** ${answer(7)}`,
    `- **Main reason a save went unbought (Q8):** ${answer(8)} — classified \`${barrierKind(
      response.answers[8]?.[0] ?? ""
    )}\``,
    `- **Confidence it was right for them (Q9):** ${answer(9)}`,
    `- **Uncertain about (Q10):** ${answer(10)}`,
    `- **Does before buying (Q11):** ${answer(11)}`,
    `- **One thing that would unlock the purchase (Q12):** ${answer(12)} — lever \`${unlockLever(
      response.answers[12]?.[0] ?? ""
    )}\``,
    `- **Help they want while deciding (Q13):** ${answer(13)}`,
    `- **Usefulness of an AI wishlist verdict (Q14):** ${answer(14)}`,
    ""
  ];

  return lines.join("\n");
}

async function writeNotes(responses: SurveyResponse[], inSegmentIds: string[]): Promise<void> {
  const dir = notesDir();
  await mkdir(dir, { recursive: true });

  const index = [
    "# Anonymized participant records",
    "",
    `${responses.length} participants answered the questionnaire in`,
    "[`docs/research/interview-guide.md`](../interview-guide.md).",
    "Screening criteria and disqualifiers are in [`screener.md`](../screener.md).",
    "",
    "Every file here is generated from the form export by `npm run survey`, so the records",
    "cannot drift from the responses and no participant material is authored by us.",
    "",
    "| Record | Uses wishlist | Buys what they save | Main barrier | In segment |",
    "|---|---|---|---|---|",
    ...responses.map((response) => {
      const barrier = barrierKind(response.answers[8]?.[0] ?? "");
      return `| [${response.id.toUpperCase()}](./${response.id}.md) | ${
        response.answers[3]?.[0] ?? "—"
      } | ${response.answers[5]?.[0] ?? "—"} | ${barrier} | ${
        inSegmentIds.includes(response.id) ? "yes" : "no"
      } |`;
    }),
    ""
  ].join("\n");

  await writeFile(path.join(dir, "README.md"), index, "utf8");
  for (const response of responses) {
    await writeFile(
      path.join(dir, `${response.id}.md`),
      noteFor(response, inSegmentIds.includes(response.id)),
      "utf8"
    );
  }
}

export async function buildSurveyArtefacts(workbook = DEFAULT_WORKBOOK): Promise<void> {
  const rows = readXlsxRows(await readFile(workbook));
  const responses = normalizeResponses(rows);
  if (!responses.length) throw new Error(`no responses found in ${workbook}`);

  const summary = summarizeSurvey(responses);
  const dirs = outputDirs();
  const dir = dirs[0]!;

  for (const target of dirs) {
    await mkdir(target, { recursive: true });
    await writeFile(
      path.join(target, "survey-responses.json"),
      JSON.stringify(responses, null, 2),
      "utf8"
    );
    await writeFile(
      path.join(target, "survey-summary.json"),
      JSON.stringify(summary, null, 2),
      "utf8"
    );
  }

  await writeNotes(responses, summary.segment.inSegmentIds);

  const stalls = summary.segment;
  console.log(`survey: ${summary.respondents} responses → ${dirs.length} locations (${dir}, …)`);
  console.log(`  notes: ${summary.respondents} anonymized records → ${notesDir()}`);
  console.log(
    `  main barrier: ${summary.mainBarriers
      .map((row) => `${row.kind} ${row.count}`)
      .join(", ")}`
  );
  console.log(
    `  unlock: information ${summary.unlock.information}, monetary ${summary.unlock.monetary}`
  );
  console.log(
    `  wishlist users ${stalls.usesWishlist}, stalling savers ${stalls.stalls}, in P1 segment ${stalls.inSegment}`
  );
}

const invokedDirectly = process.argv[1]
  ? import.meta.url === new URL(`file://${process.argv[1]}`).href ||
    process.argv[1].endsWith("survey.ts")
  : false;

if (invokedDirectly) {
  buildSurveyArtefacts(process.argv[2] ? path.resolve(process.argv[2]) : undefined).catch(
    (error: unknown) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    }
  );
}
