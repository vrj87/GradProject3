# Phase 2 — Metric decomposition & opportunity ranking

Consumes Phase 1 artefacts from [`../Phase-1/data/discovery/`](../Phase-1/data/discovery/) and writes a **filled** ranking plus a segment/opportunity nomination. It does not invent scores.

## Run

```bash
# from repo root
npm run phase2:rank

# or
cd phase-2
npm install
npm test
npm run rank
```

Reads:

- `Phase-1/data/discovery/opportunity-ranking.json`
- `Phase-1/data/discovery/themes.json`
- `Phase-1/data/discovery/pipeline-stats.json`

Writes:

- `phase-2/data/filled-matrix.json`
- `phase-2/data/nomination.json`
- `phase-2/data/phase2-stats.json`
- `phase-2/data/report.html`

Storefront tab: **http://localhost:3000/?tab=ranking**

## Rules

- Matrix cells come from Phase 1 files only. Missing themes stay `unobserved`.
- Price-drop / sale alerts stay **excluded**.
- A #1 price theme is flagged, never nominated as the MVP.
- S2 ∩ S4 is used only if ranking shows both fit (Resolve) and compare (Decide).
