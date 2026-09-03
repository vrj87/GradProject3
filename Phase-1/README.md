# Phase 1 — AI-Powered Discovery Engine (1a–1d)

Canonical home for assignment **Part 1**. Increments are runnable separately and as a full refresh.

| Increment | What it does | Code | Command |
|-----------|--------------|------|---------|
| **1a** | Types, hash, normalize, dedupe, chunk | `packages/discovery-core/` | `npm run 1a` |
| **1b** | Live scrapers (App Store, Play Store, Reddit) | `tools/discovery-pipeline/src/scrape/` | `npm run 1b` |
| **1c** | LLM batch extract, quote grounding, validate, rank | `analyze.ts`, `llm.ts`, `validate.ts`, `rank.ts` | `npm run 1c` |
| **1d** | Full workflow + artefacts + storefront | `refresh.ts`, `apps/storefront/` | `npm run 1d` then `npm run dev` |

## Run

```bash
cd Phase-1
npm install
npm test          # 1a + 1c unit tests
npm run 1b        # scrape only
npm run 1a        # normalize existing raw-reviews.json
npm run 1c        # extract + rank from raw
npm run 1d        # 1b → 1a → 1c + report (same as discovery:refresh)
npm run collapse  # merge near-duplicate themes without calling the LLM
npm run dev       # http://localhost:3000
```

From repo root:

```bash
npm run phase1:1a
npm run phase1:1b
npm run phase1:1c
npm run phase1:1d
npm run dev
```

## Artefacts (`data/discovery/`)

`raw-reviews.json` → `normalized-reviews.json` → `chunks.json` → `themes.json` → `validation-results.json` → `opportunity-ranking.json` → `pipeline-stats.json`

Phase 2 reads these files from `Phase-1/data/discovery/`.

### LLM pipeline (1c)

- **Batch extraction:** reviews are chunked and sent to Groq (`llama-3.3-70b-versatile`) or OpenAI (`gpt-4o-mini`) in batches with retry on 429/5xx.
- **Quote grounding:** every quote must match review text; hallucinated quotes are rejected.
- **Hybrid fallback:** rule-based templates merge with LLM output; gap-fill ensures Q1–Q10 coverage.
- **Curated fixtures:** `data/fixtures/seed-reviews.json` supplements live scrapes for reviewer testing.

Set `GROQ_API_KEY` and/or `OPENAI_API_KEY` in `.env` (see `.env.example`).

## Storefront

- Shop: http://localhost:3000
- Studio room: http://localhost:3000/studio?view=room
- Studio coach: http://localhost:3000/studio?view=coach
- Live Insights: http://localhost:3000/studio?view=stories
- Q1–Q10 coverage: http://localhost:3000/studio?view=questions
- Opportunity ranking (Phase 2): http://localhost:3000/studio?view=focus

## Production

Deployed on **Netlify** from the repo root (`netlify.toml` publishes `Phase-1/apps/storefront/dist`). Set `GROQ_API_KEY` in the Netlify site env so `/api/coach/insights` can rephrase; without it the coach stays rule-based.
