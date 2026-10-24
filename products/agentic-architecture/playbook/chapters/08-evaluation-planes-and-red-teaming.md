# Chapter 08: Evaluation Planes, Regression Suites, and Adversarial Red-Teaming

**Pattern ID:** `PAT-08` (Golden-Case, Refusal, and Injection Triad Gate in CI)
**Decision Record:** [`ADR-0008`](../../kit/adrs/ADR-0008.md)
**Failure Mode:** `FM-08` (Benchmark Overfitting Masking Production Refusal or Injection Regressions)

[[PLAYBOOK_FIG_CH08_EVAL_TRIAD]]

## 1. Architecture Pattern: `PAT-08` Golden-Case, Refusal, and Injection Triad Gate in CI

### Problem Statement
Teams evaluate prompts by eyeball or with a handful of happy-path examples, missing regressions in refusal boundaries and prompt-injection resistance when prompts or skills change.

### Structural Solution
Maintain a versioned JSONL evaluation suite (`evals/cases/`) containing three mandatory case classes: `golden` (required capabilities and schema invariants), `refusal` (requests the system must decline), and `injection` (adversarial inputs attempting to override instructions or escalate scope). Run the suite in CI on every pull request.

### Invariants
1. Every boundary contract is enforced by deterministic code and verified by an automated test in CI.
2. No vendor credential, tenant identifier, or approval token is trusted from model-generated text alone.
3. All state transitions produce a versioned, hash-verifiable receipt.

## 2. Decision Record Template: `ADR-0008`

Full worked record: [`kit/adrs/ADR-0008.md`](../../kit/adrs/ADR-0008.md).

```markdown
# ADR-0008: Block Deployment on Deterministic Contract and Adversarial Eval Suites

- **Status:** Accepted
- **Date:** 2026-10-24
- **Pattern:** PAT-08 (Golden-Case, Refusal, and Injection Triad Gate in CI)
- **Mitigates:** FM-08 (Benchmark Overfitting Masking Production Refusal or Injection Regressions)

## Context
Teams evaluate prompts by eyeball or with a handful of happy-path examples, missing regressions in refusal boundaries and prompt-injection resistance when prompts or skills change.

## Decision
Maintain a versioned JSONL evaluation suite (`evals/cases/`) containing three mandatory case classes: `golden` (required capabilities and schema invariants), `refusal` (requests the system must decline), and `injection` (adversarial inputs attempting to override instructions or escalate scope). Run the suite in CI on every pull request.

## Consequences
- **Positive:** Eliminates `FM-08` through a deterministic, script-checkable boundary.
- **Negative / Cost:** Requires maintaining explicit schema contracts and CI regression tests.

## Verification Command
`node products/agentic-architecture/scripts/verify-agentic-architecture.mjs`
```

## 3. Production Failure Mode: `FM-08` (Benchmark Overfitting Masking Production Refusal or Injection Regressions)

- **Trigger:** A prompt edit intended to make the assistant more helpful accidentally removes a refusal boundary, allowing the agent to generate unsafe output or execute unapproved actions.
- **Blast Radius:** Silent state corruption, security boundary breach, or unrecoverable production outage across dependent workflows.
- **Detection Telemetry:** Deterministic contract test failure or runtime invariant exception (`E_SIGNATURE`, `E_TENANT_REQUIRED`, `E_SCHEMA_DRIFT`, `E_ORDER_CONFLICT`).
- **Deterministic Mitigation:** Gate every prompt, skill, and model-routing change on a zero-failure run of the golden + refusal + injection triad (`evals/run.mjs` and `kit/prompts/prompt-set.json`).
