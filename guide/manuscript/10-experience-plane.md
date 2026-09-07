# 10. Experience plane: make control visible to people

The experience plane is part of the safety system.

Users set intent, supply context, approve actions, notice wrong assumptions, and recover from failure. Operators inspect traces, pause routes, resolve stuck runs, and issue corrections. If the interface hides those duties, the architecture has hidden them too.

## Set the contract before the run

Tell the user what the system will do, which data or tools it may use, what requires approval, and what it cannot guarantee. Match the message to the task risk.

A research assistant can say that it will search named sources and cite material claims. A payment agent must show account, amount, currency, payee, timing, policy, and the point at which money will move. A coding agent must state whether it can edit, run code, access a network, or open a pull request.

Avoid personality claims as a substitute for behavior. “I am your trusted expert” gives no useful assurance. A source list, action preview, policy result, and undo window do.

## Show progress as state

Long work needs more than a spinner. Show meaningful states that match the orchestration machine:

- collecting evidence;
- waiting for source access;
- comparing conflicting records;
- preparing an action preview;
- awaiting approval;
- executing with an operation ID;
- verifying the end state;
- blocked, cancelled, or recovered.

The user should be able to tell whether the system is thinking, waiting, acting, or checking. Those states carry different risk.

## Bind approval to an action

An approval surface must display the exact target and material effect. It should also show the evidence and uncertainty that shaped the proposal.

For a consequential action, include:

1. action and target;
2. material parameters;
3. data sources and policy version;
4. known uncertainty or conflict;
5. whether the action is reversible;
6. expiry and what happens next.

Approval is invalid if the action changes after display. Bind it to a digest and ask again after any material change.

MCP calls for explicit user consent and understanding before tools run. [S08](../research/sources.yaml) A2A 1.0.0 supports a task state that requests authorization during long-running work. [S10](../research/sources.yaml) Product interfaces still have to make that consent specific and usable.

## Display uncertainty where it changes a decision

A generic confidence percentage often adds theater. Show the underlying reason:

- no authoritative source was found;
- two current policies conflict;
- the record is older than the allowed age;
- the proposed tool requires a broader scope;
- the model route fell back after an error;
- the system could not confirm whether the external action completed.

Pair the reason with a next step: fetch another source, narrow the task, ask an owner, request a specific scope, retry through reconciliation, or stop.

## Correction is a first-class path

Let a user correct facts, scope, target, and output. Record what changed without turning every correction into permanent memory. A correction should be able to create a review item or regression case when it reveals a system fault.

Separate three events:

- **edit:** the user changes an artifact;
- **feedback:** the user reports that behavior was poor;
- **incident:** the system changed or exposed state outside its allowed boundary.

Each event has a different owner and response time.

## Design operator experience

Operators need a run list by state and risk, a trace view, source and policy versions, pending approvals, budget use, tool effects, idempotency records, retry controls, cancellation, reconciliation, and a safe replay path.

Do not make an operator read hidden model reasoning. Give them the structured decision record and evidence. The runbook should say what can be retried, what must be reconciled, what requires compensation, and who can reopen a route.

## Test with failure branches

Every user flow needs a failure branch and a human step. Test access denied, source conflict, budget exhaustion, policy denial, lost tool response, stale approval, model refusal, cancellation during work, and verified end-state failure.

Measure correction time, approval comprehension, abandoned runs, repeated attempts, escalation quality, and recovery time. A fast agent that creates slow human cleanup has a poor experience and a poor cost model.

## Release evidence

The experience owner should provide intent copy, progress states, action previews, approval tests, uncertainty messages, correction paths, operator flows, accessibility review, and observed behavior metrics.

The interface should let a person answer four questions at any moment: what is happening, what evidence supports it, what can happen next, and how do I stop it?
