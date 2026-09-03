# 10-slide deck copy (Myntra W2P 30d)

Canonical copy for [`myntra-w2p-30d-deck.pdf`](./myntra-w2p-30d-deck.pdf). Print from [`deck/10-slides.html`](./deck/10-slides.html).

Built to [ProjectDetails.md](./ProjectDetails.md) (Parts 1–7 + deck guidelines) and [architecture.md](./architecture.md) (phase map, contracts, metric tree, coach guardrails).

Visual: NextLeap 16:9 template with Myntra chrome — navy rail `#282C3F`, pink `#FF3F6C`, maroon titles, dashed cards. Body ≥ 14pt. Senior-PM copy unchanged.

**Guidelines met:** no fellow name · 10 slides · body ≥ 14pt · titles are the key message · contrast on colour · colour-blind-safe (labels and column headers, not colour alone) · artefacts hyperlinked.

Public artefacts: [questionnaire](https://docs.google.com/forms/d/e/1FAIpQLScmH7Z4FoFH7Y4XzsaMIR2prioWoh6AuHQVxfptRc3qmEzMZQ/viewform) · Studio after `cd Phase-1 && npm run dev`, or the Netlify production URL.

---

## Slide 1 — Saved items already show intent. Thirty-day conversion still fails without a coupon.

- Product: **Myntra**. Role: Growth PM.
- North star: **% of users who buy ≥1 wishlisted item within 30 days of saving it** (W2P 30d).
- Constraint: **no monetary incentives** as the core lever — no coupons, cashback, sale alerts, or price-drop nags.
- A wishlist is explicit interest that stalls. The job is to discover *why*, then help them **finish a judgement** — not to pay for the buy.

---

## Slide 2 — W2P 30d only moves if shoppers return, finish a judgement, then act

**W2P 30d** = users who purchase ≥1 wishlist item in 30 days ÷ users who saved ≥1 item.

| Product outcome | Definition | Role after lock |
|---|---|---|
| Revisit | Open the wishlist within 30 days of a save | Necessary. If they never return, nothing converts. |
| Resolve | Blocking doubt (fit, quality, look) is gone | **Secondary.** Real, not the decider. |
| Decide | Among 2+ similar saves, buy **or** deliberate drop in 30d | **Primary.** Removals count. |
| Act | Wishlist item → bag / checkout in 30d | Last step. A coupon tap is not a win. |

Price-waiting is **ranked** so we do not pretend it is rare. It is **set aside** because the brief forbids paying for conversion. Architecture: Discovery informs ranking; an MVP may only target Resolve and Decide — never discounts.

---

## Slide 3 — Public shopper voice becomes ranked opportunities, not a sentiment chart

**1-slider — how the engine works** ([architecture.md](./architecture.md) Phase 1)

Live sources (App Store RSS, Play Store, Reddit, YouTube, forums) → **Keep** (drop &lt;8 words / off-topic; SHA-256 dedupe) → **Group** (quote-grounded themes; ≥2 quotes; Q1–Q10 map) → **Score** → **Gate** (price-flagged rows ranked then excluded from the bet; no product lock until research).

**Score** = `0.4 × impact + 0.4 × non-monetary feasibility + 0.2 × frequency`  
high = 1 · medium = 0.6 · low = 0.3. Empty cells stay empty. Sentiment-only output fails Part 1.

Test: Studio after `npm run dev` · [live voices](http://localhost:3000/studio?view=stories) · [Q1–Q10](http://localhost:3000/studio?view=questions) · [what to focus on](http://localhost:3000/studio?view=focus)

---

## Slide 4 — Fit ranked first. Sale-wait is #2 — and we still will not use it.

**895** public reviews read → **150** about saving or waiting → **12** patterns compared. `readyForPhase2: true`.

| Rank | Opportunity | Score | Note |
|---|---|---|---|
| 1 | Fit and size | 0.87 | ~37% of kept comments. Nominated. **Not locked.** |
| 2 | Waiting for a sale | 0.83 | **Price-flagged.** Counted. Not the MVP. |
| 3 | Choosing between saved items | 0.82 | Decide-side partner. Research kept this lever. |

Hybrid extract: 3 LLM batches failed; 7 themes gap-filled. Funnel is in pipeline stats, not hidden. Ranking: [studio?view=focus](http://localhost:3000/studio?view=focus)

---

## Slide 5 — Shoppers say price. Asked for help, they want a verdict — not a coupon.

Structured questionnaire, **n = 9**, 28–31 Aug 2026 — not 5–6 live interviews. [Form](https://docs.google.com/forms/d/e/1FAIpQLScmH7Z4FoFH7Y4XzsaMIR2prioWoh6AuHQVxfptRc3qmEzMZQ/viewform) · [/survey](http://localhost:3000/survey)

- Main unbought reason (Q8): price-shaped **5/9**; fit as the *main* reason **0/9**.
- What they do (Q11): reviews **8/9** · customer photos **7/9** · in-app compare **6/9** · wait for a sale **2/9**.
- Unlock (Q12): discount **4** vs information **5**. Help (Q13, no discount option): “is this price good?” **4/9**; pick among saves **2/9**.
- **Load-bearing:** all four discount-seekers switched to information on Q13 — including both in-segment respondents.
- Confidence a save is “right”: **2.89**. AI that picks winners (Q14): **2.89** — framing dropped.
- **Caveat:** 2 of 9 match the stalled shortlister (target 5). Price was not held constant. Closed-option form — no invented quotes.

---

## Slide 6 — The stalled shortlister cannot finish a judgement inside the wishlist.

**Locked** (stalled shortlister): a wishlist captures interest but offers no way to finish a judgement — neither *which of these* nor *is it worth what it costs*. The only tool the app offers is a falling price, so intent parks on a sale that may never arrive in 30 days. **Price is the symptom of a missing judgement aid — not a demand for money.**

- **Segment:** Stalled Shortlister — saves, returns, leaves without deciding. Sale-watchers are a control, not the audience.
- **Primary outcome:** shortlist-to-decision (buy or drop). Removals count.
- **Secondary:** uncertainty resolution (fit / quality from other shoppers).
- **Evolution:** W2P → revisit / resolve / decide / act → scrape (fit #1) → questionnaire (decide + value confidence) → lock.
- **Tree:** proceed, re-scoped — explicitly without an incentive.

Falsify by holding price constant. If price still dominates in segment, **stop** — do not ship a coupon.

---

## Slide 7 — Studio finishes the call with a room and a coach — never a coupon.

Why this, not recs + discount: comparison is confirmed three ways; value confidence is the top requested *help*; Q14 does not support an “AI picks winners” framing.

**Shopper path (Phase 5, decision-first)**

1. **Save similar** — two or more of the same kind. `/wishlist`
2. **Hang two** — same rack, price off. `/studio?view=room`
3. **Keep one** — tap bust, length, or foot; size from shopper notes.
4. **Ask the coach** — fit · wear · worth as **cost-per-wear** (not a lower ticket). Rule-based first; Groq may rephrase prose only. Never discounts, EOSS, or urgency.

Guardrails in code: cite evidence; confidence bands, not guarantees; sale-wait takes the look off the hanger.

---

## Slide 8 — One storefront to test: discovery, room, and coach

| Layer | What ships |
|---|---|
| Client | Shop → wishlist → Studio room → coach (fit / wear / worth) |
| API | Ingest · analyze · compare · value · events (Phase-5 contracts) |
| Intelligence | Quote-grounded scrape → rank 0.4 / 0.4 / 0.2 → Groq (extract + optional rewrite) |
| Data | `themes.json`, ranking, survey, problem lock; SQLite in Phase-5 |
| Deploy | Intended host: **Netlify** (`netlify.toml`). Test: `cd Phase-1 && npm run dev` |
| Metric hooks | `coach_opened` · `compare_completed` · `uncertainty_resolved` · `cart_add_simulated` — **proxies** |

- [Room](http://localhost:3000/studio?view=room) · [Coach](http://localhost:3000/studio?view=coach) · [Stories](http://localhost:3000/studio?view=stories) · [Survey](http://localhost:3000/survey)
- [Form](https://docs.google.com/forms/d/e/1FAIpQLScmH7Z4FoFH7Y4XzsaMIR2prioWoh6AuHQVxfptRc3qmEzMZQ/viewform)

---

## Slide 9 — A finished decision is a win. A coupon tap is not.

| Layer | Metric | Definition | Why this one |
|---|---|---|---|
| North star | W2P 30d | Buyers of ≥1 wishlist item in 30d ÷ savers | The brief |
| Primary | Shortlist-to-decision | Bought **or** deliberately dropped in 30d ÷ saves | Decide node |
| Secondary | Uncertainty resolution | Doubt-cleared items ÷ items with a recorded doubt | Resolve; ships with Decide |
| Leading | Wishlist reopen | Open wishlist in 30d ÷ savers | Revisit |
| Leading | Room / coach use | Coach opened or keep-one completed ÷ eligible shortlists | Mechanism |
| Guardrail | No paid conversion | Coupon / sale-alert / price-drop click ≠ success | Constraint |
| Guardrail | Returns and time-to-bag | Return rate must not rise; time-to-bag must not worsen | Honest fit can scare some buys |

Demo cart/purchase flags are **proxies**. **Kill if:** follow-up talks hold price constant and price still dominates in segment.

---

## Slide 10 — Thin segment. Still-binding price. Fake certainty.

| Risk | Why it hurts | Mitigation |
|---|---|---|
| In-segment n = 2 | Segment claims rest on two people; both asked for a discount on Q12 | Label it. Recruit stallers. Ask Q3/Q4 with price frozen. |
| Price is actually binding | Constraint conflict becomes terminal | Decision tree already says **stop**, not coupon. |
| LLM invents fit / hybrid gaps | 3 extract batches failed; 7 themes gap-filled | Quotes must match text. Empty cells stay empty. Rule-based first on coach. |
| App-store noise | Delivery / support swamp the hesitation moment | Drop ops reviews. Do not treat post-delivery fit as pre-purchase proof. |
| Coach feels like an oracle | Q14 mean 2.89; one flat zero | Three questions, not a winner. No urgency. |

**Next:** a handful of moderated stalls with price held constant. If price still wins, stop. If a verdict still wins, keep the room and the coach.
