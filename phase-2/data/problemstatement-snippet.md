### 2.3 Opportunity ranking (filled from Phase 1)

Do **not** treat empty cells as guesses. Copied from `opportunity-ranking.json` via `phase-2/`.

| Opportunity area | Impact on W2P 30d | Feasibility (no incentives) | Evidence strength | Frequency | Maps to node | Rank |
|------------------|-------------------|----------------------------|-------------------|-----------|--------------|------|
| Fit & size confidence synthesis | high | high | medium | 0.348 | resolve | 1 |
| Styling / occasion guidance | high | high | medium | 0.106 | resolve | 3 |
| Wishlist compare & prioritization | high | high | medium | 0.136 | decide | 2 |
| In-app social proof (review/try-on synthesis) | high | medium | medium | 0.045 | resolve | 7 |
| Share-for-feedback | medium | medium | high | 0.121 | decide | 11 |
| Wishlist revisit nudges (generic) | medium | medium | medium | 0.061 | revisit | 15 |
| Price-drop / sale alerts | — | Excluded (monetary) | — | — | — | Exclude |
| Back-in-stock alerts | unobserved | unobserved | none — not in Phase 1 ranking | — | act | — |
| ReturnFearDelay | medium | high | medium | 0.455 | resolve | 4 |
| ReturnAndExchangeUncertainty | medium | medium | medium | 0.076 | resolve | 13 |
| PoorCustomerSupport | medium | medium | medium | 0.045 | revisit | 16 |
| ReturnAndRefundIssues | low | medium | medium | 0.061 | resolve | 20 |

**Phase 2 decision (from `phase-2/data/nomination.json`):**

- Highest-potential opportunity: **FitSizeAnxiety → resolve**
- Interview segment: **S2 ∩ S4** — Top non-price themes include both Resolve (fit) and Decide (compare). Recruit S2 ∩ S4; do not lock P1 until Phase 4.
- Explicitly not pursuing: Price-drop / sale alerts (monetary — excluded by assignment constraint)
- readyForPhase3: **true**

