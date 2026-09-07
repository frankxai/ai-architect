# 09. Observability plane: make the decision path explainable

A useful trace answers why a state changed.

Traditional service telemetry explains requests, dependencies, errors, and latency. An AI run also needs the selected model, supplied context, proposed action, policy result, tool effect, state transition, evaluation result, and cost. Without those joins, operators see a slow or wrong answer but cannot locate the first bad decision.

## The decision trace

Give every run one trace and every material step a span or event. At minimum, record:

| Surface | Required fields |
|---|---|
| run | trace ID, task class, tenant, actor class, goal version |
| model | provider, exact model, adapter, route reason, token counts |
| context | source IDs, versions, trust labels, access result, compaction |
| policy | policy version, action class, decision, reason code, approval ID |
| tool | tool version, scope, argument digest, result state, idempotency key |
| orchestration | state, step, attempt, parent, checkpoint, stop reason |
| outcome | verified end-state checks and artifact IDs |
| economics | model, tool, infrastructure, review, and correction cost |
| experience | user approval, correction, cancellation, escalation |

Record argument and content hashes when raw values contain sensitive data. A trace that leaks secrets creates a second incident.

## Adopt a convention, pin its version

OpenTelemetry moved GenAI work into a separate semantic-conventions repository covering spans, metrics, events, MCP, and provider-specific signals. [S16](../research/sources.yaml) That gives teams a shared vocabulary and export path. The conventions are changing, so record the version your instrumentation follows and keep local fields for gaps.

Do not wait for a standard to define your business outcome. A protocol can describe a tool call. Your product still has to record whether the customer received the correct refund, contract, diagnosis draft, or route plan.

## Trace decisions without exposing hidden reasoning

Operators need observable inputs, actions, decisions, and outcomes. They do not need private chain-of-thought text. Store structured reason codes, route decisions, source citations, tool arguments, policy events, and state transitions.

A useful reason record might say:

```json
{
  "route": "claims-high-risk",
  "model": "approved-reasoning-v4",
  "reason_codes": ["CONSEQUENTIAL_WRITE", "POLICY_CONFLICT"],
  "sources": ["policy:18", "claim:8842"],
  "next_state": "needs_human"
}
```

This is inspectable, testable, and safe to retain under an explicit data policy.

## Build incident queries before launch

Ask the observability owner to answer these from telemetry:

- Show denied tool calls by reason and model version.
- Find runs where a tool committed after the user cancelled.
- Compare cost per verified outcome before and after a model change.
- Find claims produced from sources older than their freshness rule.
- Find repeated idempotency keys with different argument digests.
- Show runs that ended `completed` without a verified end state.
- List approvals used after expiry or for changed arguments.
- Compare correction rate by route, language, and task class.

If the data cannot answer those questions, adding a dashboard will not help.

## Sample with intent

Keep full metadata for security events, consequential writes, policy denials, failures, and user corrections. Sample routine successful reads if volume demands it. Preserve enough linked data to reproduce an eval case after redaction.

Set retention by field class. Model inputs may contain personal or licensed data. Tool arguments may contain account identifiers. Approval events may require longer audit retention. A single retention period for the whole trace is usually wrong.

## Join online signals to release evidence

Offline evals tell you how a frozen system behaved on a bank. Online telemetry shows drift in real work. Join them by task class and version. Watch pass proxies, correction, escalation, abandonment, latency, cost, tool denial, and source freshness.

When an online signal crosses its threshold, freeze the affected route, sample traces, add a regression case, and decide whether to roll back.

## Release evidence

The observability owner should provide the telemetry schema, convention version, redaction and retention policy, trace-completeness test, incident queries, alert thresholds, sampling rules, and one reconstructed bad run.

The test is simple: an operator who did not build the feature should be able to identify the first wrong state and the safe recovery action from the recorded evidence.
