# Agentic Architecture Playbook and Kit (`product_agentic_architecture_playbook`)

Brand: AI Architect Studio (`brand_ai_architect_studio`)
Position in ladder: Second premium playbook beside Multi-Agent Ops, built on top of the free Apache-2.0 `/architect` nine-stage workflow.
Commercial state: `building` / waitlist-first (`price.state: "decision_required", amount: null, currency: "EUR"`). No price is displayed on the buyer page and no live checkout is enabled.

## What ships in this directory

1. 10-chapter playbook (`playbook/`):
   - [`playbook/PLAYBOOK-INDEX.md`](playbook/PLAYBOOK-INDEX.md)
   - [`playbook/VISUAL-PLACEHOLDERS.json`](playbook/VISUAL-PLACEHOLDERS.json) (CMO playbook system visual placeholder tokens)
   - `playbook/chapters/01-..10-*.md` (all 10 chapters written in full at 1,000+ non-code prose words each, with an architecture pattern `PAT-01..10`, worked ADR template `ADR-0001..0010`, failure mode `FM-01..10`, worked implementation, and red-team walkthrough).
2. Runnable and script-checkable kit (`kit/`):
   - C4 diagrams as code (`kit/c4/`): `agentic-system.dsl` (Structurizr DSL with 18 elements and 16 relationships) + 4 Mermaid C4 views (`c1`..`c4`) + `validate-c4.mjs`.
   - ADR library (`kit/adrs/`): `ADR-0000-template.md` + `ADR-0001..ADR-0010.md` (each with 3 concrete rejected alternatives and a chapter-specific verification command) + `validate-adrs.mjs`.
   - Threat and OTel trace cost workbook (`kit/workbooks/`): `threat-and-cost-workbook.json` (10 threat-to-test bindings + 3 workload models with dated token prices) + `evaluate-workbook.mjs` (including `ingestOtelTraceSpans` for computing cost per accepted outcome from OpenTelemetry GenAI span exports).
   - MCP server reference design (`kit/mcp/`): `reference-mcp-server.mjs` (runnable JSON-RPC 2.0 stdio and in-process server with fail-closed secret config, OAuth 2.1 RFC 8707 audience and scope verification, `<untrusted-content>` tagging, `docs/architecture/` path containment, and HMAC-SHA256 approval tokens bound to `tenantId` and `expiresAt`) + `mcp-security-profiles.json`.
   - Workflow templates (`kit/workflows/`): `supervisor-maker-checker.ts` (two-provider TypeScript supervisor enforcing disjoint `writePaths`, cross-family Maker/Checker separation, subagent recursion/spawn ban, and 80% budget ceiling) + `n8n-agentic-triage-and-approval.json` (6-node n8n workflow).
   - Prompt set (`kit/prompts/`): `prompt-set.json` (6 role system prompts with JSON output schemas and golden, refusal, and injection eval cases).
3. Competitive bar (`docs/COMPETITIVE-BAR.md`):
   - Benchmarks *AI Engineering* (O'Reilly), the Anthropic/OpenAI/OWASP agent guides, ClaudeKit (USD 99), BuiltByZac Bundle (USD 99), GetAutopilotKit (USD 79), and AgentKitCo (USD 14, 12 stack templates), checked on `2026-10-24`.
4. Buyer page draft (`buyer-page/`):
   - [`buyer-page/BUYER-PAGE-DRAFT.md`](buyer-page/BUYER-PAGE-DRAFT.md) and [`buyer-page/offer.facts.json`](buyer-page/offer.facts.json).

## Run the verification suite locally

```bash
node --experimental-strip-types products/agentic-architecture/scripts/verify-agentic-architecture.mjs
node --experimental-strip-types --test products/agentic-architecture/tests/verify-agentic-architecture.test.mjs
```
