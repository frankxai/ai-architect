# Chapter 02: Model-provider seams and routing under model churn

Pattern ID: `PAT-02` (Task-tiered model gateway with pinned snapshot contracts)
Decision record: [`ADR-0002`](../../kit/adrs/ADR-0002.md)
Failure mode: `FM-02` (Silent provider alias drift breaking structured output schemas)

[[PLAYBOOK_FIG_CH02_MODEL_SEAM]]

## 1. The architect's problem

In traditional cloud architecture, a database engine or message broker changes its wire protocol once every five years. In production agent systems, the underlying language model catalog shifts every four to eight weeks. Across the four primary model catalogs tracked in our source ledger (`S01` OpenAI, `S02` Anthropic, `S03` Google Gemini, and `S04` xAI Grok), input and output token prices span a 100x range: from USD 0.10 per million input tokens and USD 0.50 per million output tokens on high-volume models (`claude-haiku-5-5` and `gpt-6-luna`) to USD 10.00 per million input tokens and USD 50.00 per million output tokens on deep-reasoning models (`claude-fable-5-1` and `gpt-6-astra`).

Teams that import a vendor SDK directly into thirty application files and hardcode a floating alias such as `-latest` suffer two predictable failures:

1. **Silent behavioral and schema drift (`FM-02`):** As Google's Gemini API documentation (`S03`) notes explicitly, a `-latest` alias is hot-swapped whenever a new model variation ships. Even a minor change in how a model formats JSON tool arguments, handles markdown code fences around JSON, or chooses between a refusal and a partial answer can break a downstream parser that worked the day before.
2. **Margin collapse from uniform frontier routing:** Routing every classification, tag extraction, and routing step through a USD 10 / USD 50 frontier model instead of a USD 0.10 / USD 0.50 tier-1 model inflates compute spend by 20x to 50x without improving task accuracy on simple extraction jobs.

An architecture that survives model churn treats every model call as a replaceable capability contract behind a single owned seam.

## 2. Architecture pattern: `PAT-02` Task-tiered model gateway with pinned snapshot contracts

### Context and forces

Your application executes diverse cognitive tasks (fast intent routing, structured document synthesis, multi-step code generation, and independent gate verification). You need to control unit cost across a 100x price spread, guarantee that every response satisfies a strict JSON schema before downstream code touches it, and fail over to a second provider family in minutes when a vendor suffers an regional outage or deprecates a snapshot.

### Structural solution

Isolate all provider SDKs and HTTP calls behind one internal **Capability Router** that exposes four named functional tiers rather than vendor model names:

1. **`fast-classifier` (Tier A - low latency, high volume):** Bound to a pinned small model snapshot (`claude-haiku-5-5` at USD 0.10 / USD 0.50 per million tokens or `gpt-6-luna` at USD 0.10 / USD 0.50 per million tokens). Used for intent classification, routing, and format pre-checks with a 2-second timeout.
2. **`balanced-builder` (Tier B - default production workhorse):** Bound to a pinned mid-tier snapshot (`claude-sonnet-5-5` at USD 2 / USD 10 per million tokens, `gpt-6.1-sol` at USD 2 / USD 10 per million tokens, or `grok-4.7` at USD 2 / USD 6 per million tokens under 200k context). Used for structured drafting, ADR authoring, and standard tool use.
3. **`frontier-reasoner` (Tier C - complex architecture and multi-file synthesis):** Bound to `claude-opus-5-5` (USD 4 / USD 20 per million tokens), `gemini-4-argon`, or `gpt-6-astra` (USD 10 / USD 50 per million tokens). Invoked only when the task requires long-horizon planning or when Tier B fails a deterministic check.
4. **`independent-checker` (Tier D - cross-family verification):** Bound by rule to a provider family different from the active Maker tier (`PAT-04`). If the Maker ran on an Anthropic snapshot, `independent-checker` resolves to an OpenAI or Google snapshot.

```
[Application Service] ---> callCapability("balanced-builder", input, outputSchema)
                                       |
                        +--------------+--------------+
                        |  Canonical Capability Seam  |
                        |  - Resolves pinned snapshot |
                        |  - Enforces token/time cap  |
                        |  - Validates outputSchema   |
                        +--------------+--------------+
                                       |
              +------------------------+------------------------+
              | Primary Snapshot                                | Fallback Family (on 5xx)
              v                                                 v
   [claude-sonnet-5-5 (S02)]                          [gpt-6.1-sol (S01)]
```

### Seam invariants enforced by code

- **Zero vendor imports outside the gateway:** Application routes and workflow files import only the internal capability client; a lint rule blocks direct `@anthropic-ai/sdk`, `openai`, or `@google/genai` imports outside `lib/model-seam/`.
- **Pinned snapshot IDs only:** Configuration rejects any model identifier ending in `-latest` or lacking a documented retirement/version contract (`S02`, `S03`).
- **Closed schema validation at the boundary:** Every structured call passes a JSON schema (`required_output_keys` in `kit/prompts/prompt-set.json`). If the model response fails JSON parsing or omits a required key, the gateway raises `E_SCHEMA_DRIFT` before any caller state is modified.

## 3. Decision record template: `ADR-0002`

Full worked record: [`kit/adrs/ADR-0002.md`](../../kit/adrs/ADR-0002.md).

```markdown
# ADR-0002: Isolate vendor SDKs behind one canonical capability seam

- **Status:** Accepted
- **Date:** 2026-10-24
- **Pattern:** PAT-02 (Task-tiered model gateway with pinned snapshot contracts)
- **Mitigates:** FM-02 (Silent provider alias drift breaking structured output schemas)

## Context
Model vendors update weights, deprecate floating aliases, and price models across a 100x spread (USD 0.10 to USD 10.00 per million input tokens across S01-S04).

## Decision
Call language models exclusively through a four-tier internal capability router (`fast-classifier`, `balanced-builder`, `frontier-reasoner`, `independent-checker`) that binds each tier to a pinned snapshot ID, validates every response against a closed JSON schema, and maintains a tested fallback on a second provider family.

## Alternatives Considered and Rejected
1. **Import vendor SDK clients directly inside route handlers:** Rejected because swapping a deprecated model or failing over during a vendor outage requires editing dozens of files.
2. **Bind production workloads to floating `-latest` aliases:** Rejected because silent upstream weight swaps alter structured JSON output formatting without triggering CI.
3. **Use unvalidated plain-text completions for workflow steps:** Rejected because downstream code requires typed fields and deterministic `E_SCHEMA_DRIFT` errors.

## Verification Command
`node --experimental-strip-types products/agentic-architecture/scripts/verify-agentic-architecture.mjs`
```

## 4. Production failure mode: `FM-02`

### Failure story and trigger

A team builds an architecture-review pipeline that calls a floating `-latest` model alias across twelve workflow steps to emit JSON decision cards (`modelSeam`, `loopShape`, `trustBoundary`, `longRunHome`, `killCriteria`). On a Tuesday morning, the provider updates the target of the `-latest` alias to a new checkpoint that wraps JSON output inside a conversational preamble and renames `killCriteria` to `stopConditions` in 8% of completions.

### Blast radius when unmitigated

Because the application called `JSON.parse` without a schema gate at the model seam, 8% of customer runs either crash with an unhandled syntax error or persist incomplete decision records with `killCriteria: undefined`, silently disabling downstream safety checks.

### Detection telemetry

- Span attribute `gen_ai.response.validation_code == "E_SCHEMA_DRIFT"` emitted by the capability gateway.
- Sudden shift in `gen_ai.usage.output_tokens` distribution or `gen_ai.response.model` snapshot string returned in provider response headers.
- Contract eval failure in `kit/prompts/prompt-set.json` on the `discovery-architect` golden case.

### Deterministic mitigation

1. Pin exact model IDs in configuration (`claude-sonnet-5-5`, `gpt-6.1-sol`, `gemini-4-argon`, `grok-4.7`) and record their review dates in `guide/research/sources.yaml`.
2. Validate every model output against `required_output_keys` (`kit/prompts/prompt-set.json`) inside the seam before returning to the caller.
3. Run the 16-case evaluation harness (`npm run evals`) on a candidate snapshot in staging before updating the pinned tier mapping.

## 5. Worked implementation and red-team walkthrough

In `kit/prompts/prompt-set.json`, each of the six production prompts (`discovery-architect`, `trust-boundary-auditor`, `adr-author`, `cost-envelope-modeler`, `mcp-tool-steward`, and `independent-gate-checker`) declares its exact `input_variables` and `required_output_keys`:

- For `discovery-architect`, the gateway requires `["modelSeam", "loopShape", "trustBoundary", "longRunHome", "killCriteria"]`.
- When a caller invokes `discovery-architect`, the seam selects the pinned `balanced-builder` snapshot (`claude-sonnet-5-5` at USD 2 / USD 10 per million tokens), sets `max_tokens: 4096`, and parses the response.
- If the response is not valid JSON or is missing any of the five keys, the seam throws `E_SCHEMA_DRIFT` immediately rather than passing a partial object into the ADR generator.
- If the primary provider returns HTTP 502, 503, or 529, the seam retries once against the configured secondary provider (`gpt-6.1-sol` at USD 2 / USD 10 per million tokens) using the identical prompt and output schema contract.

### Red-team verification checklist for chapter 02

- Grep the codebase for `-latest` model strings and direct vendor SDK imports outside the gateway module; confirm CI rejects both.
- Inject a mock model response that omits `killCriteria` or wraps JSON in unclosed prose and confirm the gateway raises `E_SCHEMA_DRIFT`.
- Simulate an HTTP 503 from the primary provider family and confirm the secondary provider family satisfies the same `required_output_keys` contract without code changes.

## 6. Operational metrics and production rollout sequence

Transitioning an existing application from scattered direct SDK calls to a task-tiered capability seam (`PAT-02`) takes three incremental steps:

1. **Step 1 (Centralize calls and ban floating aliases):** Create the internal capability client, move all vendor SDK initialization into that single module, and replace every `-latest` string with a pinned snapshot identifier recorded in `guide/research/sources.yaml`.
2. **Step 2 (Attach closed output schemas to every structured call):** Bind each prompt role in `kit/prompts/prompt-set.json` to its `required_output_keys` array and log `gen_ai.response.validation_code` on every response so schema drift is caught at the boundary rather than inside business logic.
3. **Step 3 (Shift high-volume classification to Tier A):** Route intent classification and format pre-checks to `fast-classifier` (`claude-haiku-5-5` or `gpt-6-luna` at USD 0.10 / USD 0.50 per million tokens) while reserving `balanced-builder` and `frontier-reasoner` for synthesis and verification, tracking cost per accepted run via `ingestOtelTraceSpans`.
