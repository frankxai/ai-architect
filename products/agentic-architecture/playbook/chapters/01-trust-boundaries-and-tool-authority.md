# Chapter 01: Trust Boundaries, Tool Authority, and Blast-Radius Containment

**Pattern ID:** `PAT-01` (Scoped Capability Proxy and Two-Phase Action Gate)
**Decision Record:** [`ADR-0001`](../../kit/adrs/ADR-0001.md)
**Failure Mode:** `FM-01` (Indirect Prompt Injection Escalating to Unattended External Write)

[[PLAYBOOK_FIG_CH01_TRUST_BOUNDARY]]

## 1. The Architect's Problem

Every production agent system eventually crosses a line where probabilistic text becomes an external side effect. Below that line, the model summarizes documents, drafts code, ranks options, or proposes a database query. Above that line, the runtime mutates state: it charges a payment card, merges a pull request, sends a customer email, revokes an entitlement, or deletes a production record.

Most teams draw their architecture diagrams around model calls and vector databases, leaving tool permissions implicit inside a single service token. That mistake turns every untrusted string entering the context window into a potential command. When an agent reads a customer support ticket, a third-party webpage, a webhook payload, or a shared repository issue, any directive planted inside that data travels into the same reasoning loop that holds the ability to call write tools. Because language models do not natively separate instructions from data, a prompt-level warning to ignore untrusted instructions is never a security boundary.

An architecture boundary exists only when deterministic code outside the language model enforces what the model is allowed to read, propose, and execute. This chapter defines the foundational pattern for bounding tool authority in production agent systems.

## 2. Architecture Pattern: `PAT-01` Scoped Capability Proxy and Two-Phase Action Gate

### Context and Forces

You are designing an agent that must read untrusted external inputs (emails, web pages, tickets, documents, or third-party MCP tool outputs) and also perform state-changing operations in internal or external systems. You face three competing forces:

1. **Autonomy versus safety:** Requiring human confirmation on every read or search destroys operator speed, while allowing unattended writes exposes the system to confused-deputy attacks.
2. **Credential isolation:** Giving the agent container raw API keys allows a compromised prompt or dependency to exfiltrate secrets or call arbitrary endpoints.
3. **Replay and auditability:** When an outward action fails mid-flight or is retried by a queue worker, the boundary must prevent duplicate side effects and record who authorized the call.

### Structural Solution

Split the tool plane into three distinct execution tiers enforced by a deterministic **Scoped Capability Proxy** outside the model runtime:

1. **Tier 0: Read-Only Discovery and Context Ingress (`allow-unattended`).**
   Tools that only read state within the caller's tenant scope. Every payload returned from Tier 0 is wrapped in an explicit `<untrusted-content source="...">` envelope before entering the model context, and the proxy strips any forged closing tags.
2. **Tier 1: Reversible Internal Staging (`allow-with-budget-and-idempotency`).**
   Tools that write only to isolated draft surfaces, local sandboxes, or staging tables. Every call requires a caller-supplied `idempotencyKey`, a tenant scope assertion, and a per-run write counter capped by policy.
3. **Tier 2: Consequential Outward or Destructive Actions (`two-phase-confirm-required`).**
   Tools that send external communications, move money, mutate production records, or alter access policies. A Tier 2 tool cannot be executed directly by a model tool call. Instead, calling the tool creates a **Proposed Action Record** hashed over `(tenantId, toolName, canonicalParams, expiresAt)` and returns a `pending_approval` status. Execution happens only when a distinct principal (a human operator or an independent deterministic policy gate) supplies a cryptographic approval token bound to that exact payload hash.

```
[Untrusted Input] ---> (Tag & Sanitize Ingress) ---> [Agent Reasoning Loop]
                                                            |
                        +-----------------------------------+-----------------------------------+
                        | Tier 0: Read                      | Tier 1: Draft                     | Tier 2: Outward Write
                        v                                   v                                   v
              [Read-Only Proxy]                   [Idempotent Draft Store]            [Two-Phase Action Gate]
         (Tenant filter + tag output)           (Quota + idempotencyKey check)       (Hash payload -> Hold for approval)
```

### Invariants Enforced by Code

- **No raw credentials in the model environment:** The agent process holds only a short-lived session capability token. Upstream API keys live inside the proxy or credential injector (`kit/mcp/reference-mcp-server.mjs`).
- **Actor cannot approve its own Tier 2 proposal:** The principal ID on the approval token must differ from the proposing agent ID, and the payload hash must match byte-for-byte.
- **Unattended runs default to read-only:** Scheduled or webhook-triggered runs start with Tier 2 disabled unless an explicit schedule policy grants a narrow allowlist.

## 3. Decision Record Template: `ADR-0001`

Use this template (shipped as a completed record in `kit/adrs/ADR-0001.md`) whenever a system connects a language model to any tool that mutates state:

```markdown
# ADR-0001: Separate Read-Only Context Retrieval from Consequential Tool Writes

- **Status:** Accepted
- **Date:** 2026-10-24
- **Pattern:** PAT-01 (Scoped Capability Proxy and Two-Phase Action Gate)
- **Mitigates:** FM-01 (Indirect Prompt Injection Escalating to Unattended External Write)

## Context
The agent ingests untrusted external text (customer tickets, web search results, and third-party webhook payloads) while holding access to state-mutating tools.

## Decision
Route all tool invocations through a deterministic capability proxy that classifies every action into Tier 0 (read-only), Tier 1 (reversible draft with idempotency key), or Tier 2 (outward or destructive write requiring a two-phase approval token bound to the canonical payload hash).

## Alternatives Considered and Rejected
1. **System-prompt instruction only ("Never run destructive tools without asking"):** Rejected because indirect prompt injection inside retrieved data routinely overrides system-prompt prose.
2. **Single shared API key inside the agent container:** Rejected because any shell or code-execution tool can read environment variables and bypass tool-schema restrictions.
3. **Human approval on every read and search call:** Rejected because alert fatigue trains operators to rubber-stamp requests without reading the payload.

## Consequences
- **Positive:** Untrusted text cannot trigger an outward write without a separate principal signing the exact parameter hash.
- **Negative / Cost:** Tier 2 actions add one asynchronous pause-and-resume round trip and require persistent storage for pending proposals.

## Verification Command
`node products/agentic-architecture/scripts/verify-agentic-architecture.mjs`
```

## 4. Production Failure Mode: `FM-01`

### Trigger
An agent summarizing an inbound customer email or public GitHub issue encounters hidden instructions embedded in the text (for example, an HTML comment or markdown block instructing the assistant to export customer records or issue a refund to an attacker address).

### Blast Radius When Unmitigated
Without a deterministic Tier 2 gate and tenant-scoped proxy, the agent invokes the refund or email tool using the service account's standing credentials. External funds or private records leave the boundary before any human sees the trace.

### Detection Telemetry
- Span attribute `tool.tier == "tier_2"` combined with `context.contains_untrusted_ingress == true`.
- Spike in `E_APPROVAL_REQUIRED` or `E_SCOPE_ESCALATION` rejections emitted by the capability proxy.
- Mismatch between the inbound ticket's `tenant_id` and the target `tenant_id` in the proposed tool arguments.

### Deterministic Mitigation
1. Wrap every external text segment in `<untrusted-content>` tags at ingress and strip nested closing tags (`kit/mcp/reference-mcp-server.mjs`).
2. Enforce tenant equality (`session.tenantId === args.tenantId`) in the proxy before any database or API call.
3. Require a two-phase approval token (`approvalToken` bound to the SHA-256 hash of `toolName + canonicalJson(args)`) for all Tier 2 tools (`guide/labs/delegated-authority/policy.test.mjs` and `kit/mcp/reference-mcp-server.mjs`).

### Executable Verification in This Kit
- Run `node products/agentic-architecture/scripts/verify-agentic-architecture.mjs` to execute the reference MCP server against both an unapproved Tier 2 write (`E_APPROVAL_REQUIRED`) and a path-escape probe (`E_PATH_CONTAINMENT`).

## 5. Worked Implementation and Red-Team Walkthrough

Consider a multi-tenant release assistant that reads customer bug reports from a public issue tracker, queries an internal order ledger, stages a remediation patch in a workspace directory, and issues a refund credit when a service-level objective is breached. Without a Scoped Capability Proxy, all four actions share one runtime credential. An attacker who files a bug report containing a disguised instruction block can steer the model into calling the refund endpoint for an arbitrary order ID or writing a script outside the workspace directory.

When you apply `PAT-01`, the proxy separates those four operations before the model ever sees a tool response:

1. **Ingress tagging on the issue reader (Tier 0):** When the agent reads the public bug report, the proxy wraps the body in `<untrusted-content source="github:issue:402">` and replaces any literal closing `</untrusted-content>` substring inside the issue body with `[stripped-boundary-tag]`. The model can analyze the bug report, but the proxy records on the active trace span that untrusted external text has entered the context window (`context.tainted = true`).
2. **Path-contained, idempotent staging (Tier 1):** When the agent proposes a configuration fix or an ADR draft via `stage_adr_draft`, the proxy requires a caller-supplied `idempotencyKey` and resolves the target path with POSIX normalization. Any path that starts with `/`, traverses `..`, or falls outside `docs/architecture/` is rejected immediately with `E_PATH_CONTAINMENT`. If a network retry sends the same `idempotencyKey` twice, the proxy returns `duplicate_replay` without overwriting the file.
3. **Two-phase confirmation on outward mutations (Tier 2):** When the agent calls `approve_release_gate` or requests a customer refund, the proxy refuses to execute the mutation inline. It computes the SHA-256 digest of the canonical JSON payload `(proposerId, releaseId)` and returns `outcome: "pending_approval"` with `code: "E_APPROVAL_REQUIRED"`. If the agent attempts to pass its own identity as `approverId`, the proxy rejects the call with `E_SELF_APPROVAL_FORBIDDEN`. Execution proceeds only after a separate human principal or independent policy service signs that exact payload digest.

### Red-Team Verification Checklist for Chapter 01
- Pass a payload containing a closing `</untrusted-content>` tag into every Tier 0 tool and confirm the tag is neutralized before returning to the model.
- Call every Tier 1 write tool with `../outside.md` and `/etc/passwd` and confirm the proxy returns `E_PATH_CONTAINMENT` with zero filesystem side effects.
- Call every Tier 2 tool without an `approvalToken`, with a self-signed `proposerId === approverId`, and with a token signed for a different `releaseId`, confirming all three are blocked before reaching the downstream API.
