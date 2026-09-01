# Primary research: synthesis (Part 3)

> **Status:** delivered — primary research was fielded as a structured questionnaire
> **Instrument and protocol:** [`interview-guide.md`](./interview-guide.md)
> **Screening and who answered:** [`screener.md`](./screener.md)
> **Theme reconciliation:** [`validation-matrix.md`](./validation-matrix.md)
> **Per-participant records:** [`interview-notes/`](./interview-notes/README.md)
> **Raw export:** [`docs/grad3 survey response.xlsx`](../grad3%20survey%20response.xlsx)
> **Artefacts:** `Phase-1/data/survey/survey-{responses,summary}.json` · published at `/survey`
> **Regenerate:** `cd Phase-1 && npm run survey`
> **Respondents:** 9 · collected 28–31 Aug 2026
> **Metric under test:** W2P 30d · **Constraint:** no monetary incentive as the core lever

Every count in this document is computed from the export by `summarizeSurvey()`. Nothing is
hand-tallied, so re-running `npm run survey` after new responses arrive will contradict this
document rather than quietly agree with it.

---

## 1. Who answered

| Screen | Result |
|--------|--------|
| Platforms (Q1) | Myntra 7/9 · Amazon 4 · Flipkart 3 · AJIO 1 · Nykaa Fashion 1 |
| Shopping frequency (Q2) | Once every 2–3 months 5 · multiple times a month 2 · monthly 1 · few times a year 1 |
| Uses a wishlist (Q3) | **Yes 6 · No 3** |
| Saved items (Q4) | 1–5 → 6 · more than 50 → 2 · don’t remember → 1 |
| Buys what they save (Q5) | Almost always 3 · sometimes 3 · often 1 · almost never 2 |
| Last unbought save (Q6) | Every respondent has one; 4 within the last month |

**Segment reality check.** The P1 Wishlist Staller in
[architecture.md](../architecture.md) Phase 4 is someone who saves and does *not* convert.
Applying that to the data — uses a wishlist **and** buys from it only “sometimes” or “almost
never” — leaves **2 of 9** respondents in segment (`r03`, `r07`). Six use a wishlist at all;
five stall on their saves regardless of whether they call it a wishlist.

---

## 2. What the answers say

### The stated barrier is price

| Q8 — main reason a recent save went unbought | n |
|---|---|
| It was too expensive | 4 |
| I wasn’t sure about the quality | 2 |
| I was waiting for a discount | 1 |
| I was waiting for the right occasion | 1 |
| I was still deciding | 1 |

Price-shaped reasons account for **5 of 9**. Q10 agrees: **Price/value is the single most cited
uncertainty at 7/9**, ahead of quality (3), size (3), fit (2), and “how it will look on me” (2).
Q7 shows the same intent at save time — “I want to wait for a better price” ties for the top
reason people add to a wishlist at all (6/9).

### The requested remedy is mostly information, not money

| Q12 — the ONE thing that would make them buy | n | Lever |
|---|---|---|
| Price drop/discount | 4 | monetary |
| Better fit/size information | 1 | information |
| Better quality information | 1 | information |
| Better reviews/ratings | 1 | information |
| Easier returns/exchanges | 1 | information |
| Knowing whether I should buy now or wait | 1 | information |

**5 information vs 4 monetary.** The split is narrow, and it is the number that decides whether
this project is allowed to exist under its own constraint.

Q13 is more decisive, because none of its options is a discount:

| Q13 — help with ONE thing while deciding | n |
|---|---|
| Understanding whether the price is good | 4 |
| Finding the best product among my wishlist | 2 |
| Comparing it with alternatives | 1 |
| Understanding product quality | 1 |
| Understanding reviews better | 1 |

Read together: shoppers describe their problem in the language of price, but when asked what
*help* they want, they ask to be told **whether the price is fair** and **which of their saves is
the best one** — both information problems. “Is this a good price” is not the same request as
“give me a coupon”, and only the first is available to us.

### Comparison and review-reading are already the shopper’s ritual

| Q11 — what they do before buying a save | n |
|---|---|
| Read customer reviews | 8 |
| Look at customer photos | 7 |
| Compare with other products on the same app | 6 |
| Check size/fit reviews | 5 |
| Check Instagram/YouTube | 2 |
| Wait for a sale | 2 |

Comparison shows up three times independently: as a reason to save (Q7, 4/9), as pre-purchase
behaviour (Q11, 6/9), and as requested help (Q13, 3/9 across “best product among my wishlist”
and “comparing with alternatives”). Reviews and customer photos are near-universal, which
supports the quote-grounded approach in
[architecture.md](../architecture.md) Appendix A rather than any generative claim about fit.

### Confidence is low, and enthusiasm for an AI verdict is mild

Q9, confidence that a saved product is right for them: values `[3, 2, 2, 6, 4, 0, 3, 3, 3]`,
mean **2.89**, observed range 0–6. Low confidence is the premise of the whole project, and it
holds.

Q14, usefulness of an AI that picks wishlist winners: values `[3, 2, 2, 5, 2, 0, 4, 5, 3]`,
mean **2.89**, observed range 0–5. Two respondents are enthusiastic, three are lukewarm, one is
a flat zero. This is **not** a mandate for an AI-verdict framing.

The form did not export the slider bounds, so both means should be read as relative, not as a
percentage of a known maximum.

---

## 3. Validation matrix

The full theme-by-theme reconciliation lives in
[`validation-matrix.md`](./validation-matrix.md). In short: **wishlist decay, low confidence,
comparison, and review reliance are confirmed**; **fit-as-the-leading-barrier, price-as-mere-
waiting, and the cluttered-wishlist premise are challenged**; the AI-verdict framing is **not
supported**; and “is this price fair?” arrives as a **new** finding absent from the themes.

---

## 3a. What the instrument could not settle

Brief questions 3 and 4 hold price constant on purpose — they ask what blocks the purchase *if
the price does not move*. The questionnaire did not carry that constraint: Q8 offered “It was too
expensive” and Q12 offered “Price drop/discount” as ordinary options.

So the price-heavy result cannot separate two different worlds:

1. Price is genuinely the binding constraint, or
2. Price was the easiest available answer, and the real doubt went unstated.

Q13 is the nearest controlled read, because none of its options is a discount — and there the top
answer is “understanding whether the price is good”, which is information rather than money.
That is consistent with world 2 without proving it. Anyone quoting the 5/9 price figure should
quote this caveat with it.

---

## 4. Consequences for the build

The Phase 4 decision tree in [architecture.md](../architecture.md) has a **price-dominant**
branch, and this survey lands close to it. The tree’s instruction for that branch is explicit:
*do not implement an incentive MVP.* So the finding does not license discounts — it forces a
choice about what non-monetary help to build.

1. **The room’s fit-first framing is narrower than the evidence.** Fit and size are genuine
   (5/9) but secondary; only one respondent picks fit information as the unlock. Presenting fit
   as *the* barrier overstates what these nine people said.
2. **Value confidence is the missing surface.** “Understanding whether the price is good”
   (4/9) and “should I buy now or wait” (1/9) are unbuilt, and both are information, not money.
   Nothing in the current storefront answers them.
3. **Comparison is the strongest confirmed lever** and is already built — the keep-one-hanger
   ritual maps directly onto Q13’s “finding the best product among my wishlist”.
4. **Drop the AI-verdict language.** Q14 does not support it; the evidence-and-comparison
   framing is better supported than an assistant that pronounces winners.

---

## 5. Phase 3 exit status

[architecture.md](../architecture.md) Phase 3 asks for a fielded instrument, anonymized records,
a non-empty validation matrix, coverage of the eight brief questions, and n ≥ 5 in segment.

| Exit criterion | Status |
|---|---|
| Instrument documented and fielded | **Met** — [`interview-guide.md`](./interview-guide.md), 9 responses |
| Screener recorded | **Met** — [`screener.md`](./screener.md) |
| Anonymized participant records | **Met** — [`interview-notes/`](./interview-notes/README.md), 9 records, generated from the export |
| Validation matrix non-empty | **Met** — [`validation-matrix.md`](./validation-matrix.md) |
| Eight brief questions covered | **Met** — 6 fully, 2 partially (see §3a) |
| No invented participant material | **Met** — records are generated, never authored |
| n ≥ 5 in segment | **Below target** — 2 in segment (R03, R07) of 9 respondents |

Primary research is therefore **done as a questionnaire study**, with two limitations that travel
with every conclusion drawn from it:

1. **n = 9 is a signal, not a result.** The information-versus-discount split in Q12 is 5–4 —
   one further respondent could flip it.
2. **Segment-specific claims rest on two people.** Both of them asked for a discount, which is
   the sharpest available challenge to the non-monetary thesis, and n = 2 is far too small to act
   on in either direction.

The highest-value follow-up is small and specific: a handful of moderated conversations with
wishlist users who hold several saves and rarely buy from them, asking brief questions 3 and 4
**as written**, with price explicitly frozen. That is the only way to settle §3a. Everything the
questionnaire *can* answer, it has.
