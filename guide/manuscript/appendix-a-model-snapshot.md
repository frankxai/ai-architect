# Appendix A. Model market snapshot, 2026-10-05

This appendix is procurement evidence with a short half-life. It is not a model recommendation.

Prices are public list prices observed in vendor documentation on 2026-10-05. They exclude caching, batches, priority service, regional terms, tool charges, negotiated discounts, taxes, infrastructure, evaluation, and human work. Confirm every number before a buying or release decision. The [source-review receipt](../releases/2026-10-05-source-review.md) records what changed. September values remain in Git history rather than being presented as current.

## OpenAI

The featured catalog lists three text models. C047 records that scope: [S01](../research/sources.yaml)

| Model | Model ID | Input per million tokens | Output per million tokens | Context | Max output | Claim |
|---|---|---:|---:|---:|---:|---|
| GPT-6 Astra | `gpt-6-astra` | $10.00 | $50.00 | 1.05M | 128K | C045 |
| GPT-6.1 Sol | `gpt-6.1-sol` | $2.00 | $10.00 | 1.05M | 128K | C046 |
| GPT-6 Luna | `gpt-6-luna` | $0.10 | $0.50 | 1.05M | 128K | C048 |

Check availability for the actual account and region before choosing a route. A public row establishes documentary support for the comparison; it leaves access and behavior untested.

## Anthropic

The current family spans four models: [S02](../research/sources.yaml)

| Model | Model ID | Input per million tokens | Output per million tokens | Context | Max output | Claim |
|---|---|---:|---:|---:|---:|---|
| Claude Fable 5.1 | `claude-fable-5-1` | $10.00 | $50.00 | 1M | 128K | C049 |
| Claude Opus 5.5 | `claude-opus-5-5` | $4.00 | $20.00 | 1M | 128K | C050 |
| Claude Sonnet 5.5 | `claude-sonnet-5-5` | $2.00 | $10.00 | 1M | 128K | C051 |
| Claude Haiku 4.5 | `claude-haiku-4-5-20251001` | $1.00 | $5.00 | 200K | 64K | C052 |

Capability labels remain vendor claims until the task bank measures them. A model identifier in a table must be copied into an actual route configuration before a compatibility test has any meaning. An environment variable alone cannot establish that the adapter uses it.

## Google

Google's catalog separates stable and preview releases. Gemini 3.8 Flash and its Live and speech variants appear as stable; Gemini 3.1 Pro remains under preview on the checked page. [S03](../research/sources.yaml)

The procurement lesson is that “model” may mean a general reasoning endpoint, live speech system, transcription endpoint, image generator, or video generator. A route registry should state the task and modality contract rather than group all of them under one generic provider setting.

The catalog page used here did not supply one comparable price and context table for the entire family. This appendix does not fill the gap from memory. Fetch the selected model page and price page when a Gemini route becomes a candidate.

## xAI

xAI lists `grok-4.7`: 500K context, $2.00 input and $6.00 output per million tokens, with a May 2026 knowledge cutoff. [S04](../research/sources.yaml) [C053](../research/claims.yaml)

Claims C045 through C053 map the rows and catalog scope to their sources. This refresh checked documentation; it made no paid API calls and measured no model performance. A separate independent review of this correction is still open. No author, legal, or final-book gate was closed by these retrievals.

The same page distinguished moving aliases from dated snapshots. That distinction belongs in the release record. An alias may be suitable for exploration; a reproducible baseline needs the exact observed version or an explicit statement that the provider does not offer one.

## How to use the snapshot

Create one row per candidate and add your own evidence:

| Field | Required evidence |
|---|---|
| availability | account and region check |
| data terms | approved contract or policy record |
| exact version | response metadata and route config |
| task quality | repeated task-bank results |
| serious failures | safety bank by class |
| latency | p50 and p95 under expected load |
| cost | total cost per verified outcome |
| tool behavior | contract and trace tests |
| migration | second-adapter comparison |
| review date | next catalog and eval refresh |

Do not select from the vendor table alone. The table narrows candidates. Your outcome, trust boundary, operating limits, and eval bank make the decision.
