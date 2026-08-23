# Conversational service

## Problem it fits

A user holds a multi-turn conversation with the system to get something done
— book, cancel, look up, update, troubleshoot — within a bounded set of
tasks, with escalation to a human when the conversation goes outside that
set. No single request/response pair captures the interaction; the whole
conversation is the unit of work. The failure that defines this shape is not
one wrong reply — it is the conversation losing track of what it already
knows or already committed to across turns, or failing to hand off to a
human when the task is genuinely out of scope, leaving the user stuck in a
loop the system cannot complete.

This shape is not retrieval-grounded-answering: memory of the conversation
itself is load-bearing here, not just memory of a corpus. It is not
decision-support: there is no single recommendation moment for a human to
accept or override — the conversation itself is the interaction, and the
system may take actions inside it.

## The seven planes for this shape

| plane | boundary for this shape |
|---|---|
| `experience` | turn-by-turn state and the escalation moment are both first-class — a user must always know when they have been handed off to a human, not left assuming the system is still trying |
| `intelligence` | dialogue management plus task-completion logic plus tool calls; the model needs live conversation state, not just the current message, to do its job |
| `orchestration` | a loop bounded by turns and task scope, not a fixed pipeline — the loop needs an explicit exit: task complete, escalate, or session timeout |
| `runtime` | session-based; state persists across turns within a session and needs its own home even though generation itself is request/response per turn |
| `integration` | whatever systems the tasks touch — booking, account lookup, ticketing — plus the human-handoff channel |
| `reliability` | graded on task-completion rate and conversation-level correctness, not per-turn accuracy alone — every turn can be locally correct and the task still fail |
| `operations` | session and cross-session memory storage, retention, and the handoff queue to humans all need an owner |

## The four decisions as they usually land

| decision | typical verdict | why | evidence to check |
|---|---|---|---|
| `model` (model call seam) | tends `MADE` | one seam per turn, though tool-calling turns may add a second call type through the same gateway | grep for provider SDK imports; confirm tool-calling still routes through the same seam as plain generation |
| `loop` (orchestration shape) | tends `OPEN` more than other shapes | the loop needs an explicit bound — max turns, task-complete signal, timeout — and that bound is often unspecified in early builds | find the code path that ends a conversation; if none exists, the loop has no exit and the decision cannot be `MADE` |
| `trust` (trust boundary) | tends `OPEN` | user input across many turns is the largest attack surface of any shape here, and anything a tool returns mid-conversation becomes untrusted data re-entering the model | trace one tool response from its return value to the line where it is labelled as data, not a new instruction, in the next turn's prompt |
| `run` (long-run home) | tends `OPEN` | session state needs a durable home across turns; a stateless request/response runtime loses the conversation on every restart | confirm conversation state survives a process restart mid-session, not just within one request |

## Discovery questions

1. What is the bounded set of tasks this conversation should complete, and
   what is explicitly out of scope?
   Purpose: sets non-goals in `00-frame.md` and defines the escalation
   trigger — a request outside this set is the escalation condition, not a
   failure to work around.
2. What should trigger escalation to a human, and what is the handoff
   channel?
   Purpose: feeds `SOP.md`'s human-gate list and the experience plane's
   handoff interface.
3. How long does a typical conversation run, and how many turns before a
   task is complete or abandoned?
   Purpose: sets the loop's turn bound on the orchestration plane.
4. What does the system need to remember across turns — the current task's
   state, prior sessions, or nothing beyond the open conversation?
   Purpose: determines whether session memory alone suffices or a durable
   cross-session memory store is needed.
5. What tools or systems does the conversation need to call to complete a
   task — booking, lookup, update?
   Purpose: names the integration plane's surface and which of those calls
   are irreversible enough to need a human confirmation step.
6. Who currently handles these conversations, and what is their average
   handle time?
   Purpose: baseline for `04-roi.md`.
7. What happens if the user changes their mind mid-task or contradicts
   something said several turns earlier?
   Purpose: tests whether the dialogue state model handles correction, not
   just linear progress.
8. Is there a compliance or brand requirement on what the system can say —
   disclosures, scripted language, forbidden claims?
   Purpose: feeds `05-trust-boundary.md` and the eval suite's must-not
   cases.
9. What identity or authentication does the system have about the user
   during the conversation, and when does that change mid-session?
   Purpose: sets the trust boundary for actions gated on identity, such as
   account changes.
10. What should happen if the conversation is abandoned partway through a
    task that already has a side effect started?
    Purpose: names the rollback or cleanup requirement for
    `07-runbook.md`.
11. Can a tool's response contain content that looks like a new user
    instruction — text pulled from a ticket, a booking confirmation, a
    lookup result?
    Purpose: feeds the trust boundary; tool output re-entering the
    conversation is a second injection surface beyond the user's own
    messages.
12. What language(s) and channels — chat widget, SMS, voice — does this
    conversation need to run across?
    Purpose: affects the experience plane's rendering and whether tone or
    latency requirements differ by channel.

## Bill of materials (capability roles)

| role | what it does | why this shape needs it |
|---|---|---|
| model gateway | the single seam for per-turn generation and tool-calling | keeps `model` a `MADE` decision as the conversation grows more capable |
| session state store | durable memory of the current conversation across turns | what makes the loop resumable across a process restart, per the `run` decision |
| dialogue and task manager | tracks which bounded task is active, what has been collected, what is still needed | the mechanism that prevents the shape's defining failure of losing conversational state |
| tool and action connectors | the systems the conversation calls to complete tasks — booking, lookup, update | the integration surface named in discovery question 5 |
| escalation router | detects the escalation trigger and routes the conversation to the human channel | the mechanism behind the handoff promise in the experience plane |
| identity and auth layer | establishes and tracks what the system knows about who it is talking to | gates actions that depend on identity, such as an account change |
| guardrail and content filter | enforces compliance and brand constraints on what the system can say | the layer that turns discovery question 8's requirement into an enforced behavior |
| evaluation harness | grades task-completion and conversation-level correctness, not just per-turn accuracy | the reliability-plane requirement that a whole conversation, not one reply, is the unit graded |
| observability trace store | full conversation transcript including tool calls | lets someone debug why a conversation failed a task by seeing every turn and every tool response |

## Failure modes

- The conversation loses track of something the user already said or agreed
  to several turns back, and repeats a question or contradicts an earlier
  commitment.
- The loop has no explicit exit condition, so a stuck conversation keeps
  generating turns or calling tools indefinitely instead of escalating.
- A tool's response contains text that reads like a new instruction, and the
  model treats it as if the user had said it.
- Escalation never triggers because the trigger condition is defined too
  narrowly, so the system keeps attempting a task it cannot complete instead
  of handing off.
- The system takes an irreversible action — a booking, a cancellation —
  mid-conversation without an explicit confirmation step, based on an
  ambiguous user statement.
- Session memory persists across users on a shared channel, such as a kiosk
  or shared device, leaking one user's context into another's conversation.

## Eval cases to include

- Golden multi-turn cases covering the bounded task set end to end,
  including at least one with a mid-conversation correction.
- At least one refusal or escalation case where the request falls outside
  the bounded task set and the correct behavior is handoff, not a
  best-effort attempt.
- At least one injection case where a tool's returned content contains
  instruction-like text, checking the system treats it as data.
- A case testing an irreversible action, verifying a confirmation step is
  required before the action executes.
- A case testing abandonment — the conversation stops mid-task with a side
  effect already started — checking the cleanup or rollback behavior.
