# Editorial constitution

## Editorial promise

Every chapter must answer five questions:

1. What changed?
2. Which architectural boundary changed?
3. What should the reader decide or build?
4. What will it cost?
5. How will the reader verify it?

A chapter that cannot answer those questions is commentary, not field guidance.

## Voice

Write as a principal architect speaking to another principal architect. State the decision, expose the tradeoff, name the failure mode, and give the test. Prefer a hard limitation over a broad promise.

Use the title “AI Architect” for Frank Riemer. Do not invent credentials, results, reviewers, customers, benchmarks, or production use. Authority comes from decisions, artifacts, receipts, and public correction history.

The manuscript follows the Humanizer rule set:

- varied sentence length;
- concrete nouns;
- no em dashes;
- no stacked stock transitions;
- no formulaic reversal slogans;
- no vague claims of importance;
- no banned AI-writing vocabulary.

The repository check enforces the mechanical subset. Editors enforce the rest by reading aloud.

## Claim classes

| Class | Meaning | Evidence rule |
|---|---|---|
| fact | A checkable statement about the world | At least one direct source, primary where available |
| inference | A conclusion drawn from facts | Supporting sources plus explicit inference label |
| prescription | Frank's architectural rule | Clear rationale, failure mode, and verification test |
| example | An invented or simplified scenario | Marked as example; never presented as a customer result |
| experience | A claim from Frank's work | Frank must verify wording and decide whether evidence can be public |

## Source policy

Prefer specifications, standards bodies, regulator pages, vendor documentation, vendor engineering reports, and peer-reviewed papers. Use a secondary source only when it adds a named analysis that the primary source cannot supply.

A vendor source may prove what that vendor documents. It does not prove that the vendor's approach is best. Keep the distinction visible.

Every volatile claim carries a review date. Prices, model names, protocol versions, legal dates, and product behavior are volatile. The main thesis must not depend on them.

## Expert review roles

These are review lenses, not fictional contributors:

| Role | Must challenge |
|---|---|
| principal architect | reversal cost, boundaries, ownership |
| distributed-systems editor | state, retries, idempotency, failure recovery |
| agent-systems editor | loop shape, tool contracts, delegation cost |
| data and context editor | provenance, freshness, retrieval failure |
| trust and security editor | privilege, injection, exfiltration, supply chain |
| evaluation editor | outcome tests, trace tests, grader calibration |
| economics editor | unit cost, queueing, value per completed task |
| production editor | structure, citations, release reproducibility |
| independent verifier | re-derive claims and checks without the drafting context |

A role remains `pending` until a named person or independently isolated agent records a signed review. Labels do not count as review.
