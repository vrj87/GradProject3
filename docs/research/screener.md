# Screener: who we wanted, and who answered (Part 3)

> **Instrument:** [`interview-guide.md`](./interview-guide.md)
> **Records:** [`interview-notes/`](./interview-notes/README.md)
> **Findings:** [`synthesis.md`](./synthesis.md) · [`validation-matrix.md`](./validation-matrix.md)

Primary research was fielded as a structured questionnaire rather than moderated
interviews. Screening therefore happens **in the instrument** — Q1–Q3 and Q6 are the screening
items, and every respondent answers them before the evidence questions. Nobody is turned away at
the door; instead each record carries its own eligibility flags, and the analysis reports
in-segment and out-of-segment counts separately.

## Target

The nomination from Phase 2 asks for **S2 ∩ S4** — shoppers who stall on saves because of fit or
comparison doubt, not because they are waiting for a sale. The P1 Wishlist Staller definition
drafted for Phase 4 tightens this to someone who saves and does not convert.

## Criteria

| # | Criterion | Screening item | Why |
|---|---|---|---|
| 1 | Shops fashion online at least a few times a year | Q2 | Excludes non-shoppers |
| 2 | Has a save/wishlist habit | Q3, Q4 | The behaviour under study |
| 3 | Has at least one unbought save | Q6 | The stall must be real, not hypothetical |
| 4 | Buys from saves only *sometimes* or less | Q5 | Separates stallers from converters |
| 5 | Uses Myntra or a comparable Indian fashion app | Q1 | Keeps the context relevant |

**In segment** = criterion 2 (Q3 = Yes) **and** criterion 4 (Q5 ∈ {*Sometimes*, *Almost never*}).
That rule is implemented in `segmentSplit()` in
`Phase-1/packages/discovery-core/src/surveyResponses.ts`, so the classification in every record
is computed, not judged.

## Disqualifiers

| Disqualifier | Handling |
|---|---|
| Does not use a wishlist at all (Q3 = No) | Kept, marked out of segment — useful as a control |
| Converts almost always (Q5 = *Almost always*) | Kept, marked out of segment — a conversion control |
| Waiting purely for a sale | **Not** disqualified, but tracked separately; sale-watchers are a control persona per [architecture.md](../architecture.md) Phase 4, never the coach audience |
| Employed by a fashion retailer | Not asked — a gap in the instrument |

## Who actually answered

9 respondents, 28–31 Aug 2026.

| Group | n | Records |
|---|---|---|
| **In segment** — saves and rarely converts | **2** | R03, R07 |
| Uses a wishlist but converts often | 4 | R02, R04, R08, R09 |
| Stalls on saves but does not call it a wishlist | 3 | R01, R05, R06 |
| Uses Myntra | 7 | R01–R04, R07–R09 |

## Recruitment limitation

The questionnaire was distributed openly rather than to a screened panel, so the in-segment yield
is **2 of 9** against a target of 5. The five *stalling savers* (criterion 4) are a useful wider
pool, but three of them do not use a wishlist feature, which weakens their fit to the nomination.

Closing this needs targeted recruiting rather than more open distribution: shoppers with several
saved items who rarely buy from them. Until then, conclusions drawn specifically about the P1
segment rest on two people and are labelled as such throughout
[`synthesis.md`](./synthesis.md).
