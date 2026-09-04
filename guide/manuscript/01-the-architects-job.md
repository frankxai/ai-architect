# 01. The architect's job

An AI architect bounds uncertainty so a useful system can run inside a known business, security, and operating envelope.

That definition matters because a language model introduces variation into a discipline built on repeatability. The same input may produce a different output. A tool call may be correct, unnecessary, or dangerous. Retrieved text can contain facts, stale instructions, malicious instructions, or all three. A run may last longer than the request that started it. A vendor may change a model, price, context limit, or product surface after the design review.

The architect cannot remove all of that variation. The job is to decide where variation is allowed, where code takes control, where a human must decide, and what evidence proves the boundary held.

## Architecture starts with consequences

Begin with the state that can change outside the model. A draft paragraph is reversible. Sending a payment, deleting a record, changing a price, filing a claim, granting access, or publishing advice can create a cost that survives the conversation.

This yields the first working rule:

> The required architecture grows with the cost of a wrong state change, not with the apparent intelligence of the model.

A fast model with one read-only search tool may need a small control surface. A cheaper model that can approve refunds across ten countries may need identity checks, policy versioning, deterministic limits, approval steps, idempotency, a full trace, and daily evaluation. Model prestige tells you little about that gap.

## Five uncertainties

A production design must bound at least five forms of uncertainty.

| Uncertainty | Question | Control evidence |
|---|---|---|
| capability | Can the selected model do this task on our cases? | capability and regression evals |
| information | Did the run receive the right facts at the right time? | source IDs, freshness, access result |
| action | Could the run call the right tool with the wrong authority? | tool contract, scope, policy decision |
| path | Can the loop wander, repeat, or delegate without limit? | state machine, step budget, stop reason |
| change | What happens when a model, policy, source, or tool changes? | version record, canary, rollback receipt |

These uncertainties move at different speeds. That is why a single “AI layer” on an enterprise diagram is weak. It groups together things with different owners, failure modes, and clocks.

## The decision half-life

Every architectural choice has a half-life: the period during which the evidence behind it stays useful.

A trust boundary may remain sound for years if its data classes and action classes stay stable. A model ranking can decay in weeks. A legal date can change through a new act or regulator decision. An eval dataset can age quietly as customers change how they ask for help.

Record the half-life as a review date. High-volatility facts get short review windows. Stable prescriptions get longer ones, but they still need counterexamples. This practice changes review meetings. Instead of asking whether an architecture is “done,” the team asks which evidence expires next.

## Control follows the risk

A useful control stack has four levels:

1. **Contract:** typed inputs, outputs, tools, scopes, and states.
2. **Policy:** rules that decide what may happen for this user, task, data class, and moment.
3. **Evidence:** traces, outcomes, test results, cost records, and approvals.
4. **Recovery:** cancellation, retry, compensation, rollback, and a named operator.

The model sits inside this stack. It does not own the stack.

MCP makes this distinction visible. Its specification exposes resources, prompts, and tools through a host-client-server design, yet it also warns that tools can open data and code-execution paths. It calls for explicit user control and says tool descriptions should be treated as untrusted unless the server is trusted. [S08](../research/sources.yaml)

A2A makes a second distinction visible. It supports work between independent agent systems through discovery, messages, tasks, artifacts, streams, and asynchronous operations. The participating agents need not expose their internal state or tools. That is an interoperability boundary, not a reason to remove local policy checks. [S10](../research/sources.yaml)

## Architecture as an evidence system

A diagram is useful when it tells an operator where to look after a bad run. Can they identify the exact model, context sources, tool arguments, policy result, state transition, outcome, cost, and approval? Can they reproduce the failure against a frozen case? Can they stop a replay from repeating the side effect?

If the answer is no, the diagram describes components while the architecture remains unproven.

This is the standard used throughout the guide. Every major decision ends in an artifact. Every artifact has an owner. Every owner produces evidence. Every consequential action has a recovery path.

That is how an AI system becomes operable rather than merely impressive.
