# 16. Platform, release, reliability, and retirement: run it for its whole life

The seven planes describe one system at runtime. Production adds three questions the planes do not answer alone. Where does the system run? How does it change safely? How does it fail, recover, and eventually stop?

Current cloud architecture guidance makes data, platform, lifecycle operations, security, reliability, performance, cost, and sustainability part of the AI architect's remit. [S31](../research/sources.yaml) [S32](../research/sources.yaml) [S33](../research/sources.yaml) [S34](../research/sources.yaml) C037

## Choose the deployment mode on purpose

State the deployment mode in the architecture record. Each mode moves different risks onto your team.

| Mode | You gain | You now own |
|---|---|---|
| managed API | fastest access to frontier capability | vendor change, data residency terms, rate limits |
| self-hosted | control of weights, data path, and versions | capacity, accelerators, patching, model security |
| hybrid or sovereign | regional control with selective managed use | routing policy, two operating models, audit across both |
| edge or on-device | latency, offline use, local data | model size limits, fleet update, device trust |
| realtime or multimodal | voice, video, and live interaction | tight latency budgets, streaming failure, media provenance |

A reference architecture should state its deployment mode, platform boundary, data boundary, identity model, recovery model, and retirement path. [S22](../research/sources.yaml) [S24](../research/sources.yaml) C044

## Treat the platform as its own concern

AI gateways, model-aware routing, capacity allocation, and agent sandboxing form a platform concern separate from application orchestration. [S28](../research/sources.yaml) [S29](../research/sources.yaml) [S30](../research/sources.yaml) C036

A platform team owns the shared seams: the gateway that enforces quotas and tenant limits, the router that maps task classes to approved models, caches with explicit invalidation, batch and realtime paths, and the sandbox runtime. Product teams own their outcomes, tools, and evals. When one team owns both, write the boundary down anyway, because it will split later.

Plan capacity in verified units of work, not tokens. Queueing delay and retries change the real cost and latency of a run. Measure cost per verified unit, forecast the effect of efficiency changes, and connect the unit to business value. [S36](../research/sources.yaml) C038

## Release every behavior change

Every behavior-bearing change ships through the same path: compare against frozen cases, release to a small canary, watch outcome and safety signals, then widen or roll back. C059 That includes a prompt edit, a policy update, a new retrieval source, and a provider's silent model refresh behind an alias.

The release packet holds the diff, eval results against the previous version, the AI bill of materials, the canary result, and the rollback command. A rollback that has never been run is a guess. Run it in staging before the first production release and after any change to state shape.

Migrations need special care in long-running systems. A run that started under policy version 7 may resume under version 8. Decide per field whether in-flight runs finish on the old version, migrate, or stop for review, and record which happened.

## Design failure and recovery

Set service objectives for the outcomes users notice: completion rate, time to verified result, and correction rate. Derive error budgets from them and spend those budgets on deliberate change.

Design degradation per dependency. When a model times out, a tool returns an error, or retrieval is stale, the system falls back to a narrower safe mode such as a simpler route, read-only behavior, or handoff to a person, rather than a confident guess. C061 Apply backpressure at the gateway before queues grow beyond the approval capacity of the humans downstream.

Run game days. Kill a worker after a side effect and before its checkpoint. Expire a credential mid-run. Remove the primary model. Each exercise produces a receipt: what was injected, what the system did, what the operator saw, and what changed afterward.

Incident command for AI systems adds two duties to familiar practice: freeze the behavior-bearing assets that were live, and preserve the traces needed to reproduce the bad run against a frozen case.

## Retire on purpose

Retirement is a designed state, not an absence of traffic. Disable access, revoke agent and tool identities, export records the business must keep, delete data according to policy, including derived copies and embeddings, preserve audit evidence, and notify owners and users. C060

Write the retirement path into the first architecture record. A system that cannot be retired cleanly has an unbounded liability.

## Release evidence

Platform and lifecycle readiness means the team can show:

- a deployment decision record naming mode, platform boundary, data boundary, identity model, recovery model, and retirement path;
- a capacity model in verified units with quota and backpressure rules;
- a release packet for the current version, including a rollback that has been executed;
- service objectives with owners and alert thresholds;
- at least one game-day receipt covering a side effect, a credential failure, and a model outage;
- a retirement runbook with a dry-run receipt.
