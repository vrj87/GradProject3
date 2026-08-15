import type { MatrixRow, Nomination, PipelineStats } from "./types.js";

export function renderPhase2Report(
  matrix: MatrixRow[],
  nomination: Nomination,
  stats: PipelineStats
): string {
  const rows = matrix
    .map(
      (row) =>
        `<tr><td>${esc(row.opportunityArea)}</td><td>${row.impactOnW2P}</td><td>${esc(String(row.feasibility))}</td><td>${esc(String(row.evidenceStrength))}</td><td>${row.frequency}</td><td>${row.metricNode}</td><td>${row.rank}</td><td>${row.status}</td></tr>`
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Phase 2 — Opportunity ranking</title>
  <style>
    body { font-family: Georgia, serif; max-width: 960px; margin: 2rem auto; color: #1a1a1a; }
    table { border-collapse: collapse; width: 100%; font-size: 14px; }
    th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
    .ok { color: #0b6; } .warn { color: #b60; }
  </style>
</head>
<body>
  <h1>Phase 2 — Metric decomposition + ranking</h1>
  <p>Filled from Phase 1 <code>opportunity-ranking.json</code>. Extraction: ${stats.extractionMethod}.</p>
  <p class="${nomination.readyForPhase3 ? "ok" : "warn"}">readyForPhase3: ${nomination.readyForPhase3}</p>
  <h2>Nomination</h2>
  <ul>
    <li><strong>Highest-potential opportunity:</strong> ${esc(nomination.highestPotentialOpportunity)}</li>
    <li><strong>Interview segment:</strong> ${esc(nomination.interviewSegment)}</li>
    <li><strong>Rationale:</strong> ${esc(nomination.segmentRationale)}</li>
    <li><strong>Not pursuing:</strong> ${esc(nomination.explicitlyNotPursuing.join("; "))}</li>
  </ul>
  <h2>Filled matrix</h2>
  <table>
    <thead><tr><th>Opportunity</th><th>Impact</th><th>Feasibility</th><th>Evidence</th><th>Freq</th><th>Node</th><th>Rank</th><th>Status</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;
}

function esc(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
