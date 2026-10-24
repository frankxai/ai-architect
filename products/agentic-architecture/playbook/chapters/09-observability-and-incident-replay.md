# Chapter 09: Observability Planes, OpenTelemetry GenAI Traces, and Incident Replay

**Pattern ID:** `PAT-09` (PII-Redacted Span Graph with Deterministic Replay Fixtures)
**Decision Record:** [`ADR-0009`](../../kit/adrs/ADR-0009.md)
**Failure Mode:** `FM-09` (Opaque Multi-Step Failure With Unredacted Credentials in Logs)

[[PLAYBOOK_FIG_CH09_OTEL_REPLAY]]

## 1. Architecture Pattern: `PAT-09` PII-Redacted Span Graph with Deterministic Replay Fixtures

### Problem Statement
When a multi-step agent run fails in production, raw logs either lack the intermediate tool inputs needed to reproduce the bug or dump raw API keys and customer PII into log aggregators.

### Structural Solution
Emit structured OpenTelemetry GenAI spans (`gen_ai.system`, `gen_ai.request.model`, `gen_ai.usage.input_tokens`, `tool.name`, `tool.tier`, `run.attempt`) through a redaction filter that strips bearer tokens, secrets, and raw email addresses, and store sanitized failure fixtures for deterministic local replay.

### Invariants
1. Every boundary contract is enforced by deterministic code and verified by an automated test in CI.
2. No vendor credential, tenant identifier, or approval token is trusted from model-generated text alone.
3. All state transitions produce a versioned, hash-verifiable receipt.

## 2. Decision Record Template: `ADR-0009`

Full worked record: [`kit/adrs/ADR-0009.md`](../../kit/adrs/ADR-0009.md).

```markdown
# ADR-0009: Record Reconstructable Run Receipts Without Leaking Customer Secrets

- **Status:** Accepted
- **Date:** 2026-10-24
- **Pattern:** PAT-09 (PII-Redacted Span Graph with Deterministic Replay Fixtures)
- **Mitigates:** FM-09 (Opaque Multi-Step Failure With Unredacted Credentials in Logs)

## Context
When a multi-step agent run fails in production, raw logs either lack the intermediate tool inputs needed to reproduce the bug or dump raw API keys and customer PII into log aggregators.

## Decision
Emit structured OpenTelemetry GenAI spans (`gen_ai.system`, `gen_ai.request.model`, `gen_ai.usage.input_tokens`, `tool.name`, `tool.tier`, `run.attempt`) through a redaction filter that strips bearer tokens, secrets, and raw email addresses, and store sanitized failure fixtures for deterministic local replay.

## Consequences
- **Positive:** Eliminates `FM-09` through a deterministic, script-checkable boundary.
- **Negative / Cost:** Requires maintaining explicit schema contracts and CI regression tests.

## Verification Command
`node products/agentic-architecture/scripts/verify-agentic-architecture.mjs`
```

## 3. Production Failure Mode: `FM-09` (Opaque Multi-Step Failure With Unredacted Credentials in Logs)

- **Trigger:** An error handler logs the full HTTP request headers and body on a 409 or 500 failure, exposing customer email addresses and webhook secrets in shared CI/CD logs.
- **Blast Radius:** Silent state corruption, security boundary breach, or unrecoverable production outage across dependent workflows.
- **Detection Telemetry:** Deterministic contract test failure or runtime invariant exception (`E_SIGNATURE`, `E_TENANT_REQUIRED`, `E_SCHEMA_DRIFT`, `E_ORDER_CONFLICT`).
- **Deterministic Mitigation:** Log only structured, PII-free error codes (`{ level: 'error', event: 'commerce_order_conflict', code: 'E_ORDER_CONFLICT', mode }`) and bind full diagnostic state to access-controlled, secret-redacted trace stores.
