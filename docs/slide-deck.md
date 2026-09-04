# 10-slide deck copy (Myntra W2P 30d)

Canonical copy for [`myntra-w2p-30d-deck.pdf`](./myntra-w2p-30d-deck.pdf). Print from [`deck/10-slides.html`](./deck/10-slides.html).

Built to [ProjectDetails.md](./ProjectDetails.md) (Parts 1–7 + deck guidelines), [problem-definition.md](./problem-definition.md) (the lock), and [architecture.md](./architecture.md) (phase map, contracts, metric tree, coach guardrails).

Visual: NextLeap 16:9 template with Myntra chrome — navy rail `#282C3F`, pink `#FF3F6C`, maroon titles, dashed cards. Body ≥ 14pt. Flex layout so the 7.5in canvas is filled.

**Guidelines met:** no fellow name · 10 slides · body ≥ 14pt · titles are the key message · contrast on colour · colour-blind-safe (labels and column headers, not colour alone) · artefacts hyperlinked.

Public artefacts: [questionnaire](https://docs.google.com/forms/d/e/1FAIpQLScmH7Z4FoFH7Y4XzsaMIR2prioWoh6AuHQVxfptRc3qmEzMZQ/viewform) · live Studio [https://w2p-30days.netlify.app/studio](https://w2p-30days.netlify.app/studio). No GitHub URL on the slides.

---

## Slide 1 — Saved items already show intent. Thirty-day conversion still fails without a coupon.

- Product: **Myntra**. Role: Growth PM.
- North star: **W2P 30d** = users who buy ≥1 wishlisted item within 30 days of saving it ÷ users who saved ≥1 item.
- Constraint: **no monetary incentives** as the core lever — no coupons, cashback, sale alerts, EOSS nags, or price-drop waits.
- Job: a wishlist is explicit interest that stalls. Discover *why*, then **finish a judgement** inside the list.
- User value (lock §5): defensible choice · defensible price · fewer open loops · lower risk of being wrong. Felt benefit = **closure**.
- Business value (lock §6): W2P through decision completion at full price; margin protected; returns fall where fit is resolved before try-and-buy; demand can leave sale weeks if waiting is a missing aid.
- Evidence snapshot: **895** reviews · **150** kept · **12** themes · **9** questionnaire · **2/9** in-segment.

---

## Slide 2 — W2P 30d only moves if shoppers return, finish a judgement, then act

Each node has a **definition** and a **rationale**.

| Node | Definition | Rationale after lock |
|---|---|---|
| Revisit | Open the wishlist within 30 days of a save | Necessary. If they never return, nothing converts. Not the bet. |
| Resolve (secondary) | Blocking doubt (fit, quality, look) is gone | Scrape ranked it #1; research keeps it real and not the decider. Ships with Decide. |
| Decide (primary) | Among ≥2 similar saves, buy **or** deliberate drop in 30d | Only lever confirmed three ways. Removals count. |
| Act | Wishlist item → bag / checkout in 30d | Last step. A coupon tap is not a win. |

Decide **8/9** vs Resolve **7/9** — margin of one person, so both ship. S3 sale-watchers are a control. Price-waiting is **ranked** (0.83 / 0.39) then **set aside** because the brief forbids paying for conversion. Architecture: Discovery informs ranking; an MVP may only target Resolve and Decide.

---

## Slide 3 — Public shopper voice becomes ranked opportunities, not a sentiment chart

**1-slider** ([architecture.md](./architecture.md))

Collect (App/Play/Reddit/YouTube/forums) → Keep (drop &lt;8 words / off-topic / SHA-256 dupes; keyword gate) → Group (≥2 quotes; Q1–Q10; metric node) → Score (`0.4 × impact + 0.4 × non-monetary feasibility + 0.2 × frequency`; high = 1 · medium = 0.6 · low = 0.3) → Gate (price-flagged rows ranked then excluded; no lock until research).

Funnel: 895 read · 503 too short · 239 off-topic · 3 dupes · **150** kept. Sources: App Store 568 · Play Store 303 · Reddit 10 · YouTube 3 · forum 3 · Myntra review 2 · other 6. Hybrid extract: 3 LLM batches failed; 7 themes gap-filled. 12 validated themes. Empty cells stay empty. Sentiment-only fails the brief.

Test: [live voices](https://w2p-30days.netlify.app/studio?view=stories) · [Q1–Q10](https://w2p-30days.netlify.app/studio?view=questions) · [what to focus on](https://w2p-30days.netlify.app/studio?view=focus)

---

## Slide 4 — Fit ranked first. Sale-wait is #2 — and we still will not use it.

**895** → **150** → **12** compared. Ranking nominated fit / size anxiety → resolve. **Not locked.**

| Rank | Opportunity | Score | Node | Note |
|---|---|---|---|---|
| 1 | Fit / size | 0.87 | Resolve | Nominated. ~37% of kept comments. |
| 2 | Sale-wait | 0.83 | Decide | **Price-flagged.** Not the MVP. |
| 3 | Compare saves | 0.82 | Decide | Research kept. Primary after lock. |
| 4–6 | Style · compare difficulty · occasion | 0.82 | Decide / Resolve | Same score band. |
| 7 | Return fear | 0.72 | Resolve | ~38% of kept comments. |
| 8–11 | Decay · review trust · bookmark · social | 0.65–0.49 | Revisit / Resolve | Confirmed or moderate later. |
| 12 | Sale-waitlist | 0.39 | Revisit | **Price-flagged.** |

Ranking: [studio?view=focus](https://w2p-30days.netlify.app/studio?view=focus)

---

## Slide 5 — Shoppers say price. Asked for help, they want a verdict — not a coupon.

Structured questionnaire, **n = 9**, 28–31 Aug 2026 — not 5–6 live interviews. [Form](https://docs.google.com/forms/d/e/1FAIpQLScmH7Z4FoFH7Y4XzsaMIR2prioWoh6AuHQVxfptRc3qmEzMZQ/viewform) · [/survey](https://w2p-30days.netlify.app/survey)

- Who: Myntra 7/9 · uses wishlist 6/9 · holds 1–5 saves 6/9 · unbought save 9/9 · strict staller **2/9** (R03, R07; target 5).
- Q8: price-shaped **5/9**; fit as the *main* reason **0/9**. Q9 confidence mean **2.89**. Q14 AI-winners mean **2.89** — framing dropped.
- Q11 behaviour: reviews **8/9** · photos **7/9** · in-app compare **6/9** · fit reviews **5/9** · wait for a sale **2/9**.
- Q12 unlock: discount **4** vs information **5**. Q13 (no discount option): “is this price good?” **4/9**; best of saves **2/9**; alternatives **1/9**.
- **Load-bearing:** all four discount-seekers (R01, R03, R05, R07) switched to information on Q13 — including both in-segment respondents.
- Confirmed: decay, low confidence, comparison (save 4/9 · Q11 6/9 · help 3/9), review-reliance. Challenged: fit as #1, clutter, sale-wait as fringe. **New:** fair-price verdict — unbuilt. Price was not held constant. No invented quotes.

---

## Slide 6 — The stalled shortlister cannot finish a judgement inside the wishlist.

**Locked root cause:** a wishlist captures interest but offers no way to finish a judgement — neither *which of these* nor *is it worth what it costs*. The only tool the app offers is a falling price. **Price is the symptom of a missing judgement aid — not a demand for money.** incentive Allowed is false.

- **Segment:** Stalled Shortlister. ≥2 saves in 30d, ≤1 purchased, ≥2 of the same kind (floors lowered from 3 because 6/9 hold 1–5). Sale-watchers are a control. In-segment n = 2 — labelled.
- **Primary:** shortlist-to-decision (buy or drop). Removals count.
- **Secondary:** uncertainty resolution (fit / quality from other shoppers).
- **Required, unbuilt:** value confidence — “is this a fair price, and should I decide now?”
- **Tree:** price-dominant fired non-terminal; fork fired (Decide over Resolve); clean proceed-as-specified did **not** fire. Outcome: proceed, re-scoped, no incentive.
- **Falsify:** hold price constant. If it still wins in segment — **stop. Do not ship a coupon.**

---

## Slide 7 — One Studio tab finishes the call — hang, name the doubt, ask the coach

Rejected: recs + discount · sale alerts / EOSS · AI that picks winners (Q14).

**Chosen path (one shopper tab)**

1. **Save similar** — two or more of the same kind. [/wishlist](https://w2p-30days.netlify.app/wishlist)
2. **Pick two & hang** — same kind, same gender, price off. One Studio tab. [/studio](https://w2p-30days.netlify.app/studio)
3. **Name the doubt** — tap bust, length, or foot. Size from shopper notes; bands, not guarantees.
4. **Ask the coach** — fit · wear · **worth as cost-per-wear**, still on that pair, same tab. Then keep one to bag.

Why this room stays a separate evidence tab. **Honest gap:** “is this a fair price?” is the top requested help and is not a market-price verdict in this build. Cost-per-wear is the non-monetary stand-in. Guardrails: evidence ids; &lt;3 reviews → low band; sale-wait takes the look off the hanger; coupons / EOSS / urgency rejected.

---

## Slide 8 — One storefront to test: discovery and one Studio path

Live demo: **[w2p-30days.netlify.app](https://w2p-30days.netlify.app/)** — shop, wishlist, studio, and evidence on one storefront.

Shop → wishlist → **The studio** (pick two · hang · doubt · coach) → Why this room (evidence).

| Layer | What ships |
|---|---|
| Client | Shop → wishlist → The studio (one tab) + Why this room + discovery tabs |
| API | Ingest · analyze · compare · value · events. Coach Insights |
| Intelligence | Quote-grounded scrape → rank 0.4 / 0.4 / 0.2 → rule-based first, RAG from `themes.json` |
| Data | `themes.json`, ranking, survey, problem lock |
| Deploy | **Netlify:** [w2p-30days.netlify.app](https://w2p-30days.netlify.app/) |
| Worth | Cost per wear on the pair — not a lower ticket, not a coupon |

- [Studio](https://w2p-30days.netlify.app/studio?view=room) · [Coach step](https://w2p-30days.netlify.app/studio?view=room&step=keep) · [Stories](https://w2p-30days.netlify.app/studio?view=stories) · [Ranking](https://w2p-30days.netlify.app/studio?view=focus) · [Survey](https://w2p-30days.netlify.app/survey)
- [Form](https://docs.google.com/forms/d/e/1FAIpQLScmH7Z4FoFH7Y4XzsaMIR2prioWoh6AuHQVxfptRc3qmEzMZQ/viewform)

---

## Slide 9 — A finished decision is a win. A coupon tap is not.

| Layer | Metric | Definition | Rationale |
|---|---|---|---|
| North star | W2P 30d | Buyers of ≥1 wishlist item in 30d ÷ savers | The brief |
| Primary | Shortlist-to-decision | Bought **or** deliberately dropped in 30d ÷ saves | Decide node |
| Secondary | Uncertainty resolution | Doubt-cleared items ÷ items with a recorded doubt | Resolve; ships with Decide |
| Leading | Wishlist reopen | Open wishlist in 30d ÷ savers | Revisit |
| Leading | Room / coach use | Coach opened or keep-one completed ÷ eligible shortlists | Mechanism. Compare completed ÷ compare starts. |
| Guardrail | No paid conversion | Coupon / sale-alert / price-drop click ≠ success | Constraint |
| Guardrail | Returns and time-to-bag | Return rate must not rise; time-to-bag must not worsen | Honest fit can scare some buys |

Demo flags are **proxies**. **Kill if:** follow-up talks hold price constant and price still dominates in segment.

---

## Slide 10 — Thin segment. Still-binding price. Fake certainty.

| Risk | Why it hurts | Mitigation |
|---|---|---|
| In-segment n = 2 | Segment claims rest on two people; both asked for a discount on Q12 | Label it. Recruit stallers. |
| Price is actually binding | Constraint conflict becomes terminal | Tree already says **stop**, not coupon. Ask Q3/Q4 with price frozen. |
| Value confidence missing | Top requested help; cost-per-wear is a proxy | Name the gap. Next build is a non-monetary verdict. |
| LLM / hybrid gaps | 3 extract batches failed; 7 themes gap-filled | Quotes must match text. Empty cells stay empty. Rule-based first. |
| App-store noise | Delivery / support swamp the hesitation moment | Drop ops reviews. Questionnaire carries the lock. |
| Oracle framing / returns | Q14 mean 2.89; overconfident size advice | Three questions, not a winner. Confidence bands. Return guardrail. |

**Next:** a handful of moderated stalls with price held constant. If price still wins, stop. If a verdict still wins, keep the room and the coach.
