---
name: architecture-patterns
description: Pick the shape a system's core loop is actually built from, then load the matching reference for its planes, decisions, discovery questions, bill of materials, failure modes, and eval cases. Use during frame and discover to name the shape before any design work starts, and again at decide to check the four decisions against how this shape usually resolves them.
---

# Architecture patterns

A "pattern" here is not a tech-stack recommendation. It is a shape a core loop
takes — the thing that determines which discovery questions matter, which
decisions are likely already made by the shape itself, and which failure modes
show up in production. Naming the shape early saves the frame and discover
stages from asking questions that do not apply, and saves decide from treating
an obvious default as an open decision.

This skill holds six shapes. Each has one reference file at
`references/<shape>.md`. Load the reference for the chosen shape; do not load
more than one unless the goal genuinely spans two loops (say so explicitly if
it does — most goals that feel like two shapes are one shape with an
under-specified boundary).

## The six shapes

| shape | fits when the core loop is |
|---|---|
| `retrieval-grounded-answering` | answering questions against a corpus the system does not own the truth of, with citations back to source |
| `decision-support` | producing a recommendation plus rationale for a human who keeps the authority to accept or override it |
| `document-extraction` | turning unstructured documents into structured, validated records at volume |
| `conversational-service` | holding a multi-turn conversation that helps a user complete a bounded set of tasks, with escalation to a human |
| `process-monitoring` | watching a stream of events over time and raising an alert or triggering a workflow when something drifts |
| `regulatory-checking` | checking a piece of work against a body of external rules and producing an audit trail of the check |

## How to pick a shape

Ask these in order; stop at the first "yes."

1. Is the system checking work against rules it did not write, and its output
   is a pass/fail or flag against those rules? → `regulatory-checking`
2. Is the system watching a stream over time rather than responding to one
   request? → `process-monitoring`
3. Does a human hold a multi-turn conversation with it to get something done,
   with no single request/response pair capturing the interaction? →
   `conversational-service`
4. Is the primary output a structured record extracted from an unstructured
   document, not prose? → `document-extraction`
5. Does the output carry an explicit recommendation and a human decides
   whether to act on it? → `decision-support`
6. Otherwise, if the loop's job is answering a question from a corpus with
   citations → `retrieval-grounded-answering`

If the goal fails all six, the shape is not in this library yet — say so in
`00-frame.md` rather than forcing a fit; a wrong shape produces the wrong
discovery questions for the rest of the lifecycle.

## What each reference file gives you

Every `references/<shape>.md` is one file organized as six sections, mapped
to what the ADLC stages consume:

1. **Problem it fits** — one paragraph, feeds `00-frame.md`'s outcome
   sentence and non-goals.
2. **The seven planes for this shape** — `experience`, `observability`,
   `evaluation`, `orchestration`, `tools`, `context`, `model`; each with its
   owns line and where its boundary typically sits for this shape. Feeds
   `SYSTEM.md`'s plane ownership table.
3. **The four decisions as they usually land** — `model`, `loop`, `trust`,
   `run`; each with the verdict this shape tends toward, why, and the
   evidence to check before trusting the tendency. Feeds `decide` — a
   tendency is a starting hypothesis, not a verdict; the gate still requires
   evidence before marking a decision `MADE`.
4. **Discovery questions** — 8 to 12 questions, each with a `Purpose:` line
   explaining what answer changes the design. Feeds `01-discovery.md`;
   `discovery-analyst` should prefer these over generic questions once the
   shape is named, because a generic question bank does not know which
   answers are load-bearing for this shape.
5. **Bill of materials** — capability roles this shape typically needs
   (model gateway, vector store, durable runtime, object store, and similar
   nouns), never a vendor name or a price. Feeds `04-roi.md` and
   `prices.json` — the economics-analyst still has to price each role for
   the customer's actual vendor choice; this list only says what roles
   exist.
6. **Failure modes** and **eval cases to include** — feeds
   `05-trust-boundary.md` and `06-evals/cases.jsonl`. The eval-engineer
   should treat the listed case categories as a floor, not a ceiling — the
   ten-case minimum in `gate.evals` is the gate, not the target.

## Planes are the same seven everywhere; boundaries move

The seven plane names — `experience`, `observability`, `evaluation`,
`orchestration`, `tools` (tool surface), `context` (context and retrieval),
`model` (model access) — do not change between shapes; what changes is
where the boundary sits and who owns it. A `process-monitoring` system has
almost no `experience` plane most of the time (nobody is watching) and a
very active one at alert time. A `conversational-service` system has an
`experience` plane doing work on every turn. Read the shape's plane table
for the boundary, not just the name.

## Rewriting rule

Reference files describe tendencies, drawn from how this shape's loop
usually behaves — they are not a customer's actual answers. Never paste a
reference file's prose into a customer's `docs/architecture/` output. Use it
to decide which questions to ask and what to check for; the customer's own
evidence fills in the artifact.
