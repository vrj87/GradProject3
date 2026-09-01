# Phase 4 — Problem definition

Derives the locked problem from the artefacts of Phases 1–3 instead of restating it. Every count in
the output is computed at read time, so the prose in
[`docs/problem-definition.md`](../docs/problem-definition.md) cannot drift from the data.

## Run

```bash
# from repo root
npm run phase4:lock
npm run phase4:test

# or
cd phase-4
npm install
npm test
npm run lock
```

## Reads

| File | Phase | Fails without it |
|------|-------|------------------|
| `Phase-1/data/discovery/opportunity-ranking.json` | 1 | A-M01 |
| `Phase-1/data/discovery/themes.json` | 1 | A-M01 |
| `Phase-1/data/discovery/pipeline-stats.json` | 1 | A-M01 |
| `phase-2/data/nomination.json` | 2 | A-M01 |
| `Phase-1/data/survey/survey-responses.json` | 3 | A-M01 |
| `Phase-1/data/survey/survey-summary.json` | 3 | A-M01 |

## Writes

| File | Content |
|------|---------|
| `data/problem-definition.json` | Six required fields with evidence refs, chain, falsification tests |
| `data/decision-tree.json` | Branch-by-branch verdict and the outcome it forces |
| `data/signals.json` | Every computed signal, including per-respondent working |
| `data/segment-contract.json` | Thresholds plus the derivation for each one |
| `data/segment.contract.ts` | Source for Phase 5a to implement — contract only |
| `data/report.html` | Reviewer report |
| `data/problem-definition-snippet.md` | Generated tables for the markdown lock |
| `data/phase4-stats.json` | Counts, `outcome`, `readyForPhase5` |

## The one signal that decides the phase

Q12 asks what **offer** would unlock the purchase and lists a discount. Q13 asks what **help**
would, and lists none. Reading them per respondent separates a shopper who is short of money from
one who is short of a verdict.

On the delivered data all four discount-seekers research or compare before buying anyway, and three
ask specifically to understand whether the price is good. Because Q13's option list has no discount
in it, the switch alone would be close to a tautology — so `researchesAnyway`, taken from Q11 where
waiting for a sale *is* offered, carries the weight. The artefact says so in
`signals.unlockSwitch.tautologyNote` rather than leaving the reader to notice.

## Rules (from architecture)

- The decision tree is executable, not decorative. `evaluateDecisionTree` returns **`stop`** when
  the discount-seekers show no non-monetary behaviour or demand, and `tests/decision-tree.test.ts`
  proves it on a price-bound sample. `incentiveMvpAllowed` is typed `false` and cannot be set.
- If the instrument ever holds price constant and price still dominates in segment, the outcome is
  `stop` regardless of the escape hatch — that is the "even at current price" clause of the tree.
- The segment is a **contract only**. `apps/mvp/lib/segment.ts` is Phase 5a's job;
  `referenceMatches` exists so tests can execute the thresholds, not to ship.
- Thresholds are derived from the save-volume distribution, not chosen. The Phase 2 floor of three
  items drops to two while the modal bucket tops out at five saves or fewer.
- Fixture quotes are never presented as research. `quotes.liveQuotes` keeps only live review ids
  (28 of the 30 theme quotes in the corpus are illustrative seeds), and because the questionnaire
  had no free-text field, `participantVerbatimAvailable` is `false`.
- Instrument limits travel inside `signals.instrument`, so downstream code cannot quietly forget
  that price was never held constant.
