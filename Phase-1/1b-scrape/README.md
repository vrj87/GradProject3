# Phase 1b — live scrapers

App Store RSS, Play Store (`google-play-scraper`), Reddit (official JSON + PullPush fallback). Soft-fail per source.

Implementation: [`../tools/discovery-pipeline/src/scrape/`](../tools/discovery-pipeline/src/scrape/).

```bash
cd Phase-1
npm run 1b        # writes data/discovery/raw-reviews.json
```

Exit: at least one live source returns reviews, or coverage is logged in the scrape console.
