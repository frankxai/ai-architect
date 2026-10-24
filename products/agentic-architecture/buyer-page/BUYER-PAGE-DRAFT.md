# Buyer Page Draft: Agentic Architecture Playbook and Kit

**Surface:** AI Architect Studio (`/playbooks/agentic-architecture`)
**Commercial posture:** **Waitlist-first (`available-soon`)**. `offer.facts.json` keeps `price.state: "decision_required", amount: null`. No price is displayed and no live checkout is enabled until G0 through G5 are signed off.
**Visual system:** Uses the CMO Playbook System placeholders defined in [`playbook/VISUAL-PLACEHOLDERS.json`](../playbook/VISUAL-PLACEHOLDERS.json).

---

## Section 1: First Screen (One Buyer Job and Visible Outcome)

**Eyebrow:** AI Architect Studio · Playbook 02 (beside Multi-Agent Ops) · v1.0.0

**H1:** Design production agent systems whose trust boundaries, handoffs, and cost ceilings are enforced by code, not prompt wishes.

**Lede:** Start with the free Apache-2.0 `/architect` nine-stage lifecycle in your coding agent today. When your team needs the complete reference implementation, the Agentic Architecture Playbook and Kit adds 10 pattern-to-failure chapters, C4 diagrams as code, 10 worked ADRs, an executable threat and all-attempts cost workbook, a reference MCP capability proxy, and TypeScript plus n8n workflows verified by one script.

**Primary actions:**
- `Inspect the 6 runnable kit checks below` (`#prove-the-kit`)
- `Install the free /architect plugin` (`https://github.com/frankxai/ai-architect`)
- `Join the waitlist for the Playbook and Kit` (`#waitlist`)

[[PLAYBOOK_HERO_DIAGRAM]]

---

## Section 2: Prove the Kit Works (`#prove-the-kit`)

Every artifact in the kit is checked by `node products/agentic-architecture/scripts/verify-agentic-architecture.mjs`:

1. **Step 01 (`C4-as-code verified`):** Parses `kit/c4/agentic-system.dsl` (14 typed relationships across 9 architectural elements) and 4 Mermaid C4 views (`c1` context, `c2` containers, `c3` tool-plane components, `c4` Maker-Checker sequence).
2. **Step 02 (`10 ADRs verified`):** Lints `ADR-0001` through `ADR-0010` against `PAT-01..10` and `FM-01..10`, confirming rejected alternatives and verification commands on every record.
3. **Step 03 (`Threat & all-attempts cost workbook verified`):** Evaluates `T-01` through `T-10` (residual severity `<= 1`) and computes all-attempts unit economics across 3 production workloads, including retries and human review minutes.
4. **Step 04 (`Reference MCP server & workflows verified`):** Executes `kit/mcp/reference-mcp-server.mjs` over JSON-RPC 2.0 (verifying `<untrusted-content>` wrapping, `docs/architecture/` path containment, idempotency replay, and Tier-2 two-phase approval tokens) and runs `kit/workflows/supervisor-maker-checker.ts` plus the 6-node n8n workflow graph.

[[PLAYBOOK_KIT_TOPOLOGY]]

[[PLAYBOOK_DECISION_DESK_PREVIEW]]

---

## Section 3: Ten Chapters — Pattern, Decision Record, and Failure Mode in Every Chapter

1. **Ch 01 (Full Chapter):** Trust Boundaries, Tool Authority, and Blast-Radius Containment (`PAT-01`, `ADR-0001`, `FM-01`) — `[[PLAYBOOK_FIG_CH01_TRUST_BOUNDARY]]`
2. **Ch 02:** Model-Provider Seams and Routing Under Model Churn (`PAT-02`, `ADR-0002`, `FM-02`) — `[[PLAYBOOK_FIG_CH02_MODEL_SEAM]]`
3. **Ch 03:** Context Planes, Provenance Ledgers, and Retrieval Hygiene (`PAT-03`, `ADR-0003`, `FM-03`) — `[[PLAYBOOK_FIG_CH03_CONTEXT_ENVELOPE]]`
4. **Ch 04 (Full Chapter):** Multi-Agent Topology, Handoff Contracts, and Maker-Checker Isolation (`PAT-04`, `ADR-0004`, `FM-04`) — `[[PLAYBOOK_FIG_CH04_MAKER_CHECKER]]`
5. **Ch 05:** Tool Plane and Model Context Protocol (MCP) Server Hardening (`PAT-05`, `ADR-0005`, `FM-05`) — `[[PLAYBOOK_FIG_CH05_MCP_GATEWAY]]`
6. **Ch 06:** Durable Execution, Checkpointing, and Out-of-Order Event Recovery (`PAT-06`, `ADR-0006`, `FM-06`) — `[[PLAYBOOK_FIG_CH06_CONVERGENT_SAGA]]`
7. **Ch 07 (Full Chapter):** Memory Planes, State Convergence, and All-Attempts Cost Envelopes (`PAT-07`, `ADR-0007`, `FM-07`) — `[[PLAYBOOK_FIG_CH07_COST_ENVELOPE]]`
8. **Ch 08:** Evaluation Planes, Regression Suites, and Adversarial Red-Teaming (`PAT-08`, `ADR-0008`, `FM-08`) — `[[PLAYBOOK_FIG_CH08_EVAL_TRIAD]]`
9. **Ch 09:** Observability Planes, OpenTelemetry GenAI Traces, and Incident Replay (`PAT-09`, `ADR-0009`, `FM-09`) — `[[PLAYBOOK_FIG_CH09_OTEL_REPLAY]]`
10. **Ch 10:** Release Gates, Portable Ownership, and Sovereign Exit Readiness (`PAT-10`, `ADR-0010`, `FM-10`) — `[[PLAYBOOK_FIG_CH10_GOVERNANCE_GATE]]`

---

## Section 4: Free Core vs. Playbook and Kit (`#waitlist`)

| Layer | License | What You Get Today |
| :--- | :--- | :--- |
| **Free Core (`/architect` plugin & working guide)** | `Apache-2.0` | Nine-stage gated CLI workflow, 23 working guide files, 58 dated primary sources, and the delegated-authority lab. Available now in `frankxai/ai-architect`. |
| **Agentic Architecture Playbook and Kit** | Commercial terms (`Available soon`) | The 10-chapter playbook (3 chapters in full + 7 structured pattern/ADR/failure-mode chapters), Structurizr DSL + 4 Mermaid C4 views, 10 worked ADRs, the executable Threat & Cost Workbook, the reference MCP server, TypeScript + n8n workflows, and the 6-role Prompt Set. |

### What You Still Do Yourself

1. **Adapt the C4 and ADR files to your domain:** Replace the reference container names and workload token numbers in `kit/c4/agentic-system.dsl` and `kit/workbooks/threat-and-cost-workbook.json` with your system's real services and traffic.
2. **Bring your own cloud, model, and KV accounts:** You run the workflows on your own infrastructure with your own API keys.
3. **Wire your production identity provider:** The reference MCP server demonstrates OAuth 2.1 audience checks and SHA-256 two-phase approval tokens; you bind it to your organization's identity provider before enabling live Tier-2 writes.
4. **Approve your own legal and compliance posture:** The threat workbook and governance gates are engineering tools, not legal certification.

[[PLAYBOOK_BUYER_FUNNEL_FLOW]]

### Waitlist Configuration (`@starlight/demand-capture`)

- `productId`: `"agentic-architecture-playbook"`
- `productName`: `"Agentic Architecture Playbook and Kit"`
- `foundingBenefit`: `"First 100 are named in the release credits (optional) and help choose which cloud deployment realization ships next."`
- `status`: `Available soon` (checkout stays off until G0 through G5 pass).
