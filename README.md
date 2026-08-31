# GradProject3

Myntra Wishlist-to-Purchase (W2P 30d) — AI discovery engine (Phase 1) and opportunity ranking (Phase 2).

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
2. **The bet** — why this room, scored in the open
3. **Live voices** — public App Store / Play Store comments
4. **Shopper stories** — ranked themes + quotes
5. **Q1–Q10 / What to focus on / What we'd ask** — coverage, nomination, interview seeds + [questionnaire](https://docs.google.com/forms/d/e/1FAIpQLScmH7Z4FoFH7Y4XzsaMIR2prioWoh6AuHQVxfptRc3qmEzMZQ/viewform)

## Structure

| Path | Description |
|------|-------------|
| `Phase-1/` | **Canonical** discovery engine (1a–1d), storefront, artefacts |
| `phase-2/` | Metric tree + filled matrix + interview nomination |
| `docs/` | Architecture, problem statement, edge cases |

## Root scripts

```bash
npm run dev              # Phase-1 storefront (port 3000)
npm run phase1:refresh   # Full scrape + pipeline
npm run phase2:rank      # Phase-2 ranking
npm test                 # Phase-1 + Phase-2 tests
```
