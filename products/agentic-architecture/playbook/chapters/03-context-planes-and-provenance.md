# Chapter 03: Context Planes, Provenance Ledgers, and Retrieval Hygiene

**Pattern ID:** `PAT-03` (Tagged Untrusted Context Envelope and Citation-Bound Retrieval)
**Decision Record:** [`ADR-0003`](../../kit/adrs/ADR-0003.md)
**Failure Mode:** `FM-03` (Cross-Tenant Context Bleed and Unattributed Hallucination)

[[PLAYBOOK_FIG_CH03_CONTEXT_ENVELOPE]]

## 1. Architecture Pattern: `PAT-03` Tagged Untrusted Context Envelope and Citation-Bound Retrieval

### Problem Statement
Retrieval pipelines often mix documents across tenants or inject unverified passages that the model repeats as authoritative fact.

### Structural Solution
Require `tenantId` on every retrieval query, attach a source ID (`Sxx`) and access date to every retrieved passage, wrap external text in `<untrusted-content>`, and drop any generated sentence whose citation marker does not resolve to a retrieved passage.

### Invariants
1. Every boundary contract is enforced by deterministic code and verified by an automated test in CI.
2. No vendor credential, tenant identifier, or approval token is trusted from model-generated text alone.
3. All state transitions produce a versioned, hash-verifiable receipt.

## 2. Decision Record Template: `ADR-0003`

Full worked record: [`kit/adrs/ADR-0003.md`](../../kit/adrs/ADR-0003.md).

```markdown
# ADR-0003: Enforce Tenant-Scoped Retrieval and Claim-to-Source Attribution

- **Status:** Accepted
- **Date:** 2026-10-24
- **Pattern:** PAT-03 (Tagged Untrusted Context Envelope and Citation-Bound Retrieval)
- **Mitigates:** FM-03 (Cross-Tenant Context Bleed and Unattributed Hallucination)

## Context
Retrieval pipelines often mix documents across tenants or inject unverified passages that the model repeats as authoritative fact.

## Decision
Require `tenantId` on every retrieval query, attach a source ID (`Sxx`) and access date to every retrieved passage, wrap external text in `<untrusted-content>`, and drop any generated sentence whose citation marker does not resolve to a retrieved passage.

## Consequences
- **Positive:** Eliminates `FM-03` through a deterministic, script-checkable boundary.
- **Negative / Cost:** Requires maintaining explicit schema contracts and CI regression tests.

## Verification Command
`node products/agentic-architecture/scripts/verify-agentic-architecture.mjs`
```

## 3. Production Failure Mode: `FM-03` (Cross-Tenant Context Bleed and Unattributed Hallucination)

- **Trigger:** A vector search query omits the tenant filter or accepts a stale cached document, causing the assistant to state another customer's private roadmap or a fabricated policy as fact.
- **Blast Radius:** Silent state corruption, security boundary breach, or unrecoverable production outage across dependent workflows.
- **Detection Telemetry:** Deterministic contract test failure or runtime invariant exception (`E_SIGNATURE`, `E_TENANT_REQUIRED`, `E_SCHEMA_DRIFT`, `E_ORDER_CONFLICT`).
- **Deterministic Mitigation:** Enforce mandatory tenant filter predicates at the storage layer and run deterministic grounding checks (`templates/deploy/answer-core/conformance.test.mjs`) that withhold ungrounded claims.
