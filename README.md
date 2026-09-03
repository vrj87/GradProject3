# GradProject3

Myntra Wishlist-to-Purchase (W2P 30d) — AI discovery (Phase 1), ranking (Phase 2), primary
research (Phase 3), locked problem (Phase 4), and the decision-coach MVP (Phase 5).

**The problem, in one line:** the Stalled Shortlister cannot finish a judgement inside the
wishlist — neither *which of these* nor *is it worth the price* — so intent parks on a sale that
may never arrive. Price is the symptom of a missing judgement aid, not a demand for money. Full
evidence and falsification tests in [docs/problem-definition.md](./docs/problem-definition.md).

## Reviewer demo (~60s)

```bash
cd Phase-1
npm install
npm run 1c          # or npm run collapse if artefacts already exist
npm run dev
```

Then from the repo root:

```bash
npm run phase2:rank
```

Open [http://localhost:3000/studio](http://localhost:3000/studio):

1. **The room** — hang two similar saves, tap the body, keep one (price is off)
2. **The coach** — [http://localhost:3000/studio?view=coach](http://localhost:3000/studio?view=coach) — fit, wear, and worth on this wishlist. If `GROQ_API_KEY` is in `Phase-1/.env`, the server rephrases that read through Groq.
3. **The bet** — why this room, scored in the open
4. **Live voices** — public App Store / Play Store comments
5. **Shopper stories** — ranked themes + quotes
6. **Q1–Q10 / What to focus on / What we'd ask** — coverage, nomination, interview seeds + [questionnaire](https://docs.google.com/forms/d/e/1FAIpQLScmH7Z4FoFH7Y4XzsaMIR2prioWoh6AuHQVxfptRc3qmEzMZQ/viewform)

**10-slide PDF:** [docs/myntra-w2p-30d-deck.pdf](./docs/myntra-w2p-30d-deck.pdf) (copy in [docs/slide-deck.md](./docs/slide-deck.md)).

## Production (Netlify)

The public storefront is the Phase-1 Vite app. Config lives in [`netlify.toml`](./netlify.toml).

1. In [Netlify](https://app.netlify.com), **Add new site → Import an existing project** and pick this GitHub repo.
2. Build settings are already in `netlify.toml` (command, publish dir, Node 20, redirects). Do not override them unless you know you need to.
3. **Site configuration → Environment variables** — add `GROQ_API_KEY` (and optionally `OPENAI_API_KEY`, `GROQ_MODEL`). Same names as `Phase-1/.env`. Do not commit keys.
4. Deploy. Studio is `/studio`, coach is `/studio?view=coach`, survey is `/survey`.

Local demo is unchanged: `cd Phase-1 && npm install && npm run dev` → http://localhost:3000/studio

## Structure

| Path | Description |
|------|-------------|
| `Phase-1/` | **Canonical** discovery engine (1a–1d), storefront, artefacts |
| `phase-2/` | Metric tree + filled matrix + interview nomination |
| `docs/research/` | **Phase 3** primary research — instrument, screener, 9 anonymized records, validation matrix, synthesis |
| `phase-4/` | **Phase 4** problem lock, derived from Phases 1–3 artefacts + executable decision tree |
| `phase-5/` | **Phase 5** MVP — shortlist coach on :3100 |
| `docs/problem-definition.md` | Phase 4 prose lock — six fields, evolution chain, decision-tree outcome |
| `docs/myntra-w2p-30d-deck.pdf` | **10-slide assignment deck** |
| `docs/` | Architecture, problem statement, edge cases, research |

## Root scripts

```bash
npm run dev              # Phase-1 storefront (port 3000)
npm run phase1:refresh   # Full scrape + pipeline
npm run phase2:rank      # Phase-2 ranking
npm run phase3:survey    # Phase-3 artefacts from the form export
npm run phase4:lock      # Phase-4 problem lock + decision tree
npm run phase5:setup     # Prisma generate + SQLite seed
npm run phase5:dev       # Phase-5 MVP (port 3100)
npm test                 # Phase-1 + Phase-2 + Phase-4 + Phase-5 tests
```
