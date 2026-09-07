# 06. Tool plane: turn intent into controlled effect

The tool plane is where generated text gains consequences.

A tool contract has two audiences. Code needs a strict schema. The model needs a clear description of when the tool applies, what it cannot do, and what a result means. The security system needs identity, purpose, scope, policy, and an audit event. Treat all three as one product surface.

## One tool, one clear job

Tool overlap creates model confusion. Anthropic reports that large, ambiguous tool sets are a common failure source and recommends small tool sets with clear, self-contained purposes. [S07](../research/sources.yaml)

Prefer `get_invoice`, `propose_refund`, and `commit_refund` over a generic `manage_account` tool. Separate read, proposal, and commit operations. The split gives policy and experience layers a place to inspect the pending action.

Each tool definition should include:

- a precise purpose and non-purpose;
- typed arguments with bounds;
- authenticated actor and tenant from trusted runtime state;
- side-effect class;
- required scope and policy;
- idempotency behavior;
- timeout and retry rules;
- result states, including partial and unknown;
- redaction rules;
- owner and runbook.

Never accept user or model text for a tenant ID, actor ID, or permission when the runtime already knows it.

## Protocol connection does not grant product authority

MCP standardizes how a host connects clients to servers that expose resources, prompts, and tools. The 2026-07-28 specification also adds negotiated extensions for long-running tasks, skills, and interactive apps. [S08](../research/sources.yaml)

Use MCP to reduce custom connection work, then keep local policy. The MCP specification says tool descriptions should be treated as untrusted unless they come from a trusted server, and it calls for user consent before tool invocation. [S08](../research/sources.yaml) A registry entry or signed package can raise confidence in origin. It does not prove that the tool is appropriate for this user or task.

For HTTP authorization, MCP defines an OAuth 2.1 profile with protected resource metadata, resource indicators, issuer validation, audience binding, and step-up scopes. [S09](../research/sources.yaml) Apply the principle beyond MCP: issue narrow, short-lived credentials for one resource and purpose. Do not pass a broad backend token into the model process.

## Gate irreversible action

Classify tools by effect:

| Class | Example | Default control |
|---|---|---|
| read | fetch a public document | access check and trace |
| private read | fetch a customer record | identity, purpose, field filter |
| reversible write | save a draft | preview, undo, idempotency |
| consequential write | send, pay, publish, grant | explicit policy and human approval |
| destructive | delete, revoke, terminate | strong confirmation, delay or dual control |
| code or computer control | shell, browser, desktop | sandbox, allowlist, resource cap |

Human approval must bind to a concrete action. Show the target, material fields, effect, source, uncertainty, and expiry. “Allow agent to continue?” is too vague.

The approval token should be single-use and bound to the action digest. If arguments change, ask again.

## Make retries safe

A timeout does not tell you whether the remote action happened. Design for an `unknown` result. Use an idempotency key derived from the business action, store the request and response, query the remote state, then decide whether to retry or compensate.

Test the ugly point: the remote system commits, the network response is lost, and the worker restarts. The second attempt must return the first outcome or reconcile state without repeating the effect.

A2A 1.0.0 treats cancellation as idempotent and lets message handlers use message IDs to detect duplicates. Its webhook guidance calls for authenticity checks, retry backoff, SSRF defenses, idempotent processing, rate limits, HTTPS, and single-purpose tokens. [S10](../research/sources.yaml) Those details are useful even when A2A is absent.

## Treat tool results as typed states

Do not collapse every result into prose. Return states such as:

```json
{
  "status": "committed",
  "operation_id": "refund_01J...",
  "idempotency_key": "tenant:claim:action",
  "policy_version": "refund-policy-18",
  "effect": {"currency": "EUR", "amount": 42},
  "observed_at": "2026-09-04T10:15:00Z"
}
```

Other states might be `denied`, `needs_approval`, `retryable`, `unknown`, and `compensated`. Orchestration can make a sound next-step decision only when result semantics are explicit.

## Test the caller, contract, policy, and effect

A tool test suite needs four layers:

1. schema and boundary tests;
2. authorization and policy tests;
3. adversarial model-caller tests;
4. end-state and replay tests.

Include indirect injection from every content source, argument smuggling, tenant swapping, scope escalation, tool-name confusion, malformed output, slow response, duplicate delivery, partial failure, and approval expiry.

## Release evidence

The tool-plane owner should provide the registry, side-effect class, schema, scope, policy version, threat model, injection cases, idempotency proof, approval flow, redaction rule, and operator command for each production tool.

A successful function call is not the standard. The standard is a permitted, correct, single effect with a trace and a recovery path.
