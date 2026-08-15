# Phase 2 — Metric decomposition & opportunity ranking

Consumes Phase 1 artefacts and writes a **filled** Part 2 matrix plus a segment/opportunity nomination. Scores are copied from discovery files — missing themes stay `unobserved`.

## Run

```bash
# from repo root
npm run phase2:rank
npm run phase2:test

# or
cd phase-2
npm install
npm test
npm run rank
```

Storefront: **http://localhost:3000/?tab=ranking** (Studio → What to focus on)

## Reads

- `Phase-1/data/discovery/opportunity-ranking.json` (required — A-M01)
- `Phase-1/data/discovery/themes.json`
- `Phase-1/data/discovery/pipeline-stats.json`

## Writes

| File | Content |
|------|---------|
| `data/filled-matrix.json` | Part 2 template + extra engine themes |
| `data/nomination.json` | Opportunity, segment, interview seeds |
| `data/metric-tree.json` | Revisit × resolve × decide → act coverage |
| `data/phase2-stats.json` | Counts and `readyForPhase3` |
| `data/report.html` | Reviewer report |
| `data/problemstatement-snippet.md` | Table to paste into `docs/problemstatement.md` |

## Rules (from architecture)

- Matrix cells come from Phase 1 files only. Empty cells are **not** guessed.
- Groq theme ids (e.g. `fit-and-size-uncertainty`) map onto the Part 2 template by id, barrier, and keywords.
- Price-drop / sale alerts stay **excluded**. A #1 price theme is flagged, never nominated.
- S2 ∩ S4 is used only if ranking shows both fit (Resolve) and compare (Decide).
- `readyForPhase3` is true only if a non-monetary winner exists **and** Phase 1 `readyForPhase2` is true.
