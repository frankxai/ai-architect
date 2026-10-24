# Chapter 06: Durable Execution, Checkpointing, and Out-of-Order Event Recovery

**Pattern ID:** `PAT-06` (Write-Before-Mark Convergent State Machine and Tombstone Ledger)
**Decision Record:** [`ADR-0006`](../../kit/adrs/ADR-0006.md)
**Failure Mode:** `FM-06` (Mid-Flight Worker Crash or Out-of-Order Webhook Dropping State)

[[PLAYBOOK_FIG_CH06_CONVERGENT_SAGA]]

## 1. Architecture Pattern: `PAT-06` Write-Before-Mark Convergent State Machine and Tombstone Ledger

### Problem Statement
Webhook handlers and asynchronous agent workers frequently fail mid-transaction or receive events out of order (for example, a refund arriving before a delayed payment notification).

### Structural Solution
Converge state writes idempotently before marking an event ID processed (`write-before-mark`), record a refunded tombstone (`paidAt: null, status: 'refunded'`) when a cancellation arrives first so a late grant can never resurrect access, and reject conflicting order-ID reuse with `409 E_ORDER_CONFLICT`.

### Invariants
1. Every boundary contract is enforced by deterministic code and verified by an automated test in CI.
2. No vendor credential, tenant identifier, or approval token is trusted from model-generated text alone.
3. All state transitions produce a versioned, hash-verifiable receipt.

## 2. Decision Record Template: `ADR-0006`

Full worked record: [`kit/adrs/ADR-0006.md`](../../kit/adrs/ADR-0006.md).

```markdown
# ADR-0006: Design Idempotent Saga Transitions for Long-Running Agent Jobs

- **Status:** Accepted
- **Date:** 2026-10-24
- **Pattern:** PAT-06 (Write-Before-Mark Convergent State Machine and Tombstone Ledger)
- **Mitigates:** FM-06 (Mid-Flight Worker Crash or Out-of-Order Webhook Dropping State)

## Context
Webhook handlers and asynchronous agent workers frequently fail mid-transaction or receive events out of order (for example, a refund arriving before a delayed payment notification).

## Decision
Converge state writes idempotently before marking an event ID processed (`write-before-mark`), record a refunded tombstone (`paidAt: null, status: 'refunded'`) when a cancellation arrives first so a late grant can never resurrect access, and reject conflicting order-ID reuse with `409 E_ORDER_CONFLICT`.

## Consequences
- **Positive:** Eliminates `FM-06` through a deterministic, script-checkable boundary.
- **Negative / Cost:** Requires maintaining explicit schema contracts and CI regression tests.

## Verification Command
`node products/agentic-architecture/scripts/verify-agentic-architecture.mjs`
```

## 3. Production Failure Mode: `FM-06` (Mid-Flight Worker Crash or Out-of-Order Webhook Dropping State)

- **Trigger:** A webhook handler marks `event.id` processed before writing the entitlement; when the database write fails with HTTP 500, the upstream retry sees the processed marker and returns `200 duplicate`, permanently dropping the customer's access.
- **Blast Radius:** Silent state corruption, security boundary breach, or unrecoverable production outage across dependent workflows.
- **Detection Telemetry:** Deterministic contract test failure or runtime invariant exception (`E_SIGNATURE`, `E_TENANT_REQUIRED`, `E_SCHEMA_DRIFT`, `E_ORDER_CONFLICT`).
- **Deterministic Mitigation:** Execute idempotent upserts for every state transition before recording `markEvent(event.id)`, and maintain a terminal tombstone state for revoked or refunded records.
