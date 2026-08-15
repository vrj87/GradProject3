import type { MatrixRow, MetricTree, Nomination, PipelineStats } from "./types.js";

export function renderPhase2Report(
  matrix: MatrixRow[],
  nomination: Nomination,
  stats: PipelineStats,
  tree: MetricTree
): string {
  const rows = matrix
    .map(
      (row) =>
        `<tr class="${row.status}"><td>${esc(row.opportunityArea)}</td><td>${row.impactOnW2P}</td><td>${esc(String(row.feasibility))}</td><td>${esc(String(row.evidenceStrength))}</td><td>${row.frequency}</td><td>${row.metricNode}</td><td>${row.rank}</td><td>${row.status}</td></tr>`
    )
    .join("");

  const nodeRows = tree.nodes
    .map(
      (node) =>
        `<tr><td>${node.node}</td><td>${esc(node.definition)}</td><td>${node.covered ? "yes" : "gap"}</td><td>${esc(node.labels.join(", ") || "—")}</td></tr>`
    )
    .join("");

  const seeds = nomination.interviewSeeds
    .map(
      (seed) =>
        `<li><strong>Q${seed.briefQuestion}.</strong> ${esc(seed.prompt)} <small>themes: ${esc(seed.linkedThemeIds.join(", ") || "—")}</small></li>`
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Phase 2 — Opportunity ranking</title>
  <style>
    body { font-family: Georgia, serif; max-width: 980px; margin: 2rem auto; color: #1a1a1a; }
    table { border-collapse: collapse; width: 100%; font-size: 14px; }
    th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
    .ok { color: #0b6; } .warn { color: #b60; }
    tr.excluded { background: #f6f6f6; color: #666; }
    tr.unobserved { background: #fff8e8; }
    small { color: #555; }
  </style>
</head>
<body>
  <h1>Phase 2 — Metric decomposition + ranking</h1>
  <p>Filled from Phase 1 <code>opportunity-ranking.json</code>. Extraction: ${esc(stats.extractionMethod)}. Unobserved cells were not guessed.</p>
  <p class="${nomination.readyForPhase3 ? "ok" : "warn"}">readyForPhase3: ${nomination.readyForPhase3} · Phase 1 readyForPhase2: ${stats.readyForPhase2}</p>
  <h2>What must change</h2>
  <p>${esc(tree.northStar)}</p>
  <p><strong>Product:</strong> ${esc(tree.product)}</p>
  <p><strong>Constraint:</strong> ${esc(tree.constraint)}</p>
  <table>
    <thead><tr><th>Node</th><th>Definition</th><th>Covered</th><th>Themes</th></tr></thead>
    <tbody>${nodeRows}</tbody>
  </table>
  <h2>Nomination</h2>
  <ul>
    <li><strong>Highest-potential opportunity:</strong> ${esc(nomination.highestPotentialOpportunity)}</li>
    <li><strong>Interview segment:</strong> ${esc(nomination.interviewSegment)}</li>
    <li><strong>Rationale:</strong> ${esc(nomination.segmentRationale)}</li>
    <li><strong>Sub-metrics moved:</strong> ${esc(nomination.subMetricsMoved.join("; "))}</li>
    <li><strong>Not pursuing:</strong> ${esc(nomination.explicitlyNotPursuing.join("; "))}</li>
  </ul>
  ${nomination.caveats.length ? `<p class="warn">${esc(nomination.caveats.join(" "))}</p>` : ""}
  <h2>Filled matrix</h2>
  <table>
    <thead><tr><th>Opportunity</th><th>Impact</th><th>Feasibility</th><th>Evidence</th><th>Freq</th><th>Node</th><th>Rank</th><th>Status</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <h2>Phase 3 interview seeds (brief 8)</h2>
  <ol>${seeds}</ol>
</body>
</html>`;
}

export function renderProblemstatementSnippet(
  matrix: MatrixRow[],
  nomination: Nomination
): string {
  const lines = matrix.map((row) => {
    const freq = typeof row.frequency === "number" ? String(row.frequency) : row.frequency;
    return `| ${row.opportunityArea} | ${row.impactOnW2P} | ${row.feasibility} | ${row.evidenceStrength} | ${freq} | ${row.metricNode} | ${row.rank} |`;
  });

  return `### 2.3 Opportunity ranking (filled from Phase 1)

Do **not** treat empty cells as guesses. Copied from \`opportunity-ranking.json\` via \`phase-2/\`.

| Opportunity area | Impact on W2P 30d | Feasibility (no incentives) | Evidence strength | Frequency | Maps to node | Rank |
|------------------|-------------------|----------------------------|-------------------|-----------|--------------|------|
${lines.join("\n")}

**Phase 2 decision (from \`phase-2/data/nomination.json\`):**

- Highest-potential opportunity: **${nomination.highestPotentialOpportunity}**
- Interview segment: **${nomination.interviewSegment}** — ${nomination.segmentRationale}
- Explicitly not pursuing: ${nomination.explicitlyNotPursuing[0] ?? "Price-drop / sale alerts"}
- readyForPhase3: **${nomination.readyForPhase3}**
${nomination.caveats.map((caveat) => `- Caveat: ${caveat}`).join("\n")}
`;
}

function esc(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
