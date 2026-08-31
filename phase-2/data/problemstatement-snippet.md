### 2.3 Opportunity ranking (filled from Phase 1)

Do **not** treat empty cells as guesses. Copied from `opportunity-ranking.json` via `phase-2/`.

| Opportunity area | Impact on W2P 30d | Feasibility (no incentives) | Evidence strength | Frequency | Maps to node | Rank |
|------------------|-------------------|----------------------------|-------------------|-----------|--------------|------|
| Fit & size confidence synthesis | high | high | medium | 0.367 | resolve | 1 |
| Styling / occasion guidance | high | high | medium | 0.083 | resolve | 6 |
| Wishlist compare & prioritization | high | high | medium | 0.1 | decide | 3 |
| In-app social proof (review/try-on synthesis) | high | medium | medium | 0.05 | resolve | 9 |
| Share-for-feedback | medium | medium | medium | 0.05 | resolve | 11 |
| Wishlist revisit nudges (generic) | medium | high | medium | 0.067 | revisit | 8 |
| Price-drop / sale alerts | — | Excluded (monetary) | — | — | — | Exclude |
| Back-in-stock alerts | unobserved | unobserved | none — not in Phase 1 ranking | — | act | — |
| StyleUncertainty | high | high | high | 0.083 | decide | 4 |
| ReturnFearDelay | medium | high | medium | 0.383 | resolve | 7 |

**Phase 2 decision (from `phase-2/data/nomination.json`):**

- Highest-potential opportunity: **FitSizeAnxiety → resolve**
- Interview segment: **S2 ∩ S4** — Top non-price themes include both Resolve (fit) and Decide (compare). Recruit S2 ∩ S4; do not lock P1 until Phase 4.
- Explicitly not pursuing: Price-drop / sale alerts (monetary — excluded by assignment constraint)
- readyForPhase3: **true**

