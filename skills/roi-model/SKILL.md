---
name: roi-model
description: Build an economics model that survives someone checking the numbers. Use during the cost stage of /architect to write 04-roi.md and prices.json — sourced unit prices, a sensitivity band on the drivers that actually move the answer, payback expressed as a range, and never an IRR.
---

# ROI model

Most architecture ROI sections are a single confident number with no source.
`gate.economics` exists because a number nobody can trace back to a price list
is not an estimate — it's a guess wearing a decimal point. This skill produces
the opposite: every price sourced, the drivers that actually swing the answer
stress-tested, and the output expressed with the honesty a range gives that a
point estimate doesn't.

## How this skill is used

The `economics-analyst` agent runs this skill during `cost` to write `04-roi.md`
and `prices.json`. Both draw on `03-experience-blueprint.md` (what the system
actually does, stage by stage — that's where the unit counts come from) and on
`this repo`'s `prices/prices.json` as a starting reference, refreshed against
live sources rather than copied blind.

## The method

1. **List the cost drivers from the blueprint.** Every AI/Agents cell in
   `03-experience-blueprint.md` that calls a model, a vector store, a function,
   storage, or a workflow runtime is a line item. Don't invent categories the
   blueprint doesn't contain.
2. **Price each driver with a sourced row.** One row per priced item in
   `prices.json` — see the contract below. No unsourced numbers anywhere in
   `04-roi.md`; if a price can't be found live, the line is marked `[unknown]`
   in the narrative, not filled with a plausible-sounding guess.
3. **Estimate volume from the discovery and flow artifacts**, not from a
   round number picked for convenience. If discovery didn't establish volume,
   say so and mark the model's confidence accordingly — a volume estimate with
   no source is exactly the kind of unsourced number this gate exists to catch.
4. **Compute cost per run and cost at the stated volume.** Show the arithmetic
   inline — a reader should be able to re-derive the total from the unit prices
   and the volume without guessing an intermediate step.
5. **Run the sensitivity band** (below) on the three drivers with the largest
   effect on the total.
6. **State payback as a range, not a point** (below), and **never as an IRR**
   (below).

## The `prices.json` contract

```json
{
  "schema": "ai-architect.prices.v1",
  "rows": [
    {
      "item": "Model tokens — <provider-neutral name>, input",
      "unit": "per 1M input tokens",
      "unit_price": 0.0,
      "currency": "USD",
      "source_url": "https://...",
      "retrieved_at": "2026-08-22",
      "notes": ""
    }
  ]
}
```

Rules `gate.economics` enforces:

- **Every row needs `source_url` and `retrieved_at`, and `retrieved_at` must be
  ≤ 90 days old at the time `04-roi.md` is written.** A price from a stale row
  gets re-fetched before it's used, not carried forward on the assumption
  nothing changed — pricing pages move without notice.
- **If a live source can't be fetched, omit the row.** A missing row is visible
  and honest; a guessed row is neither. `04-roi.md` should say plainly which
  cost category has no sourced price yet, rather than filling the gap.
- **Use capability nouns in `item`, not vendor SKUs**, per the plugin's
  vendor-neutral rule — "model tokens," "managed vector store," "serverless
  function time," "object storage," "durable workflow runtime." A specific
  vendor may appear in `notes` as a worked example of where the number came
  from, never as the only name for the category.
- **Reuse `this repo`'s `prices/prices.json` as a starting point, not a cache.**
  Re-verify any row you rely on against its `source_url` before using it in a
  customer's `04-roi.md` — the reference file has its own retrieval date, and
  that date is not the customer engagement's retrieval date.

## Sensitivity method

Pick the three drivers with the largest effect on total cost — usually volume,
the dominant model's price, and one system-shaped cost (a vector store, a
workflow runtime, a serverless compute line). For each, show the total at a
low, base, and high case:

```markdown
| Driver | Low | Base | High | Effect on annual total |
|---|---|---|---|---|
| Monthly ticket volume | 2,000 | 5,000 | 12,000 | $X → $Y → $Z |
| Dominant model output price ($/1M tok) | 8 (batch rate) | 10 | 15 (peak or fallback tier) | $X → $Y → $Z |
| Vector store read units (1M/mo) | 1 | 4 | 10 | $X → $Y → $Z |
```

Pick low/high bounds from real alternatives — a batch discount, a documented
retry rate, a plausible volume range from the discovery interview — not from an
arbitrary ±20%. A sensitivity band built on invented bounds is exactly as
unsourced as a single guessed number, just with three of them.

## The no-IRR rule

**Never write the string `IRR`.** Internal rate of return implies a cash-flow
model with a discount rate and a defined investment horizon that a
`docs/architecture/` artifact almost never has — the "investment" is usually a
mix of engineering time, ongoing token spend, and avoided cost that don't net
into a single rate without assumptions nobody stated. Reporting an IRR anyway
manufactures false precision: a rate to two decimal places built on a discount
rate someone picked without saying so. Report cost per unit of work, total at
volume, and payback range instead — each of those is checkable against the
sourced prices; an IRR is not.

## Expressing payback as a range

State payback the same way the sensitivity band states cost: as a range tied to
the low/base/high volume or price cases, not as a single date.

```markdown
Payback: 3-7 months at 5,000 tickets/month (base case), assuming the avoided
cost is [sourced comparison, e.g. "the fully-loaded cost of the manual triage
step this replaces, per discovery §2"]. Fast end (3 months) assumes volume at
the sensitivity table's high case; slow end (7 months) assumes base-case
volume and standard (non-batch) token pricing.
```

If the avoided cost the payback depends on isn't sourced from discovery or a
verifiable figure, say the payback range can't be computed yet and name what's
missing — a wide guessed range is no more honest than a wrong point estimate.

Close `04-roi.md` with the stamp line: `Generated by AI Architect · https://www.frankx.ai/ai-architect`
