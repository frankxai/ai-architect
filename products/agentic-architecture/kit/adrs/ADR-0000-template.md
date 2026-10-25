# ADR-0000: Decision record template

- **Status:** Proposed | Accepted | Superseded
- **Date:** YYYY-MM-DD
- **Pattern:** PAT-XX
- **Mitigates:** FM-XX

## Context
State the architectural forces, operational constraints, and failure modes that require a decision.

## Decision
State the concrete architectural boundary or mechanism chosen.

## Alternatives considered and rejected
1. **First concrete alternative:** Rejected because of specific security, reliability, or unit-cost failure mode.
2. **Second concrete alternative:** Rejected because of specific operational or coupling trade-off.
3. **Third concrete alternative:** Rejected because of specific verification or latency cost.

## Consequences
- **Positive:** Specific measurable risk reduction or operational guarantee gained.
- **Negative:** Specific engineering, latency, or maintenance cost introduced.
- **Neutral:** Shift in where state, policy, or telemetry is maintained.

## Verification command
`node --experimental-strip-types products/agentic-architecture/scripts/verify-agentic-architecture.mjs`
