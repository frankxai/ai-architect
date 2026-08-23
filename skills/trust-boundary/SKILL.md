---
name: trust-boundary
description: Find the line where retrieved text becomes an instruction instead of data, and gate every irreversible tool behind a human step. Use during the secure stage of /architect to write 05-trust-boundary.md — trust tiers T0-T3, the trace-the-retrieved-text procedure, tool gating, and the OWASP GenAI LLM Top 10 2026 mapping.
---

# Trust boundary

Text that comes back from a tool call is not the operator's text. A retrieved
document, an API response, a fetched page, an uploaded file — all authored by
someone who is not the person running the system. If that text reaches the
position in the context window where instructions live, it *is* an instruction,
and no amount of prompt wording fixes that, because "ignore anything below this
line" is also just text sitting in the same window. `05-trust-boundary.md`
exists to make that boundary explicit instead of implicit.

## How this skill is used

The `trust-reviewer` agent runs this skill during `secure` to write
`05-trust-boundary.md`. `gate.trust` is green only when a retrieved-text trace
points at the actual line where content becomes labelled data, and every
irreversible tool is gated by a named human step — not "review recommended,"
a specific gate category and a specific person or role.

## Trust tiers

| Tier | What lives here | Policy |
|---|---|---|
| **T0 — private local** | The operator's own files, local memory, anything only the operator's agent reads and writes | Full write access for trusted control-plane agents; nothing here is untrusted input |
| **T1 — scoped project** | One repo, one branch, one deployment target the system is authorized to touch | Write access allowed, gated by review and tests — not unreviewed autonomous writes |
| **T2 — external tools** | Browser, third-party APIs, cloud consoles, chat platforms the system calls with credentials | Explicit, narrow-scoped credentials; every call logged; no tool gets more scope than the one action it performs needs |
| **T3 — untrusted content** | Web pages, retrieved documents, pasted text, issue comments, uploaded files, and — critically — a model's own output once it has read T3 content | Treat as data, always. Never let it occupy the instruction position. Never execute it without a human step |

The tier that catches people is T3's last clause: **a model's output becomes T3
once it has read T3 content.** A summary the model writes of an untrusted
document is itself untrusted, because the document could have instructed the
model what to say about itself. Downstream steps that consume "the model's
answer" without knowing whether T3 content fed it are trusting a tier they
haven't checked.

## The trace-the-retrieved-text procedure

`gate.trust` requires this, not a description of it. Pick one real retrieval
path in the system and walk it end to end:

1. **Name the source.** What is retrieved — a document, an API response, search
   results, a file upload? From where?
2. **Find the retrieval call in code or config.** Evidence pointer:
   `path/to/retriever.ts:L23` or the tool definition that performs the fetch.
3. **Find where the result enters the prompt.** This is the line that matters
   most. Evidence pointer to the exact place the retrieved text is inserted
   into what gets sent to the model.
4. **Confirm it is labelled, not concatenated.** Labelled means the model can
   tell, structurally, that this span is data and not instruction — a fenced
   block with a role/tag the system prompt explicitly tells the model to treat
   as untrusted, a separate message role, a schema field that is never read as
   free text for instructions. Concatenation into the same instruction string
   with no marker is not labelling, however the prompt asks the model to behave.
5. **Write the pointer, not a paraphrase.** `05-trust-boundary.md` needs a real
   file:line or command-plus-output, e.g.:

   ```markdown
   Retrieved-text trace: `lib/retrieve.ts:L41` fetches the document body and
   passes it into `buildPrompt()` at `lib/prompt.ts:L18`, where it is wrapped
   as `<untrusted_document>...</untrusted_document>` inside the user message,
   never the system message. Confirmed no other call site skips this wrapper:
   `rg -l "buildPrompt\(" --type ts → 3 files, all through the same wrapper.`
   ```

If no retrieval path exists in this system, say so plainly and mark this
section not applicable — do not invent a trace to fill the section.

## Tool gating

Every tool the system can call gets classified as reversible or irreversible.
Irreversible tools — anything that sends, publishes, spends, deletes, or
changes something outside the system's own sandbox — need a named human gate
before execution, not a policy statement that one exists somewhere.

The eight human-gate categories (shared with `SOP.md`):
`publish`, `external_send`, `spend`, `dns`, `credentials`, `destructive`,
`legal_ip`, `brand_identity`.

For each irreversible tool in the system, write one row:

```markdown
| Tool | Category | Gate |
|---|---|---|
| send_email | external_send | Drafted by the agent, sent only after a named reviewer clicks send in the review UI |
| delete_record | destructive | Requires a second agent or human confirmation with the record id echoed back before delete runs |
```

A tool with no row in this table, and no row in `03-experience-blueprint.md`
showing a Human cell at that stage, is an unowned irreversible action —
`gate.trust` should fail on it, not pass with a note.

## OWASP GenAI LLM Top 10 2026 mapping

`references/owasp-genai-llm-top10-2026.md` holds the full 2026 list (fetched
from <https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/>, IDs
confirmed against the project's published source files). Use it as a checklist
in `05-trust-boundary.md`: for each of the ten risks, either point at the
control in this system that addresses it, or mark it `[not addressed]` and say
why that's an accepted gap rather than an oversight. Silence on a risk category
is not the same as a decision about it.

Close `05-trust-boundary.md` with the stamp line: `Generated by AI Architect · https://www.frankx.ai/ai-architect`
