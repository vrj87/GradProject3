# GradProject3

Myntra Wishlist-to-Purchase (W2P 30d) graduation project — AI-powered discovery engine plus a Myntra-themed demo storefront.

## Quick start

```bash
cd Phase-1
npm install
npm run dev
```

Open [http://localhost:3000/](http://localhost:3000/) for the storefront. Use `/studio` for live scrape insights and data download.

## Structure

| Path | Description |
|------|-------------|
| `Phase-1/` | Discovery pipeline (1a–1d), storefront app, scrape artefacts |
| `phase-2/` | Metric matrix and opportunity nomination |
| `docs/` | Architecture, problem statement, edge cases |

## Root scripts

```bash
npm run dev              # Phase-1 storefront (port 3000)
npm run phase1:refresh   # Full scrape + pipeline
npm run phase2:rank      # Phase-2 ranking
npm test                 # Phase-1 + Phase-2 tests
```
