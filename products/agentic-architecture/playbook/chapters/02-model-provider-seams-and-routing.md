# Chapter 02: Model-Provider Seams and Routing Under Model Churn

**Pattern ID:** `PAT-02` (Task-Tiered Model Gateway with Pinned Snapshot Contracts)
**Decision Record:** [`ADR-0002`](../../kit/adrs/ADR-0002.md)
**Failure Mode:** `FM-02` (Silent Provider Alias Drift Breaking Structured Output Schemas)

[[PLAYBOOK_FIG_CH02_MODEL_SEAM]]

## 1. Architecture Pattern: `PAT-02` Task-Tiered Model Gateway with Pinned Snapshot Contracts

### Problem Statement
Vendor model catalogs change every few weeks, deprecating floating aliases and shifting structured-output behavior.

### Structural Solution
Route all language model calls through an internal capability seam (`fast-classifier`, `balanced-builder`, `frontier-reasoner`, `independent-checker`) backed by pinned snapshot IDs, schema validation on every response, and a tested fallback provider from a second model family.

### Invariants
1. Every boundary contract is enforced by deterministic code and verified by an automated test in CI.
2. No vendor credential, tenant identifier, or approval token is trusted from model-generated text alone.
3. All state transitions produce a versioned, hash-verifiable receipt.

## 2. Decision Record Template: `ADR-0002`

Full worked record: [`kit/adrs/ADR-0002.md`](../../kit/adrs/ADR-0002.md).

```markdown
# ADR-0002: Isolate Vendor SDKs Behind One Canonical Capability Seam

- **Status:** Accepted
- **Date:** 2026-10-24
- **Pattern:** PAT-02 (Task-Tiered Model Gateway with Pinned Snapshot Contracts)
- **Mitigates:** FM-02 (Silent Provider Alias Drift Breaking Structured Output Schemas)

## Context
Vendor model catalogs change every few weeks, deprecating floating aliases and shifting structured-output behavior.

## Decision
Route all language model calls through an internal capability seam (`fast-classifier`, `balanced-builder`, `frontier-reasoner`, `independent-checker`) backed by pinned snapshot IDs, schema validation on every response, and a tested fallback provider from a second model family.

## Consequences
- **Positive:** Eliminates `FM-02` through a deterministic, script-checkable boundary.
- **Negative / Cost:** Requires maintaining explicit schema contracts and CI regression tests.

## Verification Command
`node products/agentic-architecture/scripts/verify-agentic-architecture.mjs`
```

## 3. Production Failure Mode: `FM-02` (Silent Provider Alias Drift Breaking Structured Output Schemas)

- **Trigger:** An application hardcodes a floating vendor alias (`latest`) across 40 call sites; a silent upstream weight update changes JSON tool-call formatting and breaks production parsing.
- **Blast Radius:** Silent state corruption, security boundary breach, or unrecoverable production outage across dependent workflows.
- **Detection Telemetry:** Deterministic contract test failure or runtime invariant exception (`E_SIGNATURE`, `E_TENANT_REQUIRED`, `E_SCHEMA_DRIFT`, `E_ORDER_CONFLICT`).
- **Deterministic Mitigation:** Pin immutable snapshot IDs in configuration, validate every model response against a strict JSON schema before acting, and gate snapshot upgrades on the golden + refusal + injection eval triad.
