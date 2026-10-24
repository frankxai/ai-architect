# Chapter 10: Release Gates, Portable Ownership, and Sovereign Exit Readiness

**Pattern ID:** `PAT-10` (Nine-Stage Evidence Gate and Zero-Lock-In Export Package)
**Decision Record:** [`ADR-0010`](../../kit/adrs/ADR-0010.md)
**Failure Mode:** `FM-10` (Unverified Production Launch With Hardcoded Vendor Lock-In)

[[PLAYBOOK_FIG_CH10_GOVERNANCE_GATE]]

## 1. Architecture Pattern: `PAT-10` Nine-Stage Evidence Gate and Zero-Lock-In Export Package

### Problem Statement
Products and agent workflows often ship with unverified marketing claims, broken buyer archives, or deep coupling to a single hosted platform that can change pricing or terms overnight.

### Structural Solution
Require a six-gate release receipt (`G0` claim-to-source truth, `G1` deterministic CI, `G2` clean-room buyer simulation from the extracted archive, `G3` cross-model independent review, `G4` post-purchase delivery and revocation rehearsal, `G5` owner-ratified pricing) plus a tested 48-hour exit path exporting all prompts, ADRs, schemas, and data to open formats.

### Invariants
1. Every boundary contract is enforced by deterministic code and verified by an automated test in CI.
2. No vendor credential, tenant identifier, or approval token is trusted from model-generated text alone.
3. All state transitions produce a versioned, hash-verifiable receipt.

## 2. Decision Record Template: `ADR-0010`

Full worked record: [`kit/adrs/ADR-0010.md`](../../kit/adrs/ADR-0010.md).

```markdown
# ADR-0010: Enforce Release-Gate Receipts and 48-Hour Provider Exit Drills

- **Status:** Accepted
- **Date:** 2026-10-24
- **Pattern:** PAT-10 (Nine-Stage Evidence Gate and Zero-Lock-In Export Package)
- **Mitigates:** FM-10 (Unverified Production Launch With Hardcoded Vendor Lock-In)

## Context
Products and agent workflows often ship with unverified marketing claims, broken buyer archives, or deep coupling to a single hosted platform that can change pricing or terms overnight.

## Decision
Require a six-gate release receipt (`G0` claim-to-source truth, `G1` deterministic CI, `G2` clean-room buyer simulation from the extracted archive, `G3` cross-model independent review, `G4` post-purchase delivery and revocation rehearsal, `G5` owner-ratified pricing) plus a tested 48-hour exit path exporting all prompts, ADRs, schemas, and data to open formats.

## Consequences
- **Positive:** Eliminates `FM-10` through a deterministic, script-checkable boundary.
- **Negative / Cost:** Requires maintaining explicit schema contracts and CI regression tests.

## Verification Command
`node products/agentic-architecture/scripts/verify-agentic-architecture.mjs`
```

## 3. Production Failure Mode: `FM-10` (Unverified Production Launch With Hardcoded Vendor Lock-In)

- **Trigger:** A team launches a paid agent product whose downloadable archive fails with `ENOENT` outside the developer's git checkout because a test imports an excluded internal file.
- **Blast Radius:** Silent state corruption, security boundary breach, or unrecoverable production outage across dependent workflows.
- **Detection Telemetry:** Deterministic contract test failure or runtime invariant exception (`E_SIGNATURE`, `E_TENANT_REQUIRED`, `E_SCHEMA_DRIFT`, `E_ORDER_CONFLICT`).
- **Deterministic Mitigation:** Unzip the built release package in an isolated `/tmp` directory outside the git repository and run cold install + verification (`G2`) before any checkout or public release is permitted.
