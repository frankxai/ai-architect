# 00. Reading contract

AI Architect Guide 2026 is for people who already know how to ship software and have discovered that calling a capable model does not remove architecture work. It changes where the hard work sits.

The governing reader owns a production decision. You might be the architect deciding whether a claims workflow may call customer systems. You might be the CTO choosing between a fixed process and a tool-using agent. You might run an AI platform whose teams keep asking for a new model before they can state the outcome they need. This guide gives you a shared method for those decisions.

The method has two parts. Four decisions capture choices that become expensive after data, code, controls, and operating habits grow around them. Seven planes divide the running system into owned surfaces with evidence. The decisions say what must hold. The planes say who keeps it true.

That sounds spare because it is. The field already has enough catalogs.

## What you will be able to do

After working through the guide, you should be able to sit in an architecture review and ask, in order:

1. Where does provider-specific behavior stop?
2. What is the least autonomous loop that can handle the task?
3. Where can untrusted text influence a consequential action?
4. What owns state when the initiating request ends?
5. Who owns each operating plane, and what evidence does that owner produce?

Those questions force a team to expose decisions that a framework diagram often hides. They also survive product churn. On the verification date for this edition, vendor catalogs ranged from large reasoning models with million-token windows to cheap high-volume models, plus specialized voice, image, search, and tool surfaces. The names and prices will change. The boundary questions will remain useful. [S01](../research/sources.yaml) [S02](../research/sources.yaml) [S03](../research/sources.yaml) [S04](../research/sources.yaml)

## What this guide refuses

This guide will not rank vendors as a substitute for your evals. A public benchmark cannot know your task distribution, latency target, data policy, correction cost, or value per completed job.

It will not call every model loop an agent. A fixed workflow is often the right design. An agent earns autonomy when the task path cannot be specified in advance and the value can pay for the extra uncertainty. Anthropic draws a useful line between workflows with predefined paths and agents that direct their own tool use. OpenAI documents both model-led and code-led orchestration. [S05](../research/sources.yaml) [S06](../research/sources.yaml)

It will not treat a fluent answer as proof of an external action. A booking agent can say a seat was booked while the reservation table says otherwise. Agent evaluation has to inspect the transcript and the end state. [S15](../research/sources.yaml)

It will not present this researched draft as independently verified. The initial source and manuscript checks passed. A named security reviewer, a fresh-context verifier, and Frank Riemer still have to approve a public release. The red gates are visible in the repository.

## How evidence works here

A source marker such as `S08` points to `research/sources.yaml`. A claim such as `C012` lives in `research/claims.yaml`. Facts report what a source says. Inferences state a conclusion drawn from facts. Prescriptions are Frank's rules for architecture work. They must carry a reason, a failure mode, and a test even when no standards body can prove them.

Treat dates as part of the claim. The model appendix is a snapshot verified on 2026-09-04. The EU AI Act dates reflect the European Commission page on that date. The MCP section cites the 2026-07-28 specification, and the A2A section cites version 1.0.0. Volatile claims have near-term review dates because memory is not evidence.

## The working agreement

Do not read this from front to back unless that helps you. Start with the four decisions. If one is open, use the matching lab. Then use the seven-plane matrix to expose ownership gaps. Read the plane chapters where evidence is missing.

The result should be a smaller set of stronger decisions, a test bank, a cost model, and a runbook. If all you get is a better diagram, the method has failed.
