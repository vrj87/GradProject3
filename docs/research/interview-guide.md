# Research instrument and protocol (Part 3)

> **Fielded as:** a self-completed structured questionnaire, not a moderated interview
> **Live form:** [Fashion Wishlist → Purchase](https://docs.google.com/forms/d/e/1FAIpQLScmH7Z4FoFH7Y4XzsaMIR2prioWoh6AuHQVxfptRc3qmEzMZQ/viewform)
> **Raw export:** [`docs/grad3 survey response.xlsx`](../grad3%20survey%20response.xlsx)
> **Screening:** [`screener.md`](./screener.md) · **Records:** [`interview-notes/`](./interview-notes/README.md)
> **Definition of record:** `Phase-1/packages/discovery-core/src/survey.ts`
> **Public results:** `/survey` in the storefront

## Protocol

| Aspect | Choice |
|--------|--------|
| Mode | Self-completed form, no moderator |
| Length | 14 questions, 4–5 minutes |
| Sequence | Screening (Q1–Q3, Q6) → behaviour (Q4, Q5, Q7) → doubt (Q8–Q10) → workaround (Q11) → desired help (Q12, Q13) → concept reaction (Q14) |
| Answer types | Single choice, multi-select, and two unlabelled sliders (Q9, Q14) |
| Fielded | 28–31 Aug 2026 · n = 9 |
| PII | None collected — no name, email, or contact detail |
| Analysis | `summarizeSurvey()`, run by `npm run survey`; no count is transcribed by hand |

The instrument is seeded from `themes.json` as [architecture.md](../architecture.md) Phase 3
requires: each question carries `scrapeQueries`, `keepKeywords`, `researchQuestionIds`, and
`themeIds`, so every prompt is traceable to a discovery theme and to a Q1–Q10 research question.

**Trade-off of the mode.** A form reaches more people and removes moderator bias, but it cannot
probe. Where an interviewer would ask "why?", the form gets a chosen option and stops. That
matters for the price findings below.

## The 14 questions

| Q | Question | Role |
|---|----------|------|
| 1 | Which fashion shopping platforms do you use regularly? | screen |
| 2 | How frequently do you shop for fashion online? | screen |
| 3 | Do you currently use a wishlist/favourites feature? | screen |
| 4 | Approximately how many products do you have saved? | evidence |
| 5 | How often do you eventually purchase what you wishlist? | evidence |
| 6 | When did you last add something and not buy it? | screen |
| 7 | Why do you usually add a product to your wishlist? | evidence |
| 8 | For a recent unbought save, what was the MAIN reason? | evidence |
| 9 | How confident were you it would be right for you? | evidence |
| 10 | When you don't buy immediately, what are you uncertain about? | evidence |
| 11 | Before purchasing a wishlisted product, what do you do? | evidence |
| 12 | What ONE thing would most likely make you purchase? | evidence |
| 13 | If you could get help with ONE thing while deciding, what? | evidence |
| 14 | How useful would an AI that picks wishlist winners be? | survey-only |

## Coverage of the eight brief questions

The eight prompts below are the Part 3 interview seeds generated in
`phase-2/data/nomination.json`. All eight are covered by the instrument; two are covered only
partially, and that limitation shapes how the results must be read.

| # | Brief prompt | Covered by | Coverage |
|---|--------------|-----------|----------|
| 1 | Why did you save each item? | Q7 | **Full** |
| 2 | Do you still intend to buy it? What changed? | Q5, Q6 | **Full** |
| 3 | What is stopping you this week *even if the price stayed the same*? | Q8, Q10 | **Partial** — price not held constant |
| 4 | What would need to be true to purchase *without waiting for a sale*? | Q12 | **Partial** — "price drop" was an offered option |
| 5 | What information are you still missing? | Q10, Q13 | **Full** |
| 6 | Are you considering alternatives, on Myntra or elsewhere? | Q7, Q11 | **Full** |
| 7 | What did you do outside the app before deciding? | Q11 | **Full** |
| 8 | How do you compare multiple wishlisted items today? | Q11, Q13 | **Full** |

### Why the partial coverage matters

Brief questions 3 and 4 deliberately **hold price constant** — they ask what blocks the purchase
*if the price does not move*. The questionnaire did not carry that constraint: Q8 offered "It was
too expensive" and Q12 offered "Price drop/discount" as ordinary options.

So the survey's price-heavy result cannot distinguish between two very different worlds:

1. Price genuinely is the binding constraint, or
2. Price was the easiest available answer, and the underlying doubt goes unstated.

Q13 is the closest thing to a controlled read, because **none of its options is a discount** —
and there, the top answer is "understanding whether the price is good". That is consistent with
world 2, but it does not prove it.

This is the single biggest gap in Phase 3 and the strongest argument for follow-up interviews:
ask brief questions 3 and 4 as written, with price explicitly frozen, and see what remains.

## Out of scope for this phase

Per [architecture.md](../architecture.md) Phase 3: no invented participant quotes, no product
copy, no MVP surfaces. The concept reaction in Q14 is recorded but is **not** treated as
validation of any build.
