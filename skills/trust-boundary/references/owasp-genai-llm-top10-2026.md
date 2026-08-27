# OWASP GenAI LLM Top 10 — 2026

Source: <https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/>, published
2026-08-04 by the OWASP Gen AI Security Project. IDs and ordering confirmed
against the project's own published source files (`2026/final/LLM01_PromptInjection.md`
through `LLM10_ImproperOutputHandling.md`) in the project's GitHub repository.
Retrieved 2026-08-22. This is a title-level reference for mapping — read the
official page for full risk descriptions, examples, and mitigations before
citing specifics beyond the title in customer-facing text.

| ID | Risk | What to check for in `05-trust-boundary.md` |
|---|---|---|
| LLM01:2026 | Prompt injection | Does the retrieved-text trace show untrusted content ever reaching the instruction position? This is the risk the trace procedure exists to catch directly. |
| LLM02:2026 | Sensitive information disclosure | Can a tool response, a retrieved document, or a model answer leak data across a trust tier — T0/T1 content surfacing in a T2/T3-facing output? |
| LLM03:2026 | Excessive agency | Does any tool grant more scope than the one action it performs needs? Cross-check the tool-gating table — a broad-scope tool used for a narrow task is this risk in config form. |
| LLM04:2026 | Supply chain | Are model providers, retrieval sources, and installed skills/plugins from a known, intentional source — not a default nobody chose? |
| LLM05:2026 | Data and model poisoning | If the system fine-tunes, indexes, or learns from ingested content, is that content's provenance checked before it shapes future behavior? |
| LLM06:2026 | Unbounded consumption | Does every loop have an exit condition in code (a counter, a budget, a state machine) rather than a prompt instruction to "stop when done"? |
| LLM07:2026 | Misinformation | Does the system's output distinguish sourced, verifiable claims from generated narrative — especially anywhere a number or a citation is presented as fact? |
| LLM08:2026 | Hidden context exposure | Does anything in the system prompt, retrieved context, or tool schema reveal information the operator did not intend to expose to the end user? |
| LLM09:2026 | Vector and embedding weaknesses | If a vector store is in use, is it scoped so that one tenant's or user's embeddings can't be retrieved by another's query? |
| LLM10:2026 | Improper output handling | Is model output ever passed to a shell, a database query, a renderer, or another system without the same validation any other untrusted input would get? |

## Using this table

For each row, `05-trust-boundary.md` states one of:

- **Addressed** — point at the control: an evidence pointer (file:line), a row
  in the tool-gating table, or the retrieved-text trace itself.
- **`[not addressed]`** — say why this is an accepted gap for this system
  (e.g., "no vector store in this system — LLM09 not applicable") rather than
  leaving the row silent. A gap that's named is a decision; a gap that's silent
  is a finding someone else makes later, usually during an incident.

Do not renumber, reorder, or rename these risks when writing customer artifacts
— cite the ID and title exactly as published, and link the source URL above so
the reader can verify against the live page rather than trusting this mirror
indefinitely.
