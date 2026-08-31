# 10-slide deck copy (Myntra W2P 30d)

Use these **titles as-is**. They are the key message, not a section label. Keep body text at **14pt or larger**. Do not put a fellow name on any slide. Hyperlink the live Studio and wishlist once the Vercel URL is public.

Interviews are **planned, not invented**. Do not add fake respondents.

---

## Slide 1 — Saved items already show intent; 30-day conversion still fails without a coupon

- Product: Myntra. Role: Growth PM.
- North star: **% of users who buy ≥1 wishlisted item within 30 days of saving it**.
- Constraint: **no monetary incentives** (no coupons, cashback, sale alerts, or price-drop nags as the solution).
- Wishlist is high intent that stalls. The job is to find *why* they wait, then help them decide — not to pay them to buy.
- **Creativity:** Fitting Room (tap the body, keep one). **Metrics:** written W2P tree. **Clarity:** fit nominated, not locked.

---

## Slide 2 — W2P 30d only moves if shoppers come back, clear the doubt, pick one, then add to bag

**W2P 30d** = users who purchase ≥1 wishlisted item in 30 days ÷ users who saved ≥1 item.

| Product outcome | Definition | Why it sits on the path |
|---|---|---|
| Revisit | Open the wishlist within 30 days of a save | If they never return, nothing converts |
| Resolve | Blocking doubt (fit, style, trust) is gone | Fit is the nominated non-sale lever |
| Decide | Among 2+ similar saves, narrow to one in 30d | A pile of kurtas is not a purchase |
| Act | Wishlist item → bag / checkout in 30d | Last step; coupon taps do not count |

Price-waiting is real and is ranked. It is **set aside** because the brief forbids paying for conversion.

---

## Slide 3 — Public shopper voice becomes ranked opportunities, not a sentiment chart

**1-slider workflow**

Collect live App Store + Play Store (+ community) reviews → drop short and off-topic lines → keep save / fit / compare / wait talk → group repeating worries → **score each area** → nominate a non-sale lever → **do not lock** until interviews.

**Score** = `0.4 × impact + 0.4 × non-monetary feasibility + 0.2 × frequency`  
high = 1, medium = 0.6, low = 0.3. Empty cells stay empty. Price-flagged rows are ranked, then excluded from the product bet.

Live surface: **/studio** — Save similar → Hang two → Keep one → See the bet (The room is the default tab; Live voices / ranking live under the same Studio).

---

## Slide 4 — Fit-and-size doubt is the top non-sale blocker; sale-waiting is #2 and we still will not use it

Latest collection (order of magnitude; refresh dates live in Studio):

- **633** public reviews read → **61** about saving or waiting → **12** patterns compared.
- **Fit and size** — rank 1, score **0.87**, ~37% of wishlist comments, high impact, high non-monetary feasibility.
- **Waiting for a sale** — rank 2, score **0.83**, **price-flagged**. Counted so we do not pretend it is rare. Not the MVP.
- **Choosing between saved items** — rank 3, score **0.82**. The decide-side partner to fit.

Quotes on Studio and PDP are from public reviews with source links. Praise-only “perfect fit” lines are dropped.

---

## Slide 5 — Interviews are the next gate, not a finished story we made up

Who to talk to: **shoppers who save, stall on fit, and keep two or three similar looks** (S2 ∩ S4). Five or six conversations. Same eight prompts.

Questionnaire (open now; response sheet still pending): [Fashion Wishlist → Purchase survey](https://docs.google.com/forms/d/e/1FAIpQLScmH7Z4FoFH7Y4XzsaMIR2prioWoh6AuHQVxfptRc3qmEzMZQ/viewform)

The form is a screen, not a substitute for the 5–6 interviews. Price/sale options are on the form on purpose so we can still kill Fit Insight.

What we will ask (already in Studio → What we'd ask):

1. Why did you save each item?
2. Do you still intend to buy it? What changed?
3. What is stopping you this week even if the price stayed the same?
4. What would need to be true to purchase without waiting for a sale?
5. What information are you still missing?
6. Are you considering alternatives — on Myntra or elsewhere?
7. What did you do outside the app before deciding?
8. How do you compare multiple wishlisted items today?

**If they mostly wait for a sale, we change the problem.** We will not invent respondents to keep Fit Insight alive.

---

## Slide 6 — Nominated problem: size and occasion stay unclear after the look is already liked

- **Segment (nominated):** people who save festive / similar looks, then wait because bust, length, or size still feels uncertain, and who keep comparing two or three options.
- **Product outcome:** raise **uncertainty resolution** and **shortlist-to-one**, so cart-add from wishlist can move W2P 30d.
- **Root cause (working):** the page and the wishlist do not settle fit or pick a winner; they only store the like.
- **Workaround today:** save many similar sets, read comments, order two sizes, or wait for a sale.
- **Evolution:** business metric → revisit / resolve / decide / act → public-voice ranking → **Fit + compare nominated, price set aside** → interviews still required to lock or kill.

This is a nomination, not a locked PRD.

---

## Slide 7 — The creative bet is Studio: a fitting room, not recs plus a discount

What ships in the storefront — **one MVP**, four steps:

1. **Save similar** (`/wishlist`) — shortlist two or more of the same kind.
2. **Hang two** (`/studio`, The room) — same rack, same gender. Price is off.
3. **Keep one** — tap bust, length, or foot; **both looks show the same zone**. Size from shopper notes. The deeper % off is struck through.
4. **See the bet** (`/studio?view=bet`) — why this room exists, scored in the open.

- **Sale wait:** take the look off the rack. The room never adds a coupon.
- **Product page:** the same body pins, then “hang it in the room”.
- `/decide` redirects into Studio so old links still work.

Why this is the bet: fit is common, it blocks the buy, and we can help without paying. Why it can still die: interviews may show a sale waitlist, not a fit waitlist.

---

## Slide 8 — The discovery storefront is one deployable surface: shop + Studio

- **Client:** Myntra-like shop → PDP body pins → **Studio** (save → hang → keep one → see the bet).
- **Intelligence:** scrape → normalize → theme → rank (`0.4 / 0.4 / 0.2`) → Phase-2 nomination JSON.
- **Data:** `themes.json`, `opportunity-ranking.json`, `nomination.json`, `metric-tree.json` copied into the static host so production does not depend on a local API.
- **Deploy:** Vercel (repo root `vercel.json` builds `Phase-1/apps/storefront`). Local: `http://localhost:3000/` · Studio `/studio` (room by default) · Wishlist `/wishlist`.
- Paste the **public URL** here after deploy. Evaluators must click it.

---

## Slide 9 — Data & metrics: W2P is a formula; a coupon tap is not a win

| Layer | Metric | Formula | Rationale |
|---|---|---|---|
| North star | W2P 30d | Buyers of ≥1 wishlist item in 30d ÷ wishlist adders | The brief |
| Primary | Uncertainty resolution | Doubt-cleared items ÷ items with a recorded doubt | Nominated lever |
| Primary | Shortlist-to-one | Users who narrow 2+ similar saves to 1 ÷ users with 2+ similar saves | Decide node |
| Leading | Wishlist reopen | Open wishlist in 30d ÷ savers | Revisit |
| Leading | Wishlist cart-add | Items moved to bag in 30d ÷ wishlisted items | Act; no coupon |
| Guardrail | No paid conversion | Coupon / sale-alert / price-drop click ≠ success | Constraint |
| Guardrail | Time-to-bag | Must not worsen while resolution rises | A scary size note can delay |

**Kill if:** 4 of 6 interviews would buy as soon as price drops even when size is clear; compare is used to hunt discounts; “runs small” with no size action slows bag-add.

---

## Slide 10 — Main risks are fake certainty, sale-waiting, and shipping a locked product too early

| Risk | Why it hurts | What we do |
|---|---|---|
| App-store noise | Many reviews are delivery / support | Drop them; quotes must match review text |
| Sale-waiting is common | Easy to “win” with coupons | Rank it, flag it, refuse it as the product |
| Invented interviews | Looked like insight, scored as fiction | Seeds only; no fake respondents |
| Size note delays some buys | Honest fit can scare people off | Guardrail on time-to-bag |
| Hybrid extraction / LLM gaps | Some batches fail; themes may be thin | Show funnel counts; empty cells stay empty |

**Next:** run the eight prompts with 5–6 shoppers. Confirm or kill Fit Insight. Only then lock the problem and thicken the MVP.

**Links:** Studio · Wishlist compare · scrape download (on the live site) · [questionnaire](https://docs.google.com/forms/d/e/1FAIpQLScmH7Z4FoFH7Y4XzsaMIR2prioWoh6AuHQVxfptRc3qmEzMZQ/viewform) · response sheet (add when live).
