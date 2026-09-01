import type { ProblemDefinition, Signals } from "./types.js";

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const FIELD_ORDER = [
  "targetSegment",
  "productOutcome",
  "rootCause",
  "workarounds",
  "userValue",
  "businessValue"
] as const;

export function renderPhase4Report(problem: ProblemDefinition, signals: Signals): string {
  const fields = FIELD_ORDER.map((key) => {
    const field = problem.fields[key];
    const evidence = field.evidence
      .map((ref) => `<li><code>${esc(ref.source)}:${esc(ref.ref)}</code> — ${esc(ref.detail)}</li>`)
      .join("");
    const caveats = field.caveats.map((note) => `<li>${esc(note)}</li>`).join("");
    return `<section>
  <h3>${esc(field.field)}</h3>
  <p>${esc(field.statement)}</p>
  <details open><summary>Evidence</summary><ul>${evidence}</ul></details>
  ${caveats ? `<details><summary>Caveats</summary><ul class="warn">${caveats}</ul></details>` : ""}
</section>`;
  }).join("");

  const branches = problem.decisionTree.verdicts
    .map(
      (verdict) =>
        `<tr class="${verdict.terminal ? "stop" : verdict.fired ? "fired" : ""}"><td>${esc(verdict.branch)}</td><td>${verdict.fired ? "fired" : "did not fire"}</td><td>${verdict.terminal ? "terminal" : "—"}</td><td><ul>${verdict.because.map((line) => `<li>${esc(line)}</li>`).join("")}</ul></td></tr>`
    )
    .join("");

  const chain = problem.evolutionChain.steps
    .map(
      (step) =>
        `<li><strong>${esc(step.stage)}</strong> <small>via ${esc(step.via)}</small><br />${esc(step.value)}</li>`
    )
    .join("");

  const switchRows = signals.unlockSwitch.perRespondent
    .map(
      (row) =>
        `<tr><td>${esc(row.id)}</td><td>${esc(row.unlock)}</td><td>${esc(row.help)}</td><td>${row.researches ? "yes" : "no"}</td></tr>`
    )
    .join("");

  const workaroundRows = signals.workarounds
    .map(
      (row) =>
        `<tr class="${row.offApp ? "offapp" : ""}"><td>${esc(row.behaviour)}</td><td>${row.count}/${row.of}</td><td>${row.offApp ? "leaves the app" : "in app"}</td></tr>`
    )
    .join("");

  const ok = problem.readyForPhase5;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Phase 4 — Problem definition</title>
  <style>
    body { font-family: Georgia, serif; max-width: 980px; margin: 2rem auto; color: #1a1a1a; line-height: 1.5; }
    table { border-collapse: collapse; width: 100%; font-size: 14px; margin: 1rem 0; }
    th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; vertical-align: top; }
    .ok { color: #0b6; } .warn { color: #b60; } .stop { background: #ffecec; }
    tr.fired { background: #f2f8ff; }
    tr.offapp { color: #666; }
    section { border-top: 1px solid #eee; padding-top: .5rem; }
    small { color: #555; }
    code { background: #f4f4f4; padding: 0 3px; }
    blockquote { border-left: 3px solid #ddd; margin-left: 0; padding-left: 1rem; color: #444; }
  </style>
</head>
<body>
  <h1>Phase 4 — Problem definition</h1>
  <p><strong>${esc(problem.headline)}</strong></p>
  <p>North star: ${esc(problem.northStar)} · Constraint: ${esc(problem.constraint)}</p>
  <p class="${ok ? "ok" : "warn"}">outcome: <strong>${esc(problem.decisionTree.outcome)}</strong> · readyForPhase5: ${ok} · exit criteria met: ${problem.exitCriteria.met}</p>
  <p><small>n = ${signals.respondents} responses, ${esc(signals.window.from.slice(0, 10))} to ${esc(signals.window.to.slice(0, 10))} · generated ${esc(problem.generatedAt)}</small></p>

  <h2>The six required fields</h2>
  ${fields}

  <h2>Decision tree</h2>
  <table>
    <thead><tr><th>Branch</th><th>Verdict</th><th>Terminal</th><th>Because</th></tr></thead>
    <tbody>${branches}</tbody>
  </table>
  <p><strong>Instruction:</strong> ${esc(problem.decisionTree.rescopeInstruction)}</p>
  <p><strong>Constraint conflict:</strong> ${esc(problem.decisionTree.constraintConflict.statement)}<br />
  ${problem.decisionTree.constraintConflict.navigableBecause ? `Navigable because ${esc(problem.decisionTree.constraintConflict.navigableBecause)}` : `<span class="warn">No escape hatch on this data.</span>`}</p>
  <p><strong>Required surfaces:</strong> ${problem.decisionTree.requiredSurfaces.map((s) => esc(s)).join(" · ")}</p>
  <p><strong>Forbidden:</strong> ${problem.decisionTree.forbidden.map((s) => esc(s)).join(" · ")}</p>

  <h2>Why price reads as a symptom</h2>
  <table>
    <thead><tr><th>Respondent</th><th>Q12 unlock</th><th>Q13 help</th><th>Researches (Q11)</th></tr></thead>
    <tbody>${switchRows}</tbody>
  </table>
  <p><small>${esc(signals.unlockSwitch.tautologyNote)}</small></p>

  <h2>Existing workarounds</h2>
  <table>
    <thead><tr><th>Behaviour</th><th>Respondents</th><th>Where</th></tr></thead>
    <tbody>${workaroundRows}</tbody>
  </table>

  <h2>Evolution chain</h2>
  <ol>${chain}</ol>

  <h2>Segment contract <small>(interface only — ${esc(problem.segmentContract.implementedIn)})</small></h2>
  <pre><code>${esc(problem.segmentContract.source)}</code></pre>
  <ul>${problem.segmentContract.derivation.map((line) => `<li>${esc(line)}</li>`).join("")}</ul>

  <h2>Quotes</h2>
  <p class="warn">${esc(problem.quotes.reason)}</p>
  <p><small>${problem.quotes.liveCount} live review verbatims available, ${problem.quotes.illustrativeCount} illustrative fixtures excluded from evidence.</small></p>
  ${problem.quotes.liveQuotes
    .map(
      (quote) =>
        `<blockquote>${esc(quote.text.slice(0, 240))}<br /><small>${esc(quote.source)} · ${esc(quote.reviewId)}</small></blockquote>`
    )
    .join("")}

  <h2>How to falsify this lock</h2>
  <table>
    <thead><tr><th>Claim</th><th>Falsified by</th></tr></thead>
    <tbody>${problem.falsification.map((row) => `<tr><td>${esc(row.claim)}</td><td>${esc(row.falsifiedBy)}</td></tr>`).join("")}</tbody>
  </table>

  ${problem.caveats.length ? `<h2>Caveats</h2><ul class="warn">${problem.caveats.map((note) => `<li>${esc(note)}</li>`).join("")}</ul>` : ""}
</body>
</html>`;
}

/** Table for pasting into docs/problem-definition.md, so prose cannot drift from data. */
export function renderProblemSnippet(problem: ProblemDefinition, signals: Signals): string {
  const fields = FIELD_ORDER.map((key) => {
    const field = problem.fields[key];
    return `| **${field.field}** | ${field.statement.replace(/\n/g, " ")} |`;
  }).join("\n");

  const evidence = FIELD_ORDER.flatMap((key) =>
    problem.fields[key].evidence.map(
      (ref) => `| ${problem.fields[key].field} | \`${ref.source}:${ref.ref}\` | ${ref.detail} |`
    )
  ).join("\n");

  return `<!-- Generated by phase-4 (\`npm run phase4:lock\`). Do not hand-edit. -->

# Phase 4 — generated lock

n = ${signals.respondents} · window ${signals.window.from.slice(0, 10)} → ${signals.window.to.slice(0, 10)} · generated ${problem.generatedAt}

**${problem.headline}**

## Six required fields

| Field | Locked statement |
|-------|------------------|
${fields}

## Evidence index

| Field | Ref | Detail |
|-------|-----|--------|
${evidence}

## Decision tree

${problem.decisionTree.verdicts
  .map(
    (verdict) =>
      `- **${verdict.branch}** — ${verdict.fired ? "fired" : "did not fire"}${verdict.terminal ? " (terminal)" : ""}\n${verdict.because.map((line) => `  - ${line}`).join("\n")}`
  )
  .join("\n")}

**Outcome: ${problem.decisionTree.outcome}** · incentive MVP allowed: ${problem.decisionTree.incentiveMvpAllowed} · readyForPhase5: ${problem.readyForPhase5}

${problem.decisionTree.rescopeInstruction}

## Evolution chain

\`\`\`
${problem.evolutionChain.steps
  .map((step, index) => `${step.stage}: ${step.value}${index < problem.evolutionChain.steps.length - 1 ? `\n  ↓ ${problem.evolutionChain.steps[index + 1]?.via}` : ""}`)
  .join("\n")}
\`\`\`

## Exit criteria

| Criterion | Met |
|-----------|-----|
| Six fields filled | ${problem.exitCriteria.sixFieldsFilled} |
| Evolution chain complete | ${problem.exitCriteria.evolutionChainComplete} |
| Decision tree recorded | ${problem.exitCriteria.decisionTreeRecorded} |
| Incentive MVP ruled out | ${problem.exitCriteria.incentiveMvpAvoided} |

${problem.caveats.length ? `## Caveats\n\n${problem.caveats.map((note) => `- ${note}`).join("\n")}\n` : ""}`;
}
