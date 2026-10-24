# Chapter 04: Multi-agent topology, handoff contracts, and Maker-Checker isolation

**Pattern ID:** `PAT-04` (Bounded Supervisor-Specialist Graph with Clean-Room Checker Gate)
**Decision Record:** [`ADR-0004`](../../kit/adrs/ADR-0004.md)
**Failure Mode:** `FM-04` (Recursive Subagent Fanout, Shared-Branch Clobbering, and Self-Grading Bias)

[[PLAYBOOK_FIG_CH04_MAKER_CHECKER]]

## 1. The architect's problem

Single-agent loops degrade when a task requires both broad synthesis and strict verification, or when distinct subtasks need incompatible tool permissions. However, replacing a single agent with an unconstrained multi-agent swarm introduces three worse failure modes:

1. **Cost and latency multiplication:** Unbounded agent-to-agent chatter multiplies token consumption by roughly 4x for single agents and 15x for multi-agent systems relative to standard chat (as measured in Anthropic's multi-agent research workload, S21) while propagating early framing errors down the chain.
2. **Shared-state clobbering:** When two parallel workers write to the same git branch, database row, or file path without an ownership lock, the slower worker silently overwrites the faster worker's changes.
3. **Self-grading bias:** When the same model family or conversation thread that authored an artifact is asked to review it, the reviewer shares the maker's blind spots and rubber-stamps broken edge cases.

Production multi-agent architecture is not about simulating a company org chart in prose. It is the discipline of isolating context windows, bounding fanout in code, assigning single-writer ownership per resource, and separating the **Maker** from the **Checker** across model families.

## 2. Architecture pattern: `PAT-04` Bounded supervisor-specialist graph with clean-room checker gate

### Context and forces

You need multiple specialized agents to collaborate on a complex engineering, research, or release workflow. You must balance throughput from parallel execution against token budget ceilings, file-write conflicts, and verification rigor.

### Structural solution

Replace conversational peer-to-peer swarms with a **Code-Led Supervisor State Machine** (`kit/workflows/supervisor-maker-checker.ts`) that enforces four rules:

1. **Code-led routing over model-led handoffs:** A deterministic state machine owns the transition graph (`frame -> make -> check -> approve -> commit`), the maximum wave size (for example, at most 3 concurrent browser workers or 5 parallel research tasks), and the per-run budget ceiling.
2. **Typed Handoff Packets (Zero Shared Transcript):** Specialists never inherit the supervisor's full chat history. Each specialist receives a self-contained JSON handoff packet (`HandoffPacket`) containing only the task objective, explicit `readPaths`, disjoint `writePaths`, a token and compute budget slice, and the acceptance rubric.
3. **Single-Writer Resource Partitioning:** The supervisor validates that no two concurrent specialists share any path in `writePaths` or any mutable branch ref before dispatching a parallel wave.
4. **Clean-Room Cross-Model Checker Gate:** Once the Maker specialist produces a candidate artifact and receipt, the supervisor dispatches an independent **Checker** running on a different model provider family in a read-only sandbox (`writePaths: []`). The Checker inspects only the packaged output and the rubric, runs deterministic tests, and emits a `PASS`, `REVISE`, or `FAIL` verdict. A Maker can never post its own gate sign-off.

```
                   +---------------------------------------+
                   |   Deterministic Supervisor (Code)     |
                   |  - Enforces maxBudgetUsd & maxWaves   |
                   |  - Verifies disjoint writePaths       |
                   +-------------------+-------------------+
                                       |
             +-------------------------+-------------------------+
             | 1. HandoffPacket (rw)                             | 2. CleanRoomPacket (ro)
             v                                                   v
+----------------------------+                     +----------------------------+
|   Maker Specialist         |                     |   Independent Checker      |
|  - Model Family A          |                     |  - Model Family B != A     |
|  - Disjoint writePaths     |                     |  - writePaths: [] (ro)     |
|  - Emits artifact + SHA256 |                     |  - Runs tests & rubric     |
+----------------------------+                     +----------------------------+
```

### Invariants enforced by code

- **Prefix-aware disjoint write sets in every parallel wave:** For any two concurrent tasks `A` and `B`, `assertDisjointWritePaths` normalizes paths and rejects both exact matches and directory-prefix overlaps (for example, `playbook/` and `playbook/ch01.md`) with `E_WRITE_COLLISION`.
- **Maker model family != Checker model family:** The supervisor rejects any gate configuration where `maker.providerFamily === checker.providerFamily` (`kit/workflows/supervisor-maker-checker.ts`).
- **Subagents cannot spawn subagents:** Recursion depth is fixed at 1 (`supervisor -> specialist`). Specialists do not receive the dispatch tool.

## 3. Decision record template: `ADR-0004`

Use this template (shipped in `kit/adrs/ADR-0004.md`) when designing any workflow with more than one agent:

```markdown
# ADR-0004: Choose Code-Led Orchestration Over Open-Ended Autonomous Swarms

- **Status:** Accepted
- **Date:** 2026-10-24
- **Pattern:** PAT-04 (Bounded Supervisor-Specialist Graph with Clean-Room Checker Gate)
- **Mitigates:** FM-04 (Recursive Subagent Fanout, Shared-Branch Clobbering, and Self-Grading Bias)

## Context
Complex deliverables require specialist execution and independent quality verification, but unconstrained multi-agent loops suffer from runaway token spend, git branch collisions, and self-approval bias.

## Decision
Use a deterministic TypeScript supervisor state machine that dispatches specialists with typed HandoffPackets, enforces disjoint writePaths per wave, caps recursion depth at 1, and requires a read-only Checker from a different model family before advancing past the verification gate.

## Alternatives Considered and Rejected
1. **Autonomous peer-to-peer chat group (agents talking freely until consensus):** Rejected because token cost scales superlinearly with peer count and turn depth and agents converge on polite agreement rather than catching defects.
2. **Same-model self-critique in the same context window:** Rejected because shared context primes the reviewer to repeat the author's assumptions.
3. **Shared mutable workspace without write-path locking:** Rejected because concurrent file edits or git pushes clobber sibling work.

## Consequences
- **Positive:** Predictable cost ceiling, zero concurrent write collisions, and genuine adversarial defect detection across model families.
- **Negative / Cost:** Requires explicit schema definitions for handoff packets and a second model provider credential for the Checker lane.

## Verification Command
`node --experimental-strip-types products/agentic-architecture/scripts/verify-agentic-architecture.mjs`
```

## 4. Production failure mode: `FM-04`

### Trigger
A coordinator agent spawns four parallel workers to fix bugs across a repository without disjoint write-path locks, and then runs a self-review step in its own thread to mark the release gate passed.

### Blast radius when unmitigated
Workers overwrite each other's commits or lockfiles; recursive subagent calls exhaust the monthly API budget in minutes; and the self-review step posts a false `PASS` receipt while broken files ship to customers.

### Detection telemetry
- Git non-fast-forward push rejections or overlapping file paths across concurrent worker spans.
- Run cost exceeding the single-run p95 envelope due to fanout depth `> 1`.
- Gate receipt where `maker.model_family == checker.model_family` or `checker.write_paths.length > 0`.

### Deterministic mitigation
1. Validate `assertDisjointWritePaths(wave)` before spawning any parallel worker (`kit/workflows/supervisor-maker-checker.ts`).
2. Enforce `assertMakerNotChecker(maker, checker)` in the gate runner so a same-family or write-enabled checker throws `E_CHECKER_ISOLATION`.
3. Strip the task-spawn tool from all child worker toolsets so recursion depth cannot exceed 1.

### Executable verification in this kit
- Run `node --experimental-strip-types products/agentic-architecture/scripts/verify-agentic-architecture.mjs`, which executes `kit/workflows/supervisor-maker-checker.ts` on both a valid cross-family pipeline and fault-injected collisions (overlapping `writePaths`, same-family checker, and budget overflow).

## 5. Worked implementation and red-team walkthrough

Consider an engineering organization using coding agents to ship a release candidate across a web application repository, a shared package monorepo, and an evidence ledger. In a naive swarm setup, a lead agent spawns four subagents in parallel and tells them to fix lint warnings, update dependencies, write release notes, and push to the same pull request branch. Within five minutes, Worker 2 overwrites Worker 1's lockfile commit, Worker 3 spawns three nested subagents that burn USD 90 of frontier tokens (example only — check current pricing), and Worker 4 runs a self-review prompt that declares the broken branch ready to merge.

When you apply `PAT-04` using `kit/workflows/supervisor-maker-checker.ts`, the deterministic supervisor prevents all three failure classes before a single model token is spent:

1. **Pre-dispatch write-set intersection check (`assertDisjointWritePaths`):** Every task in a parallel wave must declare its exact `readPaths` and `writePaths` arrays upfront. Before launching the wave, the supervisor builds an ownership map from file path to task ID. If two tasks in the same wave list `pnpm-lock.yaml` or `app/kit/page.tsx` in their `writePaths`, the supervisor aborts dispatch immediately with `E_WRITE_COLLISION`. Shared files are sequenced into a single writer task after the parallel wave completes.
2. **Cross-family clean-room verification (`assertMakerNotChecker`):** Once the Maker specialist finishes its commit and packages the release artifact, the supervisor constructs a verification task for the Checker. The supervisor verifies two invariants in code: `maker.providerFamily !== checker.providerFamily` (for example, a Gemini Maker paired with a Claude Checker, or vice versa) and `checker.writePaths.length === 0`. If either check fails, the supervisor throws `E_CHECKER_ISOLATION` and refuses to record a gate pass.
3. **Hard 80% budget ceiling (`E_BUDGET_EXCEEDED`):** Before executing the pipeline, the supervisor sums the estimated cost of the parallel wave, the Maker pass, and the Checker pass against `0.80 * maxBudgetUsd`. Any configuration whose cumulative spend crosses the 80% stop line is rejected before execution, keeping 20% headroom for human-directed fixes.

### Red-team verification checklist for chapter 04
- Dispatch a wave containing two tasks that share one file in `writePaths` and confirm `assertDisjointWritePaths` throws `E_WRITE_COLLISION`.
- Configure a pipeline where `maker.providerFamily` and `checker.providerFamily` are identical and confirm `assertMakerNotChecker` throws `E_CHECKER_ISOLATION`.
- Give the Checker task a non-empty `writePaths` array and confirm the supervisor rejects the configuration before running the Checker.
