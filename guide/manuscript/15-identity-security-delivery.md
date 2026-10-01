# 15. Identity, security, and secure delivery: bound authority end to end

The [trust boundary](02-four-decisions.md) decides where text meets authority. The [tool plane](06-tool-plane.md) gates each effect. This chapter widens the view to the whole system: who is acting, under whose authority, inside what isolation, and through which supply chain the behavior arrived.

Agent identity is no longer a secondary implementation detail. NIST's 2026 AI Agent Standards Initiative treats open protocols, agent authentication, identity infrastructure, secure human-agent and multi-agent interaction, and security evaluation as active standards work. [S22](../research/sources.yaml) C026 Expect the protocols to change. Design so that the identity model survives the change.

## Five identities, one chain

A production agent system has at least five distinct identities. Collapsing them is the most common authorization defect.

| Identity | Example | Must answer |
|---|---|---|
| human principal | the employee or customer who asked | Whose intent and entitlements apply? |
| workload | the service or worker process | Which deployed code is running? |
| agent | the configured agent with its tools and policy | Which behavior definition is acting? |
| session or run | one bounded execution | Which budget, approvals, and state apply? |
| tool credential | the token presented to a downstream API | What exactly may this call do? |

Delegated authority flows down that chain and may only narrow. Record the scope, audience, expiry, and revocation path of every delegation. [S09](../research/sources.yaml) [S10](../research/sources.yaml) C027 A tool credential minted for one run, one audience, and one purpose is evidence. A shared service key is an open question.

The [delegated-authority lab](../labs/delegated-authority/README.md) shows the minimum behaviors as tests: a proposal never carries authority, an actor cannot approve its own action, a replay key is bound to one action, and revocation applies even after execution.

## Threat model the whole system

OWASP's agentic list covers goal hijack, tool misuse, identity and privilege abuse, supply-chain risk, code execution, memory poisoning, insecure agent communication, cascading failure, human trust exploitation, and rogue agents. [S18](../research/sources.yaml) C019 Use it as a checklist against a data-flow diagram that includes every model call, retrieval path, tool, memory store, agent-to-agent link, and human approval.

For each flow, write the attacker's goal, the entry point, the control that stops it, and the test that proves the control. A control without a test is a hope.

## Isolate execution

Code execution, browser automation, and file manipulation are the highest-risk tools because the model chooses the arguments and the effects are broad.

Run them in an isolated sandbox with no ambient credentials, an egress allow-list, resource limits, and a disposable file system. C057 Kubernetes Agent Sandbox presents an experimental pattern for isolated, stateful agent workloads with persistent identity, suspension, resumption, and stronger runtime isolation. [S28](../research/sources.yaml) C035 Whether you use that project or another runtime, the contract is the same: the sandbox can be destroyed without losing the run's durable state, and nothing inside it can reach a system the policy did not name.

Secrets never enter model context. Tools fetch them at call time from a store the model cannot query.

## Secure delivery for behavior-bearing assets

In an AI system, behavior lives in more places than code. Prompts, policies, tool definitions, retrieval configuration, model versions, routing rules, and eval sets all change what the system does.

NIST SP 800-218A adds AI-specific secure software practices for model producers, system producers, and acquirers across the lifecycle. [S25](../research/sources.yaml) C032 Apply the same discipline to every behavior-bearing asset: version control, review, signed builds, provenance, and a release record. C058

Each production release should emit a machine-readable inventory of its models, datasets, prompts, policies, tools, and dependencies. [S26](../research/sources.yaml) [S27](../research/sources.yaml) C034 This is the AI bill of materials. It answers three incident questions quickly: what was running, where it came from, and what else uses the same component.

Third-party MCP servers, agent cards, plugins, and model weights are acquisitions. Review them as you would any dependency with network access: pin versions, verify publishers, read declared scopes, and test denied behavior before granting production credentials.

## Release evidence

Security for an agent release is ready when the team can show:

- an identity map separating human, workload, agent, run, and tool credentials, with delegation scope, audience, expiry, and revocation;
- a threat model covering every entry point in the data-flow diagram, each with a named control and a passing test;
- an abuse suite that includes injection through every untrusted source and fails closed;
- sandbox tests proving no egress beyond the allow-list and no ambient credentials;
- a signed release with an AI bill of materials for every behavior-bearing asset;
- a revocation drill: disable one agent identity and confirm in-flight runs stop safely.

A named security reviewer, not the authoring team, signs off this evidence before write authority is granted.
