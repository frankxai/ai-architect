# Appendix B. The minimum architecture record

A production AI system needs a small set of records that stay next to the code and change through review.

The record should let a new architect answer what the system is for, where authority sits, what can change, how behavior is tested, what happened in production, and how to recover.

## Required files

| Record | Minimum content |
|---|---|
| outcome brief | one-sentence outcome, governing user, non-goals, kill criterion |
| system map | boundary, external systems, state owners, data and action flow |
| four-decision review | seam, loop, trust, long-run home, verdict, evidence |
| ADRs | decision, alternatives, consequences, evidence, reversal plan |
| plane matrix | one owner, contract, evidence, signal, and rollback per plane |
| source registry | source ID, owner, version, trust, freshness, access rule |
| tool registry | schema, scope, side-effect class, policy, idempotency, owner |
| state model | states, transitions, retries, approvals, terminal reasons |
| eval bank | tasks, fixtures, trials, graders, thresholds, baselines |
| cost model | sourced prices, traced quantities, correction, failure, value |
| runbook | deploy, stop, reconcile, compensate, rollback, escalate |
| release receipt | versions, test results, known limits, verifier, approval |

Templates for the [four-decision review](../labs/four-decision-review.md), [plane ownership matrix](../labs/plane-ownership-matrix.md), [agent scorecard](../labs/eval-scorecard.md), and [ADR](../labs/architecture-decision-record.md) live with this guide.

## Evidence pointer rule

A decision without evidence is a plan. Use evidence that another reviewer can reopen:

- repository file and line or immutable commit;
- command plus observed output;
- trace or run ID with access instructions;
- eval dataset and report version;
- policy and approval receipt;
- price source and retrieval date;
- external state assertion;
- signed human decision.

Avoid links to changing dashboard views without a snapshot or query. Avoid screenshots without the underlying data. Avoid “team agreed” without the decision owner and date.

## Review meeting

Send the record before the meeting. Spend the meeting on red decisions and contradictory evidence.

Use this order:

1. confirm outcome and kill criterion;
2. inspect consequential actions and trust boundary;
3. inspect long-run state and failure recovery;
4. compare loop shape with the next simpler design;
5. inspect the provider seam and exit test;
6. check one owner and current evidence per plane;
7. decide, defer with cost and date, or stop.

Do not spend the session reading a slide deck aloud. Open the test, trace, cost row, policy event, or state transition that supports the claim.

## Release receipt

A receipt freezes what was approved:

```yaml
edition: 2026.0.1
commit: <sha>
models:
  - route: case-research
    provider: <provider>
    model: <exact-id>
policies:
  - <policy-version>
evals:
  dataset: <commit-or-hash>
  report: <artifact>
  verdict: PASS
known_limits:
  - <specific limit>
verified_by: <independent reviewer>
approved_by: <accountable human>
approved_on: <date>
```

When evidence changes, write a new receipt. Keep the old one. A correction history is part of expert authority because it shows where claims came from and how the method responds to new facts.

## Final test

Give the record to a qualified reviewer who did not join the design sessions. Ask them to re-derive the four decisions, identify every unowned plane, replay one failure case, and locate the rollback command.

If they cannot, the architecture still depends on private memory.
