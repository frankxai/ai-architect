# Four-decision architecture review

Use this before discussing frameworks, model benchmarks, or cloud services.

## Review header

- System:
- Business outcome:
- Named operator:
- Decision date:
- Review date:
- Kill criterion:

## Decision 1: model-provider seam

**Question:** Where does provider-specific behavior stop?

- Owned interface:
- Provider features permitted above the seam:
- Provider features isolated below the seam:
- Contract tests:
- Fallback behavior:
- Migration proof:
- Verdict: `MADE | OPEN`
- Evidence pointer:
- If open, deferral cost and date:

## Decision 2: loop shape

**Question:** What is the least autonomous control loop that can handle the task?

- Chosen shape: `fixed workflow | single loop | parallel workers | sequential specialists`
- Why a simpler shape fails:
- Stop condition:
- Step and token budget:
- Concurrency limit:
- Human interrupt:
- Verdict: `MADE | OPEN`
- Evidence pointer:
- If open, deferral cost and date:

## Decision 3: trust boundary

**Question:** Where can untrusted text influence an irreversible action?

- Untrusted inputs:
- Retrieval provenance record:
- Allowed tools and scopes:
- Irreversible actions:
- Approval points:
- Credential boundary:
- Injection and exfiltration tests:
- Verdict: `MADE | OPEN`
- Evidence pointer:
- If open, deferral cost and date:

## Decision 4: long-run home

**Question:** What owns state after the initiating request ends?

- State machine owner:
- Durable store:
- Idempotency key:
- Retry policy:
- Resume point:
- Cancellation path:
- Human approval wait:
- Recovery time target:
- Verdict: `MADE | OPEN`
- Evidence pointer:
- If open, deferral cost and date:

## Fix order

When several decisions are open, fix the highest blast-radius decision first: trust, long-run home, loop, then model seam.
