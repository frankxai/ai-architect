# Buyer page draft: Agentic Architecture Playbook and Kit

Surface: `https://www.frankx.ai/ai-architecture`
Commercial posture: Waitlist-first (`available-soon`). `offer.facts.json` keeps `price.state: "decision_required", amount: null, currency: "EUR"`. No price is displayed on the public page and no live checkout is enabled until release gates G0 through G5 pass.
Visual system: Uses the CMO playbook system placeholders defined in [`playbook/VISUAL-PLACEHOLDERS.json`](../playbook/VISUAL-PLACEHOLDERS.json).

---

## Section 1: First screen (what your team builds and ships)

Eyebrow: AI Architect Studio · Playbook 02 (beside Multi-Agent Ops) · v1.0.0

H1: Ship multi-agent systems with a working capability proxy, C4 blueprints, and predictable unit economics.

Lede: Start with the free Apache-2.0 `/architect` plugin in your coding agent today. When your team is designing a production system, the Agentic Architecture Playbook and Kit gives you 10 full-length architecture chapters, a Structurizr C4 model and 4 Mermaid views, 10 worked ADRs, a runnable stdio MCP server with OAuth 2.1 audience checks and HMAC approval tokens, a two-provider TypeScript supervisor, and an OpenTelemetry trace cost calculator you can run against your own logs.

Primary actions:
- `Inspect the 4 runnable kit checks below` (`#prove-the-kit`)
- `Install the free /architect plugin` (`https://github.com/frankxai/ai-architect`)
- `Join the waitlist for the Playbook and Kit` (`#waitlist`)

[[PLAYBOOK_HERO_DIAGRAM]]

---

## Section 2: Prove the kit works (`#prove-the-kit`)

Every artifact in the kit is executed locally by `node --experimental-strip-types products/agentic-architecture/scripts/verify-agentic-architecture.mjs`:

1. Step 01 (`C4-as-code verified`): Parses `kit/c4/agentic-system.dsl` (18 architectural elements and 16 typed relationships) and 4 Mermaid C4 views (`c1` system context, `c2` containers, `c3` tool-plane components, `c4` Maker-Checker sequence).
2. Step 02 (`10 worked ADRs verified`): Lints `ADR-0001` through `ADR-0010` against `PAT-01..10` and `FM-01..10`, verifying that every record documents at least 3 concrete rejected alternatives with failure and cost reasons plus an executable verification command.
3. Step 03 (`Threat bindings & OTel trace cost analyzer verified`): Verifies that each threat `T-01` through `T-10` binds to an executable test and error code (`E_APPROVAL_REQUIRED`, `E_OAUTH_AUDIENCE_MISMATCH`, `E_WRITE_COLLISION`, `E_RECURSION_DEPTH_EXCEEDED`), models all-attempts unit economics across 3 reference workloads, and ingests OpenTelemetry GenAI span exports (`ingestOtelTraceSpans`) to compute cost per accepted outcome.
4. Step 04 (`Runnable MCP server & two-provider supervisor verified`): Runs `kit/mcp/reference-mcp-server.mjs` (verifying fail-closed startup without secrets, OAuth 2.1 RFC 8707 `aud` and `scope` checks, `<untrusted-content>` wrapping, `docs/architecture/` path containment, and HMAC-SHA256 approval tokens bound to `tenantId` and `expiresAt`) and executes `kit/workflows/supervisor-maker-checker.ts` across two provider families with disjoint write-path, recursion-depth, and 80% budget-ceiling checks.

[[PLAYBOOK_KIT_TOPOLOGY]]

[[PLAYBOOK_DECISION_DESK_PREVIEW]]

---

## Section 3: Ten full-depth chapters (pattern, worked ADR, failure story, and walkthrough in every chapter)

1. Ch 01: Trust boundaries, tool authority, and blast-radius containment (`PAT-01`, `ADR-0001`, `FM-01`) - `[[PLAYBOOK_FIG_CH01_TRUST_BOUNDARY]]`
2. Ch 02: Model-provider seams and routing under model churn (`PAT-02`, `ADR-0002`, `FM-02`) - `[[PLAYBOOK_FIG_CH02_MODEL_SEAM]]`
3. Ch 03: Context planes, provenance ledgers, and retrieval hygiene (`PAT-03`, `ADR-0003`, `FM-03`) - `[[PLAYBOOK_FIG_CH03_CONTEXT_ENVELOPE]]`
4. Ch 04: Multi-agent topology, handoff contracts, and Maker-Checker isolation (`PAT-04`, `ADR-0004`, `FM-04`) - `[[PLAYBOOK_FIG_CH04_MAKER_CHECKER]]`
5. Ch 05: Tool plane and Model Context Protocol (MCP) server hardening (`PAT-05`, `ADR-0005`, `FM-05`) - `[[PLAYBOOK_FIG_CH05_MCP_GATEWAY]]`
6. Ch 06: Durable execution, checkpointing, and out-of-order event recovery (`PAT-06`, `ADR-0006`, `FM-06`) - `[[PLAYBOOK_FIG_CH06_CONVERGENT_SAGA]]`
7. Ch 07: Memory planes, state convergence, and all-attempts cost envelopes (`PAT-07`, `ADR-0007`, `FM-07`) - `[[PLAYBOOK_FIG_CH07_COST_ENVELOPE]]`
8. Ch 08: Evaluation planes, regression suites, and adversarial red-teaming (`PAT-08`, `ADR-0008`, `FM-08`) - `[[PLAYBOOK_FIG_CH08_EVAL_TRIAD]]`
9. Ch 09: Observability planes, OpenTelemetry GenAI traces, and incident replay (`PAT-09`, `ADR-0009`, `FM-09`) - `[[PLAYBOOK_FIG_CH09_OTEL_REPLAY]]`
10. Ch 10: Production release readiness and 48-hour provider exit drills (`PAT-10`, `ADR-0010`, `FM-10`) - `[[PLAYBOOK_FIG_CH10_EXIT_DRILL]]`

---

## Section 4: Free core versus Playbook and Kit (`#waitlist`)

| Layer | License | What your team gets |
| :--- | :--- | :--- |
| Free core (`/architect` plugin and working guide) | `Apache-2.0` | Nine-stage CLI workflow, 23 working guide files, 58 dated primary sources, and the delegated-authority lab in `frankxai/ai-architect`. |
| Agentic Architecture Playbook and Kit | Commercial terms (`Available soon`) | All 10 full-depth playbook chapters, Structurizr C4 DSL + 4 Mermaid views, 10 worked ADRs, the Threat and OTel Trace Cost Workbook, the runnable stdio MCP server, the two-provider TypeScript supervisor + n8n workflow, and the 6-role prompt set. |

### What your team still does itself

1. Adapt the C4 model and ADRs to your own services: Replace the reference container names and workload numbers in `kit/c4/agentic-system.dsl` and `kit/workbooks/threat-and-cost-workbook.json` with your system's services and traffic.
2. Bring your own cloud, model, and KV accounts: You run the supervisor and MCP server on your own infrastructure with your own API keys.
3. Connect your organization's OAuth 2.1 issuer: `kit/mcp/reference-mcp-server.mjs` implements RFC 8707 resource-indicator audience (`aud`), scope, and expiry verification plus HMAC-SHA256 two-phase approval tokens; you wire it to your identity provider's JWKS or token secret before enabling live Tier-2 writes.
4. Approve your own legal and compliance posture: The threat workbook and release checklists are engineering tools, not legal advice.

[[PLAYBOOK_BUYER_FUNNEL_FLOW]]

### Waitlist configuration (`@starlight/demand-capture`)

- `productId`: `"agentic-architecture-playbook"`
- `productName`: `"Agentic Architecture Playbook and Kit"`
- `surface`: `"https://www.frankx.ai/ai-architecture"`
- `foundingBenefit`: `"First 100 are named in the release credits (optional) and help choose which cloud deployment realization ships next."`
- `status`: `Available soon` (checkout stays off until G0 through G5 pass).
