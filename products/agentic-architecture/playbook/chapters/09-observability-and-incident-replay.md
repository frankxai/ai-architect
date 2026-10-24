# Chapter 09: Observability planes, OpenTelemetry GenAI traces, and incident replay

Pattern ID: `PAT-09` (PII-redacted span graph with deterministic replay fixtures)
Decision record: [`ADR-0009`](../../kit/adrs/ADR-0009.md)
Failure mode: `FM-09` (Opaque multi-step failure with unredacted credentials or customer PII in logs)

[[PLAYBOOK_FIG_CH09_OTEL_REPLAY]]

## 1. The architect's problem

When a traditional REST endpoint returns HTTP 500, a stack trace and the request URL are usually enough to reproduce the bug. When a multi-step agent workflow fails or produces a bad decision on step 7 of a 9-step run, a stack trace tells you almost nothing: you need to know which model snapshot was called on step 3, how many input and output tokens were consumed across retries, what tool arguments were proposed on step 5, and why the capability proxy rejected or modified the payload.

Teams that try to solve this by calling `console.log(req.headers, req.body, toolResult)` create a severe security and compliance failure (`FM-09`):

1. **Credential and PII leakage in log sinks:** Raw request headers and tool payloads contain `Authorization: Bearer` tokens, webhook signing secrets, customer email addresses, and private document snippets. Once written to shared CI logs or third-party log aggregators, those secrets and personal data records cannot be easily expunged.
2. **Disconnect between observability traces and unit-economics models:** Teams collect traces in one tool and maintain a separate, hand-typed spreadsheet for cost modeling. Because the spreadsheet never ingests actual span token counts and retry attempts from production traces, its cost-per-run estimates drift away from reality.

Production agent observability requires structured OpenTelemetry GenAI spans (`S16`) that pass through a deterministic secret/PII redaction filter at emission time and feed directly into the unit-economics evaluator (`ingestOtelTraceSpans` in `kit/workbooks/evaluate-workbook.mjs`).

## 2. Architecture pattern: `PAT-09` PII-redacted span graph with deterministic replay fixtures

### Context and forces

Your agent runtime executes multi-step workflows across model calls and MCP tools. Operators need enough structured telemetry to reconstruct any failed run and compute exact cost per accepted outcome, while security and privacy rules forbid logging raw bearer tokens, signing secrets, or customer email addresses.

### Structural solution

Implement a three-part **Redacted Span and Replay Pipeline** (`kit/workbooks/evaluate-workbook.mjs`, `kit/workbooks/sample-otel-spans.json`, and `kit/mcp/reference-mcp-server.mjs`):

1. **Standardized OpenTelemetry GenAI Span Attributes (`S16`):**
   Every model call and tool invocation emits a structured span carrying:
   - `traceId`, `runId`, `attempt` (integer `1..N`), and `accepted` (boolean indicating whether the run passed its verification gate)
   - `attributes["gen_ai.request.model"]` (the capability tier or pinned snapshot ID, such as `"tier-b-balanced-builder"` or `"tier-c-frontier-reasoner"`)
   - `attributes["gen_ai.usage.input_tokens"]` and `attributes["gen_ai.usage.output_tokens"]`
   - `attributes["tool.name"]`, `attributes["tool.tier"]`, `attributes["tool.outcome_code"]`, and `attributes["tool.cost_usd"]`.
2. **Deterministic Redaction Filter at Emission (`redactSpan`):**
   Before any span or error log leaves the process, a deterministic redactor strips `Authorization` headers, replaces any string matching bearer/API key patterns (`sk-...`, `re_...`, `Bearer ...`) with `[REDACTED_SECRET]`, and hashes or strips email addresses so operator logs contain only structured error codes (`{ level: "error", event: "commerce_order_conflict", code: "E_ORDER_CONFLICT", mode }`).
3. **Trace-to-Workbook Cost Ingestion (`ingestOtelTraceSpans`):**
   Rather than guessing retry multipliers in a spreadsheet, `kit/workbooks/evaluate-workbook.mjs` exports `ingestOtelTraceSpans(spans, pricingTable)`. It reads exported OTel GenAI span JSON (`kit/workbooks/sample-otel-spans.json`), looks up the dated per-million token rate for each span's `gen_ai.request.model`, sums compute and tool cost across **all attempts** (both failed attempt 1 and accepted attempt 2), and divides by the count of distinct runs where `accepted === true`.

```
[Model / Tool Execution] ---> [Emit OTel GenAI Span]
                              (model, input_tokens, output_tokens, attempt, accepted)
                                        |
                                        v
                              [Deterministic PII/Secret Redactor]
                              (Strip Bearer tokens, secrets, raw emails)
                                        |
                     +------------------+------------------+
                     |                                     |
                     v                                     v
       [Sanitized Replay Fixture]            [ingestOtelTraceSpans()]
       (Re-runnable in node:test)            (Computes real cost per accepted run)
```

### Observability-plane invariants enforced by code

- **No raw secrets or emails in error outputs:** Error responses and logs carry machine-readable error codes (`E_OAUTH_AUDIENCE_MISMATCH`, `E_TENANT_MISMATCH`, `E_PATH_CONTAINMENT`, `E_ORDER_CONFLICT`) rather than echoing raw secret values or buyer PII.
- **Failed attempts are included in accepted-run cost:** `ingestOtelTraceSpans` sums token and tool spend across all spans (including `accepted: false` retries) and divides by `acceptedRuns` (`kit/workbooks/evaluate-workbook.mjs:46-57`).
- **Zero accepted runs fails closed:** If a batch of trace spans has `acceptedRuns === 0`, `ingestOtelTraceSpans` throws an explicit error (`Zero accepted runs in OTel span batch; cost per accepted outcome is infinite`) rather than dividing by zero or reporting zero cost.

## 3. Decision record template: `ADR-0009`

Full worked record: [`kit/adrs/ADR-0009.md`](../../kit/adrs/ADR-0009.md).

```markdown
# ADR-0009: Record reconstructable run receipts without leaking customer secrets

- **Status:** Accepted
- **Date:** 2026-10-24
- **Pattern:** PAT-09 (PII-redacted span graph with deterministic replay fixtures)
- **Mitigates:** FM-09 (Opaque multi-step failure with unredacted credentials or customer PII in logs)

## Context
Debugging multi-step agent failures and measuring real unit economics require span-level token and status attributes (S16), but logging raw headers or payloads leaks secrets and customer PII.

## Decision
Emit OpenTelemetry GenAI spans (`gen_ai.request.model`, `gen_ai.usage.input_tokens`, `gen_ai.usage.output_tokens`, `tool.cost_usd`, `accepted`) through a deterministic secret/PII redaction filter, and compute measured cost per accepted run directly from span exports via `ingestOtelTraceSpans`.

## Alternatives Considered and Rejected
1. **Log full HTTP request headers and bodies on errors:** Rejected because raw payloads leak `Authorization` tokens, webhook secrets, and customer email addresses.
2. **Disable structured tracing in production to avoid privacy risk:** Rejected because operators cannot diagnose retry loops or compute real cost per accepted run without span attributes.
3. **Route all model traffic through an external closed-source logging proxy:** Rejected because it adds a third-party availability dependency and data-residency risk.

## Verification Command
`node products/agentic-architecture/kit/workbooks/evaluate-workbook.mjs`
```

## 4. Production failure mode: `FM-09`

### Failure story and trigger

A multi-agent workflow experiences a spike in 401 and 409 errors during a partner integration test. A developer adds `console.error("Webhook failed:", req.headers, rawBody)` to debug the issue. Within an hour, 200 failed requests write the partner's bearer tokens and customer email addresses into the shared cloud log stream, while the team still cannot tell how much retry spend the failed runs consumed.

### Blast radius when unmitigated

Every engineer or contractor with read access to application logs can read live bearer tokens and customer PII, triggering a credential rotation and privacy incident.

### Detection telemetry

- Secret-scanner or log-redaction test catching `Bearer ` or raw email patterns in emitted log lines.
- `E_SERVER_UNCONFIGURED` when the MCP server is started without required secret configuration.
- `ingestOtelTraceSpans` reporting `meanAttemptsPerRun > 1.5` or throwing on `acceptedRuns === 0`.

### Deterministic mitigation

1. Emit only structured, PII-free error codes on failure paths (`kit/mcp/reference-mcp-server.mjs` and `app/api/commerce/webhook/route.ts`).
2. Record token counts, model IDs, and attempt outcomes in redacted OTel GenAI spans (`kit/workbooks/sample-otel-spans.json`).
3. Feed exported spans into `ingestOtelTraceSpans` (`kit/workbooks/evaluate-workbook.mjs`) to audit real retry multipliers and cost per accepted run.

## 5. Worked implementation and red-team walkthrough

In `kit/workbooks/sample-otel-spans.json` and `kit/workbooks/evaluate-workbook.mjs`, we ship a working trace-to-cost pipeline:

- `sample-otel-spans.json` contains three spans across two runs (`run_101` and `run_102`):
  - `tr_01` (`run_101`, `attempt: 1`, `accepted: false`): `tier-b-balanced-builder`, `38,000` input tokens, `3,200` output tokens, `USD 0.01` tool cost -> `USD 0.1720` on a failed first attempt (example only — check current pricing: USD 3.00 / USD 15.00 per 1M tokens).
  - `tr_02` (`run_101`, `attempt: 2`, `accepted: true`): `tier-b-balanced-builder`, `44,000` input tokens, `4,800` output tokens, `USD 0.02` tool cost -> `USD 0.2240` on the accepted retry (example only — check current pricing: USD 3.00 / USD 15.00 per 1M tokens).
  - `tr_03` (`run_102`, `attempt: 1`, `accepted: true`): `tier-c-frontier-reasoner`, `60,000` input tokens, `6,000` output tokens, `USD 0.05` tool cost -> `USD 0.5000` (example only — check current pricing: USD 5.00 / USD 25.00 per 1M tokens).
- When `evaluate-workbook.mjs` runs `ingestOtelTraceSpans(sampleSpans)`, it sums all three spans (`totalComputeCostUsd = USD 0.8960` across `142,000` input tokens and `14,000` output tokens, example only — check current pricing) and divides by the `2` accepted runs, reporting `meanAttemptsPerRun: 1.5` and `costPerAcceptedRunUsd: 0.448`.

### Red-team verification checklist for chapter 09

- Pass a span batch where all spans have `accepted: false` into `ingestOtelTraceSpans` and confirm it throws an infinite-cost error rather than returning a finite number.
- Pass a span naming an unknown model ID into `ingestOtelTraceSpans` and confirm it throws an unknown-model error rather than silently pricing tokens at zero cost.
- Run `node products/agentic-architecture/kit/workbooks/evaluate-workbook.mjs` and confirm the OTel trace summary matches `costPerAcceptedRunUsd: 0.448`.

## 6. Operational metrics and production rollout sequence

Connecting OpenTelemetry GenAI tracing to deterministic secret redaction and unit-economics ingestion closes the loop between engineering operations and financial control:

1. **Step 1 (Redaction filter at the logger and span boundary):** Route all error logs and span attributes through a deterministic redactor before serialization so raw `Authorization` headers, signing secrets, and customer email addresses never reach stdout or external collectors. Verify with automated tests that error responses emit only machine-readable codes (`E_ORDER_CONFLICT`, `E_OAUTH_AUDIENCE_MISMATCH`, `E_TENANT_MISMATCH`).
2. **Step 2 (Mandatory attempt and acceptance tagging on spans):** Tag every model and tool span with `runId`, `attempt`, `accepted`, `gen_ai.request.model`, `gen_ai.usage.input_tokens`, `gen_ai.usage.output_tokens`, and `tool.cost_usd`. Without `attempt` and `accepted` tags on the span, observability tools report only per-call averages rather than cost per accepted outcome.
3. **Step 3 (Weekly trace-to-workbook reconciliation):** Export production span batches into `ingestOtelTraceSpans` (`kit/workbooks/evaluate-workbook.mjs`) to compare actual `meanAttemptsPerRun` and `costPerAcceptedRunUsd` against the workload's 70% soft stop and 80% hard stop ceilings, adjusting retry caps or model tier routing whenever retry overhead creeps upward.
