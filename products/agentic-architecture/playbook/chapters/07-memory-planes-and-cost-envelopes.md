# Chapter 07: Memory Planes, State Convergence, and All-Attempts Cost Envelopes

**Pattern ID:** `PAT-07` (Episodic Working Memory and Versioned Semantic Ledger with Hard Budget Breakers)
**Decision Record:** [`ADR-0007`](../../kit/adrs/ADR-0007.md)
**Failure Mode:** `FM-07` (Unbounded Memory Compaction Drift and Runaway Retry Spend)

[[PLAYBOOK_FIG_CH07_COST_ENVELOPE]]

## 1. The Architect's Problem

Long-running agent systems fail in two places that rarely appear in prototype demos: **memory drift across compaction boundaries** and **all-attempts unit economics**.

In a ten-minute demo, the entire conversation fits inside one context window and the first model call succeeds. In production over weeks of operation, two things happen:

1. **Compaction erases operational invariants:** As the transcript grows, automatic context summarization compresses earlier messages. Hard numbers, negative constraints ("never touch repository X", "budget is $50"), and half-finished checklists get smoothed into vague prose. On the next turn, the agent violates a constraint it agreed to two hours earlier.
2. **Happy-path pricing hides real cost per accepted outcome:** Teams calculate unit economics by multiplying one prompt's token count by the model's list price. In reality, a production workflow includes failed attempts, tool-error retries, context reloads, checker passes, and human review minutes. When a step hits a transient rate limit or validation error and retries five times with a 200k-token context window, a task budgeted at $0.15 silently costs $4.50.

This chapter defines the architecture pattern that keeps long-running agent state accurate across compactions while bounding the **all-attempts cost per accepted result**.

## 2. Architecture Pattern: `PAT-07` Episodic Working Memory and Versioned Semantic Ledger with Hard Budget Breakers

### Context and Forces

Your agent executes multi-step tasks across long sessions or recurring schedules. It must retain exact facts, plans, and user corrections across context compactions while staying strictly inside a per-run and per-tenant dollar envelope.

### Structural Solution

Separate the memory and cost plane into three explicit stores governed by a deterministic **Cost and Compaction Controller** (`kit/workbooks/evaluate-workbook.mjs`):

1. **Ephemeral Scratchpad (Turn-Local):**
   Raw tool outputs and intermediate search snippets live only for the current turn or in external disk files (`/tmp` or workspace slices) referenced by path and byte range. Large tool payloads are never pumped inline through every subsequent model turn.
2. **Structured Working Context Document (Session-Scoped):**
   A persistent, section-addressed document (`Numbers & Values`, `Constraints`, `Decisions`, `Plan Tasks`) updated explicitly before and after multi-step work. When the chat transcript compacts, this structured document is injected verbatim without summarization so exact SHAs, budgets, and stop rules never blur.
3. **Versioned Semantic Memory Ledger (Cross-Session, Tenant-Isolated):**
   Durable facts and preferences stored with mandatory provenance (`tenantId`, `sourceThreadId`, `savedBy`, `createdAt`, `versionHistory`) and snapshot-before-write semantics so any memory mutation can be audited or rolled back.
4. **All-Attempts Cost Envelope and Circuit Breaker:**
   Every model call, tool invocation, and checker pass increments a live run ledger:
   $$	ext{Cost}_{	ext{accepted}} = rac{\sum_{i=1}^{N_{	ext{attempts}}} (	ext{Tokens}_{	ext{in},i} \cdot P_{	ext{in}} + 	ext{Tokens}_{	ext{out},i} \cdot P_{	ext{out}} + 	ext{ToolCost}_i) + 	ext{HumanMinutes} \cdot P_{	ext{human}}}{	ext{AcceptedOutcomes}}$$
   The controller enforces a soft warning threshold at 70% of `maxBudgetUsd`, a hard stop at 80% for unattended runs, and a circuit breaker that halts retry loops after `maxRetries` (default 2) on the same step signature.

```
+-------------------------------------------------------------------------+
|                   Cost & Compaction Controller                          |
|  - Tracks all-attempts tokens + retries + human review cost             |
|  - Halts at 80% unattended budget ceiling or maxRetries=2               |
+-------------------+---------------------------------+-------------------+
                    |                                 |
                    v                                 v
+-----------------------------------+   +---------------------------------+
| Structured Working Context Doc    |   | Versioned Semantic Memory Store |
| - Verbatim across compaction      |   | - Partitioned by tenantId       |
| - Exact SHAs, constraints, tasks  |   | - Snapshot before every update  |
+-----------------------------------+   +---------------------------------+
```

### Invariants Enforced by Code

- **Tenant key required on every memory read and write:** Any memory query missing a verified `tenantId` throws `E_TENANT_REQUIRED` (preventing cross-tenant bleed such as `GHSA-5324`-class vulnerabilities).
- **All-attempts accounting:** Failed attempts, rejected drafts, and checker runs are summed into the denominator of cost per accepted result (`kit/workbooks/evaluate-workbook.mjs`).
- **Compaction-proof constraints:** Standing constraints and task checkboxes live in the structured working document, never solely in rolling chat history.

## 3. Decision Record Template: `ADR-0007`

Use this template (shipped in `kit/adrs/ADR-0007.md`) when designing memory retention and cost controls:

```markdown
# ADR-0007: Bound Token, Retry, and Human-Review Cost per Accepted Outcome

- **Status:** Accepted
- **Date:** 2026-10-24
- **Pattern:** PAT-07 (Episodic Working Memory and Versioned Semantic Ledger with Hard Budget Breakers)
- **Mitigates:** FM-07 (Unbounded Memory Compaction Drift and Runaway Retry Spend)

## Context
Long-running agent sessions lose exact constraints during rolling transcript summarization, and naive single-call token estimates understate real production spend by ignoring retries, rejected drafts, and human review time.

## Decision
Store session invariants in a verbatim structured working document, isolate cross-session memories by tenantId with version snapshots, and enforce an all-attempts cost circuit breaker that counts every retry and human review minute against a hard per-run USD ceiling.

## Alternatives Considered and Rejected
1. **Relying on rolling chat summarization alone:** Rejected because lossy summarization drops negative constraints, exact file paths, and commit SHAs.
2. **Global unpartitioned vector memory store:** Rejected because shared namespaces leak facts across tenants and lack reversible version history.
3. **Pricing models on first-pass token counts only:** Rejected because a 25% retry rate with a 150k context window doubles actual cloud spend and erodes margin.

## Consequences
- **Positive:** Constraints survive arbitrarily long sessions, memories are reversible and tenant-isolated, and runaway retry loops trip a hard stop before exhausting budget.
- **Negative / Cost:** Requires explicit working-doc updates and per-step telemetry hooks on every model and tool call.

## Verification Command
`node products/agentic-architecture/scripts/verify-agentic-architecture.mjs`
```

## 4. Production Failure Mode: `FM-07`

### Trigger
A long-running agent hits context compaction three times during a multi-repo build while simultaneously encountering a flaky upstream API that triggers repeated full-context retries.

### Blast Radius When Unmitigated
Compaction drops the "parked repo — do not touch" constraint, causing the agent to push commits to a frozen repository, while the retry loop burns through $180 of frontier model tokens on a task budgeted for $15.

### Detection Telemetry
- `run.attempt_count > 2` on the same `(step_id, tool_name)` pair.
- `run.cumulative_cost_usd >= 0.80 * run.max_budget_usd`.
- Working-context drift check failing to find pinned constraint tokens after a compaction event.

### Deterministic Mitigation
1. Persist all standing constraints, SHAs, and budget ceilings in the structured working document outside the compacted message array.
2. Push waits and backoff into bounded shell commands (`curl --retry` or `timeout 90`) rather than spending full-context model turns polling.
3. Evaluate every workload through `kit/workbooks/evaluate-workbook.mjs` before deployment to set `maxBudgetUsd`, `softStopUsd` (70%), and `hardStopUsd` (80%).

### Executable Verification in This Kit
- Run `node products/agentic-architecture/kit/workbooks/evaluate-workbook.mjs` to compute the all-attempts unit economics and verify that all 10 threat controls and cost ceilings pass.

## 5. Worked Implementation and Red-Team Walkthrough

Consider an autonomous research and release lane given a $250 budget envelope to prepare a multi-repository launch over a 24-hour sprint. After four hours and 60 tool calls, the conversation history reaches the context limit and compacts. In a standard chat harness, the compaction summary retains the high-level goal ("ship the release") but drops two critical facts from turn 3: that repository A is parked due to a permission block, and that checkout must stay disabled (`price.state: "decision_required"`). Meanwhile, a flaky external link-check step fails three times, and the agent retries the entire 120k-token turn four times in a row.

When you apply `PAT-07` and `kit/workbooks/evaluate-workbook.mjs`, both failure paths are closed by construction:

1. **Compaction-proof working context document:** Before executing any multi-step plan, the agent writes its standing constraints, parked resources, exact commit SHAs, and task checklist into a dedicated, section-addressed working document (`Numbers & Values`, `Constraints`, `Decisions`, `Plan Tasks`). Because this document is stored outside the rolling chat transcript and reloaded verbatim on every turn, three context compactions in a row cannot erase a single SHA, budget cap, or stop rule.
2. **All-attempts cost modeling (`evaluate-workbook.mjs`):** Rather than multiplying a single happy-path prompt by list token rates, the workbook models both the mean attempt multiplier (`mean_attempts_per_accepted_run`, typically 1.15x to 1.40x) and the 95th-percentile attempt multiplier (`p95_attempts_per_accepted_run`, typically 1.60x to 2.20x), plus tool execution fees and human review minutes (`human_review_minutes_per_accepted_run * human_hourly_rate_usd / 60`).
3. **Soft 70% warning and hard 80% stop:** Every workload in `threat-and-cost-workbook.json` defines `max_run_budget_usd`. The evaluator computes `softStopUsd = 0.70 * max_run_budget_usd` and `hardStopUsd = 0.80 * max_run_budget_usd`, and verifies that even at p95 retry rates (`p95ComputeCostPerAccepted`), the compute spend per run stays strictly below `hardStopUsd`. If a workload's p95 retry cost exceeds the 80% ceiling, the build fails before deployment.

### Red-Team Verification Checklist for Chapter 07
- Simulate a compaction boundary by clearing the rolling message buffer and verifying that all standing constraints and parked-resource rules remain intact in the working context document.
- Increase `p95_attempts_per_accepted_run` in a test fixture until p95 compute cost exceeds `0.80 * max_run_budget_usd` and confirm `evaluateWorkbook` throws an envelope violation error.
- Query the semantic memory store without a `tenantId` and confirm the store throws `E_TENANT_REQUIRED` rather than returning cross-tenant records.
