# 07. Orchestration plane: choose the smallest useful loop

Orchestration decides what runs next, what state survives, how much work is allowed, and when the system stops.

The model can take part in that decision. It should not inherit unlimited control simply because the task contains uncertainty.

## Start with four shapes

### Fixed workflow

Code chooses the path. Models fill bounded steps such as classification, extraction, drafting, or comparison.

Use it when the business process and exceptions can be enumerated. It gives steady latency, clear ownership, and direct tests. Its weakness is brittle coverage when real tasks take paths the designer did not expect.

### Single agent loop

One model sees a goal, context, tools, and stop rules. It chooses actions until it returns an outcome or hits a limit.

Use it when the path is open but one context can hold the task. The loop needs step, token, time, and tool budgets. It also needs explicit stop reasons such as `completed`, `blocked`, `needs_human`, `budget_exhausted`, and `policy_denied`.

### Parallel workers

A coordinator splits independent work, then joins results. Research, broad search, independent scoring, and bulk classification can fit.

Parallel work buys breadth by spending more. Anthropic's research report measured about fifteen times the chat token use for its multi-agent system and notes that tasks with shared context or dense dependencies can be poor fits. [S21](../research/sources.yaml)

### Sequential specialists

One specialist hands a typed artifact to the next. Examples include research to claim extraction to drafting to verification, or triage to a domain agent.

Use it when phase boundaries are real and each phase benefits from a focused context. Each handoff needs an artifact contract. Passing a conversational summary alone invites information loss.

## Let code own invariants

OpenAI documents both model-led and code-led orchestration. Code-led flow gives more predictable speed, cost, and performance, while model-led flow handles open tasks that need planning and tool choice. [S06](../research/sources.yaml)

Keep hard invariants in code or policy:

- allowed transitions;
- budget ceilings;
- required approvals;
- tool and scope limits;
- idempotency;
- terminal states;
- tenant isolation;
- retention and redaction.

Let the model propose plans, choose among allowed actions, recover from descriptive tool errors, or ask for missing information. The runtime validates every proposal.

## Use protocols at the right boundary

MCP fits a host-to-capability boundary. A server exposes resources, prompts, and tools to a model application. [S08](../research/sources.yaml)

A2A fits work between independent agent services. Version 1.0.0 supports capability discovery through Agent Cards, messages, tasks, artifacts, streaming, push updates, and long-running work without sharing internal state or tools. Its own specification describes MCP and A2A as complementary: an A2A server agent may call MCP tools to complete the delegated task. [S10](../research/sources.yaml)

Do not add A2A for agents inside one process that already share code, identity, state, and deployment. An internal function or queue may be clearer. Use A2A when independent ownership, vendor separation, remote discovery, or cross-organization operation makes a protocol boundary valuable.

## Give long work a durable home

A model transcript is a record of conversation. It is a weak state machine.

Store orchestration state explicitly:

```yaml
run_id: run_01J...
goal_version: 7
state: awaiting_approval
current_step: commit_refund
attempt: 1
budget:
  tokens_remaining: 48000
  tool_calls_remaining: 6
policy_version: refund-policy-18
pending_action_digest: sha256:...
idempotency_key: tenant:claim:refund
checkpoint: s3://.../checkpoint-04.json
stop_reason: null
```

Durable systems supply patterns for retries, long-running activity, callbacks, approval waits, child work, and fresh histories. [S11](../research/sources.yaml) The architectural prescription is broader than any product: if a run can outlive the request, give it an owned state machine, durable store, idempotency key, retry rule, and recovery path.

Anthropic's long-running agent experiments found that compaction alone did not preserve enough continuity. Better results came from incremental progress, a clean state at each handoff, progress records, version history, and explicit end-to-end tests. [S12](../research/sources.yaml)

## Budget the path

Set an effort envelope before the run starts:

- maximum wall time;
- maximum model input and output tokens;
- maximum tool calls and retries;
- maximum concurrent workers;
- maximum spend;
- maximum unreviewed side-effect class.

The coordinator may spend within the envelope. It cannot rewrite the envelope. A budget increase is a policy event and may require a human.

Scale effort to task value and uncertainty. A lookup should not start ten workers. A high-value research task may justify them. Anthropic reports that explicit effort rules helped its coordinator avoid spending too much on simple queries. [S21](../research/sources.yaml)

## Design failure as a state

For every step, define timeout, retry, duplicate behavior, compensation, operator action, and user message. Include `unknown` when the remote effect cannot be confirmed.

Test these events:

1. model call times out after consuming budget;
2. tool commits but response is lost;
3. worker dies before checkpoint;
4. approval arrives twice or after expiry;
5. child worker returns conflicting evidence;
6. policy changes while a run is paused;
7. cancellation arrives during a side effect;
8. the model declares success before the end state exists.

## Release evidence

The orchestration owner should provide a state diagram, transition table, budget policy, checkpoint format, idempotency test, failure injection report, cancellation behavior, replay command, and comparison with the next simpler loop shape.

Autonomy earns its place when the eval bank shows better verified outcomes at an acceptable total cost. Until then, extra loops are extra liability.
