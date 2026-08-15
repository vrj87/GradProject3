import type {
  PipelineStats,
  RankedOpportunity,
  Theme
} from "@myntra/discovery-core";

export function renderReport(
  themes: Theme[],
  ranking: RankedOpportunity[],
  stats: PipelineStats
): string {
  const rows = ranking
    .map(
      (row) =>
        `<tr><td>${row.rank}</td><td>${row.label}</td><td>${row.metricNode}</td><td>${row.impactOnW2P}</td><td>${row.nonMonetaryFeasibility}</td><td>${row.estimatedFrequency}</td><td>${row.score}</td><td>${row.priceFlag ? "yes" : ""}</td></tr>`
    )
    .join("");

  const themeBlocks = themes
    .map((theme) => {
      const quotes = theme.quotes
        .map((quote) => `<li>“${escapeHtml(quote.text)}” <small>${quote.source} / ${quote.reviewId}</small></li>`)
        .join("");
      return `<article><h3>${escapeHtml(theme.label)}</h3><p>${escapeHtml(theme.summary)}</p><p><strong>Q:</strong> ${theme.researchQuestionIds.join(", ")} · <strong>node:</strong> ${theme.metricNode} · <strong>segments:</strong> ${theme.segmentHints.join(", ")}</p><ul>${quotes}</ul></article>`;
    })
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Myntra discovery engine — Phase 1</title>
  <style>
    body { font-family: Georgia, serif; max-width: 880px; margin: 2rem auto; color: #1a1a1a; }
    table { border-collapse: collapse; width: 100%; font-size: 14px; }
    th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
    .ok { color: #0b6; } .no { color: #b00; }
    small { color: #555; }
  </style>
</head>
<body>
  <h1>AI discovery engine — ranked opportunities</h1>
  <p>W2P 30d · no monetary incentives · extraction: <strong>${stats.extractionMethod}</strong></p>
  <p class="${stats.readyForPhase2 ? "ok" : "no"}">readyForPhase2: ${stats.readyForPhase2}</p>
  <p>Raw ${stats.rawCount} · normalized ${stats.normalizedCount} · fixtures ${stats.fixtureCount} · validated themes ${stats.validatedThemeCount}</p>
  <p>Q gaps: ${stats.researchQuestionGaps.join(", ") || "none"} · metric node gaps: ${stats.metricNodeGaps.join(", ") || "none"}</p>
  ${stats.llmStats ? `<p>LLM batches: ${stats.llmStats.batchesProcessed} ok / ${stats.llmStats.batchesFailed} failed · gap-fill themes: ${stats.llmStats.gapFillThemes}</p>` : ""}
  <h2>Opportunity ranking</h2>
  <table>
    <thead><tr><th>#</th><th>Theme</th><th>Node</th><th>Impact</th><th>Feasibility</th><th>Freq</th><th>Score</th><th>Price flag</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <h2>Themes and quotes</h2>
  ${themeBlocks}
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
