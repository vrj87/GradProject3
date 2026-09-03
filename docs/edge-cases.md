# Edge Cases and Acceptance — Myntra W2P 30d

Derived from [ProjectDetails.md](./ProjectDetails.md), [problemstatement.md](./problemstatement.md) v2.0, and [architecture.md](./architecture.md) v2.0.

**Severity:** P0 = breaks a brief part / wrong KPI / constraint violation · P1 = wrong insight or segment · P2 = degraded UX / ops noise · P3 = rare / polish

**Constraint:** No monetary incentives (coupons, cashback, price-drop alerts) as the primary intervention. Edge-case handling must preserve this.

**Stance:** Coach, ingest, and LLM product cases apply **only if** Phase 4’s decision tree locks Wishlist Confidence Coach. Assignment-acceptance IDs (`A-*`) apply in every run.

Coach/ingest IDs use `C-`, `I-`, `L-` (no reuse of `C-*` for deploy). Deploy uses `V-*`.

---

## Phase map

| Phase | Assignment | Cases |
|-------|------------|-------|
| 0 Frame | Context | A-F* |
| 1 Discovery | Part 1 | A-D*, D-* |
| 2 Metric + ranking | Part 2 | A-M*, K-* |
| 3 Interviews | Part 3 | A-R*, R-* |
| 4 Problem definition | Part 4 | A-P*, P-* |
| 5 MVP (if locked) | Part 5 | A-V*, S-*, I-*, C-*, W-*, L-*, U-*, DB-*, API-*, M-* |
| 6 Success, risks, deck | Parts 6–7 | A-S*, A-K*, V-* |

---

## Phase 0 — Frame (assignment acceptance)

| ID | Edge case | Expected behavior | Severity |
|----|-----------|-------------------|---------|
| A-F01 | Docs name a solution (coach) as decided in Phase 0–2 | Fail brief spirit — keep hypothesis labels only | P0 |
| A-F02 | W2P 30d formula missing or ambiguous | Lock user-level, ≥1 wishlist purchase within 30d of an add | P0 |
| A-F03 | Solution proposes coupons / cashback / price-drop as the core lever | Constraint fail — reject | P0 |
| A-F04 | Product not chosen (Myntra / AJIO / Nykaa) | Lock Myntra | P0 |

---

## Phase 1 — Discovery engine (Part 1)

### Assignment acceptance

| ID | Edge case | Expected behavior | Severity |
|----|-----------|-------------------|---------|
| A-D01 | Engine only summarizes sentiment | Fail Part 1 — must identify, quantify, and **compare** opportunities | P0 |
| A-D02 | Any of Q1–Q10 has zero linked themes and no logged gap | `readyForPhase2: false` | P0 |
| A-D03 | Opportunities listed but not scored against each other | Fail Part 1 compare requirement | P0 |
| A-D04 | Reviewer cannot run a testable workflow | Provide CLI + `data/discovery/` (public `/discovery` is Phase 5-only) | P0 |
| A-D05 | Interview quotes counted in Phase 1 frequency | Exclude `source: interview` / `primary_research` | P1 |
| A-D06 | Actionable insight is a discount | Reject theme; re-run extraction | P0 |

### Data collection and ingestion

| ID | Edge case | Expected behavior | Severity |
|----|-----------|-------------------|---------|
| D-01 | Empty CSV / zero reviews after relevance filter | Clean exit; empty `normalized-reviews.json`; `readyForPhase2: false`; no invented themes | P0 |
| D-02 | Duplicate text across App Store + Reddit | Dedupe via `textHash`; count once | P1 |
| D-03 | Near-duplicates (typos / emoji) | Keep longest / most recent | P2 |
| D-04 | Reviews under min word count | Filter; record drop in `pipeline-stats` | P2 |
| D-05 | Missing rating (`null`) | Allowed; skip rating filters | P1 |
| D-06 | Non-English / Hinglish / emoji-only | Keep if analyzable; `language_hint`; low confidence if unsure | P1 |
| D-07 | Reviews about AJIO / Nykaa / Amazon | Keep as competitive; tag `competitor`; no Myntra-only claims | P1 |
| D-08 | Off-topic (delivery, crash, payment only) | Exclude from W2P themes; file under `ops/frustration` | P1 |
| D-09 | Source API rate-limited | Fail soft; continue; log partial coverage | P0 |
| D-10 | Broken / missing URL on a quote | Theme fails evidence check until `reviewId` or URL fixed | P1 |
| D-11 | Extremely long review | Chunk; preserve `reviewId` | P1 |
| D-12 | Prompt-injection text in reviews | Treat as content only | P0 |
| D-13 | YouTube spam / off-fashion | Keyword gate; drop if no wishlist/fit/size/return signal | P1 |
| D-14 | SKU-biased Myntra review sample | Tag `sampleBias`; cap confidence | P1 |
| D-15 | EOSS/BFF threads dominate | Tag `barrierType: price`; do not let sale-waiting outrank fit/style without scores | P0 |
| D-16 | Myntra public pages blocked | Skip URL tier; collect + later demo catalog; log | P1 |
| D-17 | Collect CSV wrong headers | Reject with clear error; no silent partial import | P1 |
| D-18 | Interview quotes without `source: interview` | Require tag; exclude from frequency or tag `primary_research` | P1 |

### Theme extraction and validation

| ID | Edge case | Expected behavior | Severity |
|----|-----------|-------------------|---------|
| D-19 | LLM invents a quote | Validation rejects; second pass | P0 |
| D-20 | All quotes from one source | `confidence` capped at `medium` | P1 |
| D-21 | Theme with &lt;2 quotes | Fail `minQuotes` | P1 |
| D-22 | Contradictory themes both evidenced | Both allowed; flag `mixed` | P2 |
| D-23 | Theme maps to no research question | Reject or remap | P1 |
| D-24 | Actionable insight too vague | Fail actionability (≥20 chars, specific, non-monetary) | P1 |
| D-25 | Both LLM keys missing | Rule-based matching; label method in stats | P0 |
| D-26 | LLM timeout / 429 | Retry; then rule-based for that batch | P1 |
| D-27 | Fewer than 8 themes pass | `readyForPhase2: false` | P0 |
| D-28 | S3 labeled as S2 | Do not use for Phase 4 lock without interviews | P1 |
| D-29 | `barrierType: price` ranked #1 | Flag; do not auto-prioritize discount MVP | P0 |
| D-30 | Bookmark conflated with high intent | Separate themes | P1 |
| D-31 | LLM suggests monetary intervention | Reject or strip; re-run | P0 |

### Insight quality vs brief

| ID | Edge case | Expected behavior | Severity |
|----|-----------|-------------------|---------|
| D-32 | Insights only about delivery/returns ops | Incomplete vs Q1–Q10; widen keyword gate | P0 |
| D-33 | Heavy AJIO/Nykaa bias | Separate Myntra-specific vs industry-wide | P1 |
| D-34 | Sample &lt;50 after filter | Cap confidence `medium`/`low` | P1 |
| D-35 | No themes map to **Decide** | Log gap; probe in interviews; do not claim compare validated | P0 |
| D-36 | No themes map to **Resolve** | Same — do not lock a fit MVP | P0 |
| D-37 | Ranking score tie | Tie-break `impactOnW2P` then feasibility | P2 |
| D-38 | Frequencies sum &gt; 1.0 | Document overlap; do not treat as exclusive | P2 |

### Phase 1 smoke

| # | Scenario | Expect |
|---|----------|--------|
| 1 | `npm run discovery:refresh` on empty corpus | `readyForPhase2: false`; no invented themes |
| 2 | Open `themes.json` | ≥2 quotes/theme; `researchQuestionIds` present |
| 3 | Open `opportunity-ranking.json` | Comparable scores; not a sentiment list |
| 4 | Discount language in a theme insight | Validation fail |
| 5 | Bad collect CSV headers | Reject |

---

## Phase 2 — Metric + ranking (Part 2)

### Assignment acceptance

| ID | Edge case | Expected behavior | Severity |
|----|-----------|-------------------|---------|
| A-M01 | Opportunity matrix filled without `opportunity-ranking.json` | Fail Part 2 — ranking must use discovery output | P0 |
| A-M02 | Metric tree missing “what must change” | Require revisit × resolve × decide (or evidenced alternative) | P0 |
| A-M03 | Highest opportunity is price-drop alerts | Exclude; constraint | P0 |
| A-M04 | Segment nominated with no ranking support | Revisit Phase 1 or document override | P1 |

### Metric-tree cases

| ID | Edge case | Expected behavior | Severity |
|----|-----------|-------------------|---------|
| K-01 | Revisit without resolve | Count revisit; no resolution credit | P1 |
| K-02 | Resolve without cart add | Count uncertainty resolved ≠ purchase | P1 |
| K-03 | Cart add without purchase in 30d | Counts resolution rate; not W2P | P1 |
| K-04 | Stock OOS at revisit | Tag `blocker: stock`; do not blame coach | P1 |
| K-05 | Bookmark classified as active intent | Separate in discovery + KPI | P0 |
| K-06 | Intervention improves resolve but not revisit | Valid; report both nodes | P1 |
| K-07 | 30-day window vs 45-day EOSS wait | S3 excluded from primary KPI narrative | P1 |
| P-01 | W2P cohort per-item vs per-user ambiguous | Lock: user-level, any wishlisted item | P0 |
| P-02 | Purchase on day 31 | Does not count | P0 |
| P-03 | Wishlists A, purchases wishlisted B within 30d | Counts as W2P (assignment default) | P1 |

---

## Phase 3 — User research (Part 3)

### Assignment acceptance

| ID | Edge case | Expected behavior | Severity |
|----|-----------|-------------------|---------|
| A-R01 | n &lt; 5 interviews | Incomplete; do not claim 5–6 validation | P0 |
| A-R02 | Respondents not in the Phase 2 segment | Do not count toward 5–6 | P0 |
| A-R03 | Any of the eight brief topics skipped | Fail Part 3 | P0 |
| A-R04 | Invented quotes labeled as real | P0 — synthetic must be labeled | P0 |
| A-R05 | Interviews never challenge AI themes | Note confirmation-bias risk; probe disconfirming | P1 |

### Research operations

| ID | Edge case | Expected behavior | Severity |
|----|-----------|-------------------|---------|
| R-01 | Recruitment link unavailable | Placeholders; no fake “real” quotes | P0 |
| R-02 | Purchased ≥2 wishlist items in 30d | Disqualify | P0 |
| R-03 | &lt;3 wishlist adds in 30d | Disqualify | P0 |
| R-04 | Only blocker is EOSS/BFF (pure S3) | Disqualify from P1 unless studying S3 | P0 |
| R-05 | Only 3 interviews completed | Document incomplete | P0 |
| R-06 | All interviews confirm AI themes | Probe for disconfirming evidence | P1 |
| R-07 | Interviews challenge primary AI theme | Update matrix; revise frame before MVP | P0 |
| R-08 | Price dominant even at current price | Phase 4 tree: do not build incentive MVP | P0 |
| R-09 | Leading questions | Discard heavily leading transcripts from matrix | P1 |
| R-10 | Participant is Myntra/competitor employee | Disqualify | P1 |
| R-11 | New insight in 1 of 6 only | Weak signal; do not drive MVP alone | P2 |
| R-12 | 40+ wishlist items | Valid decay data; note outlier | P2 |
| R-13 | Recording consent denied | Notes only; no verbatim without permission | P0 |
| R-14 | Segment drift (recruited compare, cites only price) | Re-tag; adjust eligibility | P1 |
| R-15 | “I can always return” | Capture as delay; later coach must not replace returns policy | P1 |
| R-16 | Compares only on YouTube/Instagram | Validates review-trust gap | P1 |
| R-17 | Magic-wand asks for discounts | Out of scope; redirect synthesis to non-monetary | P1 |
| R-18 | Validation matrix empty | Block deck slides 5–6 | P1 |

### Phase 3 smoke

| # | Scenario | Expect |
|---|----------|--------|
| 1 | Screener: sale-only blocker | Disqualified |
| 2 | Guide vs brief 8 questions | All mapped |
| 3 | `validation-matrix.md` | Every hypothesis has a status |

---

## Phase 4 — Problem definition (Part 4)

### Assignment acceptance

| ID | Edge case | Expected behavior | Severity |
|----|-----------|-------------------|---------|
| A-P01 | Any required field missing (segment, outcome, root cause, workarounds, user value, business value) | Fail Part 4 | P0 |
| A-P02 | Evolution chain skips a step | Fail Part 4 — Metric → Outcomes → Discovery → Research → Problem | P0 |
| A-P03 | Root cause / solution is monetary | Reject `problem-definition.md` | P0 |
| A-P04 | Problem still “provisional” at MVP ship with no label | Block deploy narrative or mark “hypothesis MVP” | P1 |
| A-P05 | Phase 5 coach contracts written though tree forked | Rewrite Phase 5 first | P0 |

### Problem / KPI lock

| ID | Edge case | Expected behavior | Severity |
|----|-----------|-------------------|---------|
| P-04 | Demo `cart_add_simulated` counted as real W2P | Label proxy on dashboard and deck | P1 |
| P-05 | Business value claimed without funnel | Show eligible → engaged → resolved → cart | P1 |
| P-06 | Definition still provisional at ship | See A-P04 | P1 |
| P-07 | Root cause cites discounts as solution | Reject | P0 |
| P-08 | P1 definition conflicts with interview synthesis | Synthesis wins; update spec and later `segment.ts` | P0 |

---

## Phase 5 — MVP (Part 5) — if Phase 4 locks Confidence Coach

### Assignment acceptance

| ID | Edge case | Expected behavior | Severity |
|----|-----------|-------------------|---------|
| A-V01 | MVP is Figma-only / not publicly testable | Fail Part 5 | P0 |
| A-V02 | Public MVP link broken at submission | Fail deliverable; keep `/api/health` + repo fallback | P0 |
| A-V03 | Coach copy offers coupons / “buy now cheaper” / wait for EOSS as the action | Guardrail reject | P0 |
| A-V04 | Building 5a–5f before Phase 4 proceed | Stop | P0 |

### Segment eligibility (P1)

Target: **S2 ∩ S4** — ≥3 recent saves, ≤1 purchase, ≥3 items in one category.

| ID | Edge case | Expected behavior | Severity |
|----|-----------|-------------------|---------|
| S-01 | `recentWishlist.length = 2` | Not eligible | P0 |
| S-02 | 3 items, one per category | Not eligible | P0 |
| S-03 | 6 kurta sets + 2 sneakers | Eligible | P0 |
| S-04 | `purchasedFromWishlist = 2` | Not eligible | P0 |
| S-05 | `purchasedFromWishlist = 1` | Eligible | P0 |
| S-06 | `optedOut = true` | Never show coach | P0 |
| S-07 | `user-sale-watcher` | Not eligible; S3 explainer | P0 |
| S-08 | `user-decided` | Not eligible; positive control | P0 |
| S-09 | Empty wishlist | Not eligible | P0 |
| S-10 | Item added 31 days ago | Excluded from `recentWishlist` | P0 |
| S-11 | Uncertainty resolved then cart add | Stop prompts for that item | P1 |
| S-12 | Shared account | Segment by account history; document limit | P2 |
| S-13 | 100+ items | Eligible if rules met; cap prompts | P1 |
| S-14 | `Ethnic` vs `ethnic` | Normalize enum before `groupByCategory` | P1 |
| S-15 | Single high-ticket lehenga, no cluster | May be S1; document | P2 |
| S-16 | Becomes ineligible mid-session | Hide coach on next fetch | P1 |

### Product ingest

| ID | Edge case | Expected behavior | Severity |
|----|-----------|-------------------|---------|
| I-01 | Invalid Myntra URL | `400`; suggest demo catalog | P0 |
| I-02 | Product 404 / delisted | Fallback or clear error | P1 |
| I-03 | 403 / bot detection | Tier-2 catalog; `ingestBlocked: true` | P0 |
| I-04 | Zero reviews extracted | Ingest allowed; `confidenceBand: low` | P0 |
| I-05 | &lt;3 reviews | Low confidence; no strong fit claims | P0 |
| I-06 | All 5-star generic | `insufficientFitSignal` | P1 |
| I-07 | Size chart missing | Reviews only; note missing chart | P1 |
| I-08 | Duplicate URL ingest | Return cached Product | P1 |
| I-09 | Sale vs MRP parse | Store both; **no** discount messaging | P1 |
| I-10 | Beauty-only SKU | Allow; user may override category | P2 |
| I-11 | Ingest timeout | Abort; suggest catalog | P0 |
| I-12 | HTML structure change | Partial record + tier-2; health alert | P0 |
| I-13 | Image hotlink broken | Placeholder; text coach still works | P2 |
| I-14 | AJIO / competitor URL | Reject or tag `competitor` | P1 |
| I-15 | JSON-LD vs HTML title conflict | Prefer JSON-LD; log | P2 |

### Coach — fit and style

| ID | Edge case | Expected behavior | Severity |
|----|-----------|-------------------|---------|
| C-01 | `POST /api/coach/analyze` missing `productId` | `400` | P0 |
| C-02 | Unknown `productId` | `404` | P0 |
| C-03 | User not P1 | Document one policy: demo banner **or** block with reason | P1 |
| C-04 | Same prompt for footwear vs ethnic | Category-aware variants | P1 |
| C-05 | 50/50 runs small vs large | `sizePattern: mixed`; band medium/low | P0 |
| C-06 | `confidenceBand: high` with &lt;3 evidence reviews | Coerce down; require `evidenceReviewIds` | P0 |
| C-07 | Invented body-type claim | Strip; regenerate or fallback | P0 |
| C-08 | Style on a basic white tee | Still return; may be low value | P2 |
| C-09 | Occasion inferred without evidence | Only tag supported occasions | P1 |
| C-10 | Double-click analyze | Idempotent / cache ~5 min | P1 |
| C-11 | DB write fails after analyze | Still return payload; log | P1 |

### Coach — compare

| ID | Edge case | Expected behavior | Severity |
|----|-----------|-------------------|---------|
| C-12 | Compare 1 item | `400` — min 2 | P0 |
| C-13 | Compare 4+ items | `400` — max 3 | P0 |
| C-14 | Mixed categories | `400` — same category | P0 |
| C-15 | One item has no reviews | Low-confidence column | P1 |
| C-16 | Recommends weaker-evidence item without caveat | `caveats` required | P0 |
| C-17 | All scores tied | “Either could work” allowed | P1 |
| C-18 | User picks after compare | `decision_completed`; optional `uncertainty_resolved` | P0 |
| C-19 | Compare includes delisted SKU | Exclude or block | P1 |
| C-20 | Discount as deciding factor | Reject; regenerate | P0 |

### Coach — simulated actions

| ID | Edge case | Expected behavior | Severity |
|----|-----------|-------------------|---------|
| C-21 | “Uncertainty resolved” without viewing coach | Allow; track separately | P2 |
| C-22 | Remove item right after prompt | `item_removed`; watch guardrail | P1 |
| C-23 | Simulated add to cart | `cartAddedAt` + `cart_add_simulated`; no checkout | P0 |
| C-24 | Cart add then wishlist remove | One status; no duplicate events | P1 |
| C-25 | Coach says “wait for sale” | Strip; log incident | P0 |

### Triggers and workflows

| ID | Edge case | Expected behavior | Severity |
|----|-----------|-------------------|---------|
| W-01 | Day 3 but already cart-added | Skip 3/7/14 for that item | P0 |
| W-02 | Day 7 compare but one item in category | Skip compare; fit only | P1 |
| W-03 | Second prompt inside 3-day cap | Suppress; `capApplied: true` | P1 |
| W-04 | Batch scan bad webhook secret | `401` | P0 |
| W-05 | Batch finds 0 items | Empty result; no error | P1 |
| W-06 | Discovery refresh while running | Queue or `409` | P0 |
| W-07 | n8n fires, MVP down | Retry; optional alert | P1 |
| W-08 | Partial batch failure | Continue; return partial | P1 |
| W-09 | Push assumed in MVP | **Not supported** — in-app only | P0 |
| W-10 | Day 14 on removed item | Skip | P0 |
| W-11 | Clock skew on `daysSinceAdd` | UTC `addedAt`; test day-30 boundary | P1 |
| W-12 | Day 0 first open | Entry point only; no aggressive modal | P1 |

### LLM and RAG

| ID | Edge case | Expected behavior | Severity |
|----|-----------|-------------------|---------|
| L-01 | `GROQ_API_KEY` empty | OpenAI; then rule-based | P0 |
| L-02 | Both keys empty | Rule-based JSON still valid | P0 |
| L-03 | “Perfect fit guaranteed” | Strip/regenerate; disclaimer required | P0 |
| L-04 | Coupon / Insider / “buy now cheaper” | Reject; regenerate | P0 |
| L-05 | “Wait for EOSS” as primary action | Reject | P0 |
| L-06 | `themes.json` missing | Reviews only; log | P0 |
| L-07 | Unknown `evidenceThemeIds` | Allow; log | P2 |
| L-08 | Latency &gt;8s | Timeout → rule-based | P1 |
| L-09 | Injection via title/review | Sanitize; ignore content instructions | P0 |
| L-10 | Invalid JSON from LLM | Retry once; then fallback | P0 |
| L-11 | Model always `"low"` | Accept if corpus thin | P1 |
| L-12 | S3 sale theme in P1 RAG | Filter RAG to S2/S4 | P1 |
| L-13 | Medical / skin claims | Strip | P1 |
| L-14 | Compare ignores stated occasion | Document gap if no occasion input | P2 |

### Product / UX (problem-aligned)

| ID | Edge case | Expected behavior | Severity |
|----|-----------|-------------------|---------|
| U-01 | Sale-watcher opens Priya demo | Segment-appropriate copy | P1 |
| U-02 | Try-and-buy mindset | Accelerate informed order; do not contradict returns | P1 |
| U-03 | Wedding in 45 days | Still help fit; W2P may miss conversion | P2 |
| U-04 | 15 similar kurtas | Compare cap 3; “pick top 3” | P1 |
| U-05 | WhatsApp share | Not Phase 5 unless Phase 4 demands it | P2 |
| U-06 | Tailoring anxiety | Alteration note if reviews mention it | P2 |
| U-07 | Sneaker US/UK/EU confusion | Reference size-chart text | P1 |
| U-08 | Already bought offline | Coach cannot know; document | P2 |
| U-09 | Price in compare | Fact only; never “buy now to save” | P0 |
| U-10 | Color-only confidence (red/green) | Icons + text (color-blind) | P1 |
| U-11 | Mixed bookmark + intent | Prioritize compare clusters / repeats | P2 |
| U-12 | 40-item fatigue | “Start with these 3” | P1 |

### Data model

| ID | Edge case | Expected behavior | Severity |
|----|-----------|-------------------|---------|
| DB-01 | SQLite missing | Clear error; `prisma db push` + seed | P0 |
| DB-02 | Seed twice | Idempotent; stable `user-priya` | P1 |
| DB-03 | Corrupt JSON fields | Safe default; degrade | P1 |
| DB-04 | Concurrent CoachSession writes | No crash | P2 |
| DB-05 | `themes.json` exists, Theme table empty | RAG from file | P1 |
| DB-06 | Serverless SQLite write fails | Document Turso/Postgres; seed at build | P0 |
| DB-07 | Removed item, events remain | Keep events; hide item | P1 |
| DB-08 | CoachSession without `wishlistItemId` | Allowed for URL-only analyze | P2 |
| DB-09 | Future `addedAt` | Reject or clamp to now | P1 |

### API and security

| ID | Edge case | Expected behavior | Severity |
|----|-----------|-------------------|---------|
| API-01 | Unauthenticated discovery refresh in prod | Require `x-webhook-secret` | P0 |
| API-02 | Spam analyze (LLM cost) | Rate limit in production | P1 |
| API-03 | Oversized JSON body | Reject gracefully | P2 |
| API-04 | Injection via `userId` / `productId` | Prisma parameterized queries | P0 |
| API-05 | PII in logs | Avoid full payloads in prod | P1 |
| API-06 | SSRF via ingest URL | Allowlist `myntra.com`; block private IPs | P0 |
| API-07 | Open CORS on demo APIs | Same-origin default; document policy | P1 |

### Dashboard

| ID | Edge case | Expected behavior | Severity |
|----|-----------|-------------------|---------|
| M-01 | Zero eligible P1 users | 0%; no divide-by-zero | P0 |
| M-02 | Engaged, zero resolved | Show drop-off | P1 |
| M-03 | Discovery files missing | `/discovery` → “run pipeline” | P1 |
| M-04 | Funnel counts all users eligible | P1-eligible only | P0 |
| M-05 | W2P from demo clicks | Label proxy | P1 |
| M-06 | `item_removed` spike | Guardrail alert | P1 |
| M-07 | Compare started, not completed | Completion rate uses starts as denominator | P1 |
| M-08 | Negative time-to-revisit | Exclude from median | P1 |
| M-09 | Return rate not in MVP | “Manual tracking” placeholder; do not fake | P2 |

### Phase 5 smoke (after `backend:setup` + `discovery:refresh`)

| # | Scenario | Expect |
|---|----------|--------|
| 1 | GET `/demo/user/user-priya` | Wishlist; ≥3 ethnic; coach entry |
| 2 | GET `/demo/user/user-sale-watcher` | Coach blocked or S3 explainer |
| 3 | POST ingest invalid URL | 400 |
| 4 | POST ingest demo catalog id | Product + reviews |
| 5 | POST `/api/coach/analyze` Priya kurta | Disclaimer + `evidenceReviewIds` |
| 6 | POST compare 2 ethnic items | CompareMatrix |
| 7 | POST compare 4 items | 400 |
| 8 | POST compare kurta + sneaker | 400 |
| 9 | POST `uncertainty_resolved` | Stored; dashboard updates |
| 10 | Unset `GROQ_API_KEY`; analyze | Fallback JSON |
| 11 | Discovery refresh bad secret | 401 |
| 12 | GET `/api/discovery` | Themes + ranking |
| 13 | Day-3 trigger twice in 3d | Second suppressed |
| 14 | LLM mock returns discount copy | Reject / strip |
| 15 | Product with 0 reviews | `confidenceBand: low` |

---

## Phase 6 — Success, risks, deck (Parts 6–7)

### Assignment acceptance

| ID | Edge case | Expected behavior | Severity |
|----|-----------|-------------------|---------|
| A-S01 | Metrics listed without definition **or** rationale | Fail Part 6 | P0 |
| A-S02 | Success metrics ignore the business metric | Start from W2P 30d | P0 |
| A-S03 | No leading or guardrail metrics | Fail Part 6 completeness | P1 |
| A-K01 | Risks are generic, not solution-specific | Fail Part 7 | P0 |
| A-K02 | No mitigation for “price is actually the blocker” | Required | P0 |

### Deliverable / deck (V-* — not coach C-*)

| ID | Edge case | Expected behavior | Severity |
|----|-----------|-------------------|---------|
| V-01 | Netlify deploy without public artefacts in `dist` | Discovery/survey JSON 404; copy artefacts at build | P0 |
| V-02 | n8n points at wrong URL | Document env checklist | P0 |
| V-03 | Deck has fellow name | Submission fail | P0 |
| V-04 | Deck &gt;10 slides or font &lt;14 | Guideline fail | P0 |
| V-05 | Artefact links private | Make public before submit | P0 |
| V-06 | PDF &gt;40 MB | Compress | P1 |
| V-07 | Discovery demo link broken | CLI + `data/discovery/` documented | P0 |
| V-08 | MVP link broken | `/api/health` + repo fallback | P0 |
| V-09 | Deck slide shows discount-led solution | Constraint fail — regenerate | P0 |
| V-10 | Slide titles are generic (“Problem”) | Use message titles | P1 |

---

## Explicit non-goals (not bugs)

- Real Myntra wishlist sync or OAuth
- Live push / SMS / email
- Coupons, cashback, Insider offers, or price-drop alerts as coach output
- True production W2P from Myntra warehouse analytics
- Full Myntra app clone (checkout, payments, tracking)
- Scraping that violates ToS when blocked (use collect UI)
- Share-to-WhatsApp unless Phase 4 demands it
- Multi-language coach beyond English/Hinglish review handling
- Size recommendation from body measurements
- Implementing Phase 5 coach contracts if Phase 4’s tree forks

---

## Related docs

- [ProjectDetails.md](./ProjectDetails.md) — assignment parts and deliverables
- [problemstatement.md](./problemstatement.md) — evidence-gated narrative, decision tree
- [architecture.md](./architecture.md) — phase-wise build, APIs, schemas
- `apps/mvp/lib/segment.ts` — P1 eligibility (Phase 5a, if locked)
- `apps/mvp/lib/llm.ts` — coach guardrails (Phase 5c, if locked)
- `apps/mvp/lib/product-ingest.ts` — URL parse tiers (Phase 5b, if locked)

---

*Document version: 2.0 — aligned to problemstatement v2.0 and architecture v2.0.*
