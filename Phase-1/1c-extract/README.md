# Phase 1c — extract, validate, rank

LLM (Groq / OpenAI) or rule-based fallback. Quote-linked themes. Score = 0.4 impact + 0.4 feasibility + 0.2 frequency.

Implementation: `analyze.ts`, `validate.ts`, `rank.ts` under [`../tools/discovery-pipeline/src/`](../tools/discovery-pipeline/src/).

```bash
cd Phase-1
npm run 1c        # requires raw-reviews.json from 1b
```

Exit: `themes.json`, `validation-results.json`, `opportunity-ranking.json`.
