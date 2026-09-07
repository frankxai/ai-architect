# Seven-plane ownership matrix

A plane without one accountable owner is an outage waiting for a meeting.

| Plane | Accountable owner | Change budget | Release evidence | Runtime signal | Rollback trigger |
|---|---|---|---|---|---|
| model |  |  | capability and regression evals | model ID, tokens, refusal, latency |  |
| context |  |  | provenance and retrieval tests | source IDs, age, access result |  |
| tools |  |  | schema, auth, sandbox, side-effect tests | tool, scope, arguments, result |  |
| orchestration |  |  | state-machine and failure tests | step, attempt, route, checkpoint |  |
| evaluation |  |  | dataset, grader calibration, thresholds | online quality and drift |  |
| observability |  |  | trace completeness and redaction tests | trace, cost, policy event |  |
| experience |  |  | user-flow and approval tests | abandon, correction, escalation |  |

## Plane contract

For each plane, record:

- inputs and outputs;
- state owned and state borrowed;
- allowed failure modes;
- service target;
- budget;
- security boundary;
- evidence produced;
- rollback owner.
