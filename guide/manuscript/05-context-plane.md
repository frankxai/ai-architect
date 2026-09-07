# 05. Context plane: control what the model can know

The context plane decides which information enters a run, under which authority, for how long, and with what proof.

Context is often treated as a token-packing problem. Production failures make it a data and policy problem. The model may receive the wrong policy version, a record the user cannot access, a poisoned webpage, an old memory, too many similar tools, or a transcript that hides the one fact needed for the next step.

The plane owner must know the answer to a plain question: why was this item in the context?

## Build a context manifest

For each run, record a manifest with:

- system and policy versions;
- example-set version;
- user identity and purpose;
- source IDs and retrieval time;
- source owner and trust class;
- access-control decision;
- document or record version;
- memory items read or written;
- truncation or compaction events;
- final token counts.

This manifest is evidence for a run. It should join the trace without putting secrets into telemetry.

## Put stable rules up front, fetch changing facts late

Keep stable, high-authority rules close to the system boundary. Load changing facts when the task needs them. Anthropic describes this as tight context plus just-in-time retrieval, sometimes mixed with a small set of files or instructions loaded at the start. [S07](../research/sources.yaml)

The split lowers two risks. First, stale facts do not sit in every prompt. Second, large collections do not crowd out the task. Runtime retrieval costs time, so low-latency work may preload a small, verified set and fetch the rest only on demand.

The test is a context ablation: remove one source family, instruction set, memory class, or example set and rerun the eval bank. If nothing changes, that context may be dead weight. If unrelated cases move, the item may be causing interference.

## Provenance before persuasion

A fluent source is not an authoritative source. Preserve source identity through chunking, ranking, summarization, and generation. A claim should point back to the exact record and version that supported it.

Retrieval needs failure behavior:

| Failure | Safe behavior |
|---|---|
| no source found | say the evidence is absent or route to a human |
| conflicting sources | expose the conflict and source dates |
| stale source | block or label based on task risk |
| access denied | do not reveal existence through phrasing or metadata |
| low-confidence match | fetch more or narrow the task |
| source contains instructions | keep them as quoted data, never grant authority |

A model-generated summary does not erase provenance. Store the source set and summary version. If the summary becomes long-lived memory, treat it as a new derived record with its own owner and expiry.

## Memory is state with a write policy

Memory can improve continuity, and it can preserve mistakes or attacks. Decide what may be written, who can read it, how it expires, and how a user can inspect or delete it.

Separate at least four classes:

1. user preference, such as response format;
2. task state, such as completed steps;
3. learned fact, such as an account constraint;
4. model reflection, such as a plan or summary.

These classes should not share the same trust level. Task state belongs in the long-run state machine. A model reflection is a hint, not a fact. A user preference cannot grant permission to a tool.

OWASP's 2026 agentic risks include memory and context poisoning, which can persist beyond the first malicious interaction. [S18](../research/sources.yaml) Test delayed attacks: insert the malicious item in one run, then trigger the target action in a later run.

## Context budgets are quality budgets

Set budgets by function rather than one total number:

- policy and system rules;
- user and task input;
- examples;
- retrieved evidence;
- tool definitions and results;
- working history;
- reserved output.

When the budget is exceeded, use a declared policy: discard low-ranked evidence, summarize with source links, fetch later, or stop. Silent truncation turns quality failure into mystery.

## Release evidence

The context-plane owner should provide a manifest schema, access tests, freshness rules, retrieval evals, poisoning cases, memory-write rules, compaction tests, and a trace that reconstructs why every material source entered the run.

If an operator cannot answer which policy and records the model saw, the system cannot explain its own decision environment.
