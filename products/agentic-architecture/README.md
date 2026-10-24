# Agentic Architecture Playbook and Kit (`product_agentic_architecture_playbook`)

**Brand:** AI Architect Studio (`brand_ai_architect_studio`)
**Position in Ladder:** Second premium playbook beside Multi-Agent Ops, built on top of the free Apache-2.0 `/architect` nine-stage evidence gate.
**Commercial State:** Waitlist-first (`price.state: "decision_required", amount: null`). No price is displayed on the buyer page and no live checkout is enabled.

## Contents

1. **10-Chapter Playbook (`playbook/`):**
   - [`playbook/PLAYBOOK-INDEX.md`](playbook/PLAYBOOK-INDEX.md)
   - [`playbook/VISUAL-PLACEHOLDERS.json`](playbook/VISUAL-PLACEHOLDERS.json) (CMO Playbook System visual placeholder tokens)
   - `playbook/chapters/01-..10-*.md` (10 chapters, each with an Architecture Pattern `PAT-01..10`, Decision Record Template `ADR-0001..0010`, and Failure Mode `FM-01..10`; Chapters 01, 04, and 07 written in full at 1,000+ words each).
2. **Runnable & Script-Checkable Kit (`kit/`):**
   - **C4 Diagrams as Code (`kit/c4/`):** `agentic-system.dsl` (Structurizr DSL) + 4 Mermaid C4 views (`c1`..`c4`) + `validate-c4.mjs`.
   - **ADR Library (`kit/adrs/`):** `ADR-0000-template.md` + `ADR-0001..ADR-0010.md` + `validate-adrs.mjs`.
   - **Threat & All-Attempts Cost Workbook (`kit/workbooks/`):** `threat-and-cost-workbook.json` (10 threats `T-01..T-10` + 3 workload models) + `evaluate-workbook.mjs`.
   - **MCP Server Reference Designs (`kit/mcp/`):** `reference-mcp-server.mjs` (Tier 0/1/2 capability proxy, `<untrusted-content>` tagging, path containment, two-phase approval tokens) + `mcp-security-profiles.json`.
   - **Workflow Templates (`kit/workflows/`):** `supervisor-maker-checker.ts` (TypeScript supervisor state machine) + `n8n-agentic-triage-and-approval.json` (6-node n8n workflow).
   - **Prompt Set (`kit/prompts/`):** `prompt-set.json` (6 production system prompts with JSON output schemas and golden/refusal/injection eval cases).
3. **Competitive Benchmark (`docs/COMPETITIVE-BAR.md`):**
   - Five closest paid alternatives with verified URLs, prices, and date checked (`2026-10-24`), plus the one dimension we beat.
4. **Buyer Page Draft (`buyer-page/`):**
   - [`buyer-page/BUYER-PAGE-DRAFT.md`](buyer-page/BUYER-PAGE-DRAFT.md) and [`buyer-page/offer.facts.json`](buyer-page/offer.facts.json).

## Verify Everything in One Command

```bash
node products/agentic-architecture/scripts/verify-agentic-architecture.mjs
node --test products/agentic-architecture/tests/verify-agentic-architecture.test.mjs
```
