# Phase 1a — discovery-core

Normalize, hash, dedupe, chunk. Implementation: [`../packages/discovery-core/`](../packages/discovery-core/).

```bash
cd Phase-1
npm test          # includes normalize tests
npm run 1a        # normalize + chunk data/discovery/raw-reviews.json
```

Exit: unit tests for hash, min-word, keyword gate; `normalized-reviews.json` + `chunks.json`.
