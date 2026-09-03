# Phase 5 — Wishlist Decision Coach MVP

Publicly testable experience for the problem locked in Phase 4: finish a judgement on a
shortlist. Primary job is **Decide** (side-by-side compare). Secondary is **Resolve** (fit and
quality from other shoppers). The missing surface the questionnaire named is **value confidence**
— "is this a fair price, and should I decide now?" — answered with cost-per-wear and review
evidence, never with a discount.

Lives in its own folder, same convention as `phase-2/` and `phase-4/`. Nothing here restates the
problem; `/api/problem-definition` serves `phase-4/data/problem-definition.json` verbatim.

## Run

```bash
# from repo root
npm run phase5:setup
npm run phase5:dev
npm run phase5:test

# or
cd phase-5
cp .env.example .env
npm install
npm run backend:setup
npm run dev
```

Then:

| URL | What |
|-----|------|
| http://localhost:3100/mvp | Shortlist room — Priya, Rohit (sale-watcher), Aisha (already converting). Eligibility + contract check sit on this page. |
| http://localhost:3100/mvp?user=user-sale-watcher | Same room, Rohit selected |
| http://localhost:3100/mvp?embed=1 | Same room without Phase 5 chrome — used inside Studio `/studio?view=coach` |
| http://localhost:3100/dashboard | Funnel (W2P labelled as a proxy) |
| http://localhost:3100/playground | Discovery artefacts + Phase 4 lock |
| http://localhost:3100/api/health | DB, discovery, problem lock, LLM tier |

Phase 1 storefront stays on :3000. The coach also lives as a Studio tab:
`http://localhost:3000/studio?view=coach` (needs this server on :3100).

## What 5a–5f shipped

| Slice | In this folder |
|-------|----------------|
| **5a** | Next.js 15 + Prisma 6 + three seed personas. Coach is withheld from the S3 control. |
| **5b** | 16 SKU catalog; URL ingest allowlisted to `myntra.com`; blocked fetch falls back to catalog. |
| **5c** | `lib/segment.ts` from the Phase 4 contract; fit / style / compare / **value**; Groq → OpenAI → rule-based. |
| **5d** | Events + `/dashboard`. A drop counts as a completed decision. |
| **5e** | Webhook routes behind `x-webhook-secret`. n8n JSON in `workflows/`. Assignment public URL is the Phase-1 storefront on Netlify. |
| **5f** | Vitest under `tests/mvp/unit/` — segment, ingest allowlist, schemas, discount guardrail, funnel. |

## The segment gate

`lib/segment.ts` implements `phase-4/data/segment.contract.ts`. Thresholds are duplicated as
constants and the unit test fails if they drift from `segment-contract.json`.

Sale-watchers (`user-sale-watcher`, tagged S3 only) pass the predicate on paper and are still
blocked: they are a control persona, not the audience. That is a product decision layered on the
contract, so it is a separate function (`isControlPersona`) rather than a hidden extra threshold.

## Forbidden, in code

`lib/guardrails.ts` is applied as a Zod `superRefine` on every coach schema. Copy that mentions a
discount, coupon, EOSS, price drop, or urgency pressure is not valid output. Tests prove it.

## LLM

No key is required. The rule-based engines compute the summaries; an LLM may only rephrase them,
and a rewrite that changes an id, a number, or the schema is discarded. Set `GROQ_API_KEY` or
`OPENAI_API_KEY` in `.env` if you want the rephrase tier.

## Env

See `.env.example`. `DATABASE_URL` points at SQLite (`prisma/dev.db`). Do not commit `.env`.
