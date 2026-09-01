# Validation matrix: discovery themes against primary research (Part 3)

> **Themes under test:** `Phase-1/data/discovery/themes.json` (12 validated)
> **Nomination under test:** `phase-2/data/nomination.json` — *FitSizeAnxiety → resolve*, segment S2 ∩ S4
> **Evidence:** 9 questionnaire responses, 28–31 Aug 2026 — [`interview-notes/`](./interview-notes/README.md)
> **Method and caveats:** [`interview-guide.md`](./interview-guide.md) · **Reading:** [`synthesis.md`](./synthesis.md)

Every count is computed by `summarizeSurvey()` and republished at `/survey`. Re-running
`npm run survey` after new responses will contradict this table rather than quietly agree with it.

## Confirmed

| Theme / claim | Evidence | Strength |
|---|---|---|
| **wishlist-decay** — saves stall instead of converting | 5/9 buy from saves only *sometimes* or *almost never*; **9/9** have an unbought save (Q5, Q6) | Strong |
| **Shoppers are uncertain, not uninterested** | Q9 confidence mean 2.89 (range 0–6); 8/9 read reviews before buying (Q11) | Strong |
| **comparison-paralysis / compare-difficulty** — comparing is the unfinished job | Independent signal three times: reason to save 4/9 (Q7), pre-purchase behaviour 6/9 (Q11), requested help 3/9 (Q13) | Strong |
| **review-trust-gap** — decisions are made from other shoppers' evidence | Reviews 8/9, customer photos 7/9, size/fit reviews 5/9 (Q11) | Strong |
| **bookmark-vs-intent** — a save is not a purchase intent | "Like it but don't want to buy now" 6/9 ties for the top reason to save (Q7) | Moderate |
| **quality-uncertainty** | 2/9 name quality as the main blocker (Q8); 3/9 uncertain about quality (Q10) | Moderate |

## Challenged

| Theme / claim | Evidence against | What it means |
|---|---|---|
| **fit-size-anxiety is the #1 barrier** (the Phase 2 nomination) | Fit/size/appearance appears in 5/9 uncertainties (Q10), but only **1/9** names fit information as the unlock (Q12) | Fit is real but **secondary**. The nomination overstates it as the leading barrier. |
| **Price is a waiting behaviour, not the core problem** | Price-shaped reasons lead Q8 at **5/9**; Price/value is the top uncertainty at **7/9** (Q10) | Price is the loudest stated barrier. See the price-not-held-constant caveat in [`interview-guide.md`](./interview-guide.md). |
| **Sale-watchers are a separable minority** | "Wait for a better price" ties for the top reason to save, 6/9 (Q7) | Sale-waiting is widespread, not a fringe persona — though only 2/9 *act* on it (Q11 "wait for a sale"). |
| **Wishlists are cluttered with dozens of saves** | 6/9 hold only 1–5 saves; just 2/9 hold more than 50 (Q4) | The clutter premise does not hold for this sample. Volume-based framing is weak. |
| **The target segment wants non-monetary help** | Both in-segment respondents (R03, R07) chose "Price drop/discount" in Q12 | Sharpest challenge available. n = 2 — too small to act on either way. |

## Not supported

| Claim | Evidence |
|---|---|
| **An AI wishlist verdict is wanted** | Q14 mean 2.89, range 0–5: two enthusiasts, three 2s, one flat 0 |
| **"act" node of the metric tree** | Already uncovered in `phase-2/data/phase2-stats.json`; the questionnaire adds nothing to it |

## New — not present in the discovery themes

| Finding | Evidence | Why it matters |
|---|---|---|
| **"Is this price fair?" is an information need** | Top Q13 answer, **4/9** — and no Q13 option is a discount | A non-monetary reading of a price complaint. Unbuilt, and permitted by the no-incentive constraint. |
| **"Should I buy now or wait?"** | 1/9 as the unlock (Q12); "whether the price will fall" 2/9 (Q10) | Timing confidence, distinct from both fit and discounting |
| **Returns/exchange friction as the unlock** | 1/9 (Q12); return experience cited 1/9 (Q10) | Post-purchase safety as a pre-purchase lever |
| **"Whether I actually need it"** | 1/9 (Q10) | Self-justification doubt, absent from every theme |

## Consequences

1. The nomination's **direction** survives — uncertainty and comparison are confirmed — but its
   **ranking** does not: fit is not the leading barrier in this sample.
2. The strongest confirmed lever, **comparison**, is already built as the keep-one-hanger ritual.
3. The largest unserved need, **value confidence**, has no surface in the product yet.
4. Phase 4 must record the price-dominant reading and the reason it does not license discounts,
   rather than quietly re-asserting a fit-first frame.
