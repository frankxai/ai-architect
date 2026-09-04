# Appendix A. Model market snapshot, 2026-09-04

This appendix is procurement evidence with a short half-life. It is not a model recommendation.

Prices are public list prices observed in vendor documentation on 2026-09-04. They exclude caching, batches, priority service, regional terms, tool charges, negotiated discounts, taxes, infrastructure, evaluation, and human work. Confirm every number before a buying or release decision.

## OpenAI

OpenAI's catalog named GPT-6 Astra as its flagship for hard end-to-end work and documented three GPT-5.6 tiers. The listed text prices and limits were: [S01](../research/sources.yaml)

| Model | Model ID | Input per million tokens | Output per million tokens | Context | Max output |
|---|---|---:|---:|---:|---:|
| GPT-6 Astra | `gpt-6-astra` | $10.00 | $50.00 | 1.05M | 128K |
| GPT-5.6 Sol | `gpt-5.6-sol` | $4.00 | $20.00 | 1.05M | 128K |
| GPT-5.6 Terra | `gpt-5.6-terra` | $2.00 | $12.00 | 1.05M | 128K |
| GPT-5.6 Luna | `gpt-5.6-luna` | $0.20 | $1.20 | 1.05M | 128K |

The page showed functions, web search, file search, and computer use for those models. GPT-6 Astra was in a staged rollout on the access date, which makes availability part of the procurement check.

## Anthropic

Anthropic's current family covered Fable, Opus, Sonnet, and Haiku. Its page advised starting with Opus 5 for most work and moving to Fable 5.1 for demanding long-horizon work when higher-effort Opus evals still fell short. [S02](../research/sources.yaml)

| Model | Model ID | Input per million tokens | Output per million tokens | Context | Max output |
|---|---|---:|---:|---:|---:|
| Claude Fable 5.1 | `claude-fable-5-1` | $10.00 | $50.00 | 1M | 128K |
| Claude Opus 5 | `claude-opus-5` | $5.00 | $25.00 | 1M | 128K |
| Claude Sonnet 5 | `claude-sonnet-5` | $2.00 | $10.00 | 1M | 128K |
| Claude Haiku 4.5 | `claude-haiku-4-5-20251001` | $1.00 | $5.00 | 200K | 64K |

All four were documented with text and image input, text output, vision, multilingual use, and tools. Capability labels remain vendor claims until the task bank measures them.

## Google

Google's Gemini API page separated stable and preview releases. The stable Gemini 3 list included Gemini 3.8 Flash, 3.7 Flash, 3.6 Flash, 3.5 Flash, 3.5 Flash-Lite, 3.1 Flash-Lite, image models, and Gemini 3.5 Transcribe. Gemini 3.1 Pro and several real-time or media models appeared in preview. [S03](../research/sources.yaml)

The procurement lesson is that “model” may mean a general reasoning endpoint, live speech system, transcription endpoint, image generator, or video generator. A route registry should state the task and modality contract rather than group all of them under one generic provider setting.

The catalog page used here did not supply one comparable price and context table for the entire family. This appendix does not fill the gap from memory. Fetch the selected model page and price page when a Gemini route becomes a candidate.

## xAI

xAI documented Grok 4.6 as `grok-4.6`, with a 500K-token context window and list prices of $2.00 per million input tokens and $6.00 per million output tokens. The page stated a 2026-02-01 knowledge cutoff and was last updated 2026-08-21. [S04](../research/sources.yaml)

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
