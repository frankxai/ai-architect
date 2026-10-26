# Chapter 06: Durable execution, checkpointing, and out-of-order event recovery

Pattern ID: `PAT-06` (Write-before-mark convergent state machine and tombstone ledger)
Decision record: [`ADR-0006`](../../kit/adrs/ADR-0006.md)
Failure mode: `FM-06` (Mid-flight worker crash or out-of-order webhook dropping or resurrecting state)

[[PLAYBOOK_FIG_CH06_CONVERGENT_SAGA]]

## 1. The architect's problem

Agent workflows and commercial fulfillment loops do not execute inside a single ACID database transaction. An agent run or order lifecycle spans multiple network boundaries: an external webhook arrives from a payment or ticketing provider, a background worker runs a multi-step reasoning chain (`S11`), an entitlement or artifact is written to storage, and a signed delivery notification is dispatched.

In distributed production environments, three timing and failure anomalies happen regularly:

1. **Mid-flight crash after premature deduplication (`FM-06a`):** A developer writes an event handler that checks `if (store.hasEvent(event.id)) return duplicate`, immediately calls `store.markEvent(event.id)`, and then writes the order and entitlement rows. When a transient database timeout or container OOM occurs between `markEvent` and `putEntitlement`, the handler returns HTTP 500. When the upstream provider retries the webhook two minutes later, `hasEvent(event.id)` returns `true` and the handler responds `200 duplicate` without ever granting the customer's entitlement.
2. **Out-of-order cancellation or refund arriving before grant (`FM-06b`):** Webhook delivery queues do not guarantee total ordering across event types. When an operator or customer triggers an immediate refund or job cancellation, the `order.refunded` or `job.cancelled` webhook can arrive at the worker 500 milliseconds before the delayed `order.paid` or `job.started` webhook. If the handler rejects the refund with HTTP 422 ("unknown order") or ignores it, the delayed payment webhook arrives next and grants permanent access to a refunded order.
3. **Conflicting order-ID reuse (`FM-06c`):** A misconfigured upstream integration or replay attack sends a second `order.paid` event with an existing `orderId` but a different buyer email, SKU, or currency amount. Silently overwriting the existing record corrupts the audit ledger.

Durable execution requires designing every state transition as a convergent, write-before-mark state machine with terminal tombstones.

## 2. Architecture pattern: `PAT-06` Write-before-mark convergent state machine and tombstone ledger

### Context and forces

Your system processes asynchronous events and long-running agent jobs that may crash mid-step, retry up to ten times over 24 hours, or arrive out of chronological order. You must guarantee that retries converge to the exact intended state without double-granting, that a revoked or refunded record can never be resurrected by a late-arriving grant event, and that conflicting payloads on the same business key fail closed.

### Structural solution

Implement a **Convergent Saga State Machine** (`kit/workflows/n8n-agentic-triage-and-approval.json` and `templates/deploy/durable-worker/`):

1. **Timestamp-Bound HMAC Verification at Ingress (`timestamp.rawBody`):**
   Every inbound webhook must carry an integer Unix timestamp header (`x-webhook-timestamp`) within a 300-second freshness window, and the HMAC-SHA256 signature must cover `${timestamp}.${rawBody}` so a captured payload cannot be replayed later with a forged fresh timestamp.
2. **Write-Before-Mark Ordering:**
   When processing an event `event.id`, the handler checks `hasEvent(event.id)` first. If not yet marked, it executes each state transition as an **idempotent upsert** (`putOrder`, `recordOnce`, `putEntitlement`) and calls `markEvent(event.id)` **only on the final line** after every state write has succeeded. If step 2 throws an error, `event.id` remains unmarked, and the next retry re-runs step 1 (which is a no-op upsert) and completes step 2.
3. **Early-Refund / Cancellation Tombstone (`paidAt: null, status: "refunded"`):**
   When an `order.refunded` or `job.cancelled` event arrives for an `orderId` that does not yet exist in the store, the state machine does not return 422. Instead, it writes a **tombstone record** (`status: "refunded", paidAt: null, refundedAt: event.occurredAt`). When the delayed `order.paid` event arrives later, the handler sees `existing.status === "refunded"`, marks the late payment event processed, and returns `duplicate` without granting an entitlement.
4. **Conflict Detection on Business Key Reuse (`409 E_ORDER_CONFLICT`):**
   When an `order.paid` event arrives for an existing `orderId` that is not refunded, the handler compares the immutable business facts (`merchant`, `sku`, `email`, `amount`, `currency`). If any fact differs, it throws `E_ORDER_CONFLICT` (HTTP 409) and emits a PII-free operator alert.

```
[Inbound Event] ---> [1. Verify timestamp (300s) & HMAC(timestamp.rawBody)]
                                      |
                    +-----------------+-----------------+
                    | event.type == "order.paid"        | event.type == "order.refunded"
                    v                                   v
      [existing?.status == "refunded"?]       [existing missing? -> Write Tombstone]
      - Yes: markEvent & return duplicate     (status="refunded", paidAt=null)
      - Conflict? -> 409 E_ORDER_CONFLICT     [Revoke active entitlement if present]
      - Upsert Order -> Upsert Entitlement    [markEvent(event.id) LAST]
      - markEvent(event.id) LAST
```

### State-machine invariants enforced by code

- **Terminal states are absorbing:** Once an order or job enters `status === "refunded"` or `status === "revoked"`, no subsequent event can transition its entitlement back to `active`.
- **`markEvent` is always the final statement:** No state mutation may occur after `markEvent(event.id)` is called.
- **One ledger entry per `(activityName, orderId)` pair:** `recordOnce` deduplicates activity log entries by composite key so partial retries never produce duplicate ledger rows.

## 3. Decision record template: `ADR-0006`

Full worked record: [`kit/adrs/ADR-0006.md`](../../kit/adrs/ADR-0006.md).

```markdown
# ADR-0006: Design idempotent saga transitions for long-running agent jobs

- **Status:** Accepted
- **Date:** 2026-10-24
- **Pattern:** PAT-06 (Write-before-mark convergent state machine and tombstone ledger)
- **Mitigates:** FM-06 (Mid-flight worker crash or out-of-order webhook dropping or resurrecting state)

## Context
Asynchronous agent workers and webhook handlers experience mid-transaction crashes, network retries, and out-of-order events such as a refund arriving before payment confirmation.

## Decision
Execute idempotent state upserts before marking an event ID processed (`write-before-mark`), record a refunded tombstone (`paidAt: null, status: 'refunded'`) when cancellation arrives first, and raise `409 E_ORDER_CONFLICT` when an order ID is reused with conflicting buyer facts.

## Alternatives considered and rejected
1. **Mark `event.id` processed at the start of the handler:** Rejected because a database failure after marking causes retries to return `duplicate` and drop the entitlement.
2. **Return HTTP 422 when a refund arrives for an unknown order ID:** Rejected because the delayed payment webhook arriving next will grant access to a refunded order.
3. **Silently overwrite existing records on duplicate order ID:** Rejected because conflicting buyer parameters corrupt financial reconciliation.

## Verification command
`node --experimental-strip-types products/agentic-architecture/scripts/verify-agentic-architecture.mjs`
```

## 4. Production failure mode: `FM-06`

### Failure story and trigger

A customer purchases digital access, and the payment provider dispatches `evt_paid_01`. During execution, the key-value store times out after `markEvent("evt_paid_01")` but before `putEntitlement`. Two minutes later, the customer requests a refund (`evt_refund_01`), and simultaneously the payment provider retries `evt_paid_01`.

### Blast radius when unmitigated

In a mark-before-write system, the retry of `evt_paid_01` is ignored as a duplicate, leaving the order in a half-written state. In a system without early-refund tombstones, if `evt_refund_01` arrives before `evt_paid_01` is written, the refund is rejected with 422 and the subsequent `evt_paid_01` grants permanent active access to a customer who was already refunded.

### Detection telemetry

- Reconciliation mismatch where `orders.filter(o => o.status === "paid").length` differs from `entitlements.filter(e => e.status === "active").length`.
- Structured log event `commerce_order_conflict` with code `E_ORDER_CONFLICT` (HTTP 409).
- Token redemption attempt on a revoked entitlement returning `E_REVOKED` (HTTP 410).

### Deterministic mitigation

1. Enforce write-before-mark ordering in all webhook and worker state transitions (`kit/workflows/n8n-agentic-triage-and-approval.json` node `n5` and `templates/deploy/durable-worker/`).
2. Write a refunded tombstone (`paidAt: null, status: "refunded"`) whenever a signed refund event arrives before its corresponding payment event.
3. Verify idempotency replay (`outcome: "duplicate_replay"`) in `kit/mcp/reference-mcp-server.mjs` (`stage_adr_draft`).

## 5. Worked implementation and red-team walkthrough

In `kit/workflows/n8n-agentic-triage-and-approval.json` and `templates/deploy/durable-worker/src/server.test.js`, the six workflow nodes enforce the complete durable loop:

1. **Node `n1` (`Webhook Ingress`) & Node `n2` (`Verify Timestamp and HMAC`):** Rejects any request missing `x-webhook-timestamp` or outside the 300-second window, and verifies the HMAC over `${timestamp}.${rawBody}`.
2. **Node `n3` (`Tag Untrusted Ingress and Classify Tier`) & Node `n4` (`Two-Phase Human Approval Gate`):** Wraps external strings in `<untrusted-content>` and pauses Tier-2 actions for a signed approval token.
3. **Node `n5` (`Write-Before-Mark Convergent Executor`) & Node `n6` (`Emit PII-Redacted OpenTelemetry Receipt`):** Upserts the target record using the scoped `idempotencyKey` before marking the event ID complete, and emits a PII-free span receipt.

### Red-team verification checklist for chapter 06

- Inject a simulated store failure between `putOrder` and `putEntitlement`, retry the same event, and confirm the second attempt converges to `granted` with exactly one order and one entitlement.
- Deliver `order.refunded` before `order.paid` for the same `orderId` and confirm the final order status is `refunded` with zero active entitlements.
- Deliver a second `order.paid` with the same `orderId` but a different `amount` or `email` and confirm `E_ORDER_CONFLICT`.

## 6. Operational metrics and production rollout sequence

Migrating webhook handlers and long-running agent workers from naive mark-first processing to a convergent write-before-mark state machine requires three operational checks:

1. **Step 1 (Ingress timestamp and HMAC binding):** Require an integer Unix timestamp header (`x-webhook-timestamp` or `x-commerce-timestamp`) within a 300-second clock-skew window on every webhook endpoint, and compute the HMAC-SHA256 signature over the concatenation of timestamp and raw request body. Reject missing or stale timestamps before parsing JSON.
2. **Step 2 (Idempotent upsert audit and write-before-mark reordering):** Inspect every database write inside the event handler to confirm it is an idempotent upsert keyed on the business identifier (`orderId` or `entitlementId`), and move `markEvent(event.id)` to the final line of the handler. Fault-test the handler by throwing an exception between the first and second write and verifying that a retry completes the missing write without duplicating ledger entries.
3. **Step 3 (Early-refund tombstone and conflict alerting):** Add the refunded tombstone path (`paidAt: null, status: "refunded"`) for out-of-order cancellations and wire `409 E_ORDER_CONFLICT` responses to a PII-free structured error log so operators are alerted immediately if an upstream system reuses an order identifier with conflicting parameters.
