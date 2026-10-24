# Ship agentic systems with verified trust boundaries, C4 models, and cost circuit breakers

[[BUYER_PAGE_HERO_BANNER]]

> **Waitlist open (no live checkout):** Pricing is under owner review (`price.state = "decision_required"`, `currency = "EUR"`). Join the founding architect waitlist for early access and release notifications.

## What you build and verify in your first 60 minutes

**AI Architect Studio: the Agentic Architecture Playbook and Kit** gives engineering leads, staff engineers, and CTOs a 10-chapter architecture playbook paired with a runnable reference kit:

- **10-chapter Agentic Architecture Playbook (`playbook/`):** Every chapter pairs a formal architecture pattern (`PAT-01..10`) with a worked Architecture Decision Record (`ADR-0001..0010`), a concrete production failure story (`FM-01..10`), detection telemetry, deterministic mitigation steps, and a red-team verification checklist.
- **C4-as-code diagrams (`kit/c4/`):** A single Structurizr DSL workspace (`agentic-system.dsl` with 18 defined elements and 16 relationships) plus 4 Mermaid views (Context, Container, Component, and Maker-Checker sequence) validated by `kit/c4/validate-c4.mjs`.
- **MCP 2025-06-18 reference capability server (`kit/mcp/reference-mcp-server.mjs`):** Includes both a **Streamable HTTP transport** (`GET /.well-known/oauth-protected-resource` RFC 9728 metadata, `POST /mcp` returning `401 WWW-Authenticate` on invalid bearer tokens, verifying OAuth 2.1 RS256 tokens against `jwks.keys` by `kid` or HS256 tokens, checking `iss`, `nbf`, `exp`, RFC 8707 `aud`, and per-tier `scope`) and a spec-compliant **STDIO transport** that reads credentials from host environment variables (`MCP_STDIO_SUB`, `MCP_STDIO_TENANT_ID`, `MCP_STDIO_SCOPE`) and rejects OAuth headers over stdio (`E_STDIO_BEARER_FORBIDDEN`). Enforces closed JSON Schema `inputSchema` definitions on all tools and stateful server-side two-phase approval (`propose_release_gate` -> `proposalId` -> `approve_release_gate`).
- **Two-provider supervisor & n8n durable workflow (`kit/workflows/`):** `supervisor-maker-checker.ts` enforces prefix-aware disjoint `writePaths` (`E_WRITE_COLLISION`), cross-family Maker/Checker separation (`E_CHECKER_ISOLATION`), dispatch-time subagent recursion bans (`E_RECURSION_DEPTH_EXCEEDED`, `E_SUBAGENT_SPAWN_FORBIDDEN`), and an 80% hard budget ceiling (`E_BUDGET_EXCEEDED`), and dispatches Maker and Checker prompts across Anthropic, OpenAI, or Google Gemini HTTP endpoints (with a deterministic `dryRun` fixture mode for offline CI tests). Paired with an importable 6-node n8n workflow (`n8n-agentic-triage-and-approval.json`).
- **Threat matrix & OpenTelemetry GenAI cost evaluator (`kit/workbooks/`):** Binds all 10 threats (`T-01..T-10`) to executable control modules and error codes, models all-attempts cost per accepted outcome across 3 workloads, and ingests OpenTelemetry GenAI trace spans (`ingestOtelTraceSpans`) to compute measured cost per accepted run.

---

## Proof walkthrough (local verification in under 2 minutes)

[[BUYER_PAGE_PROOF_CAROUSEL]]

1. **Step 01 (`C4-as-code workspace validated`):** Runs `node products/agentic-architecture/kit/c4/validate-c4.mjs` to parse `agentic-system.dsl` (18 elements, 16 relationships) and all 4 Mermaid diagrams.
2. **Step 02 (`10 ADRs with 3 concrete rejected options each`):** Runs `node products/agentic-architecture/kit/adrs/validate-adrs.mjs` to verify `ADR-0000-template.md` and `ADR-0001..0010.md`, checking that each ADR documents at least 3 concrete rejected alternatives and pattern-specific consequences.
3. **Step 03 (`Threat & OTel cost evaluator verified`):** Runs `node products/agentic-architecture/kit/workbooks/evaluate-workbook.mjs` to verify all 10 threat-to-test bindings and compute cost per accepted outcome from `sample-otel-spans.json`.
4. **Step 04 (`Streamable HTTP + STDIO MCP server & two-provider supervisor verified`):** Runs `node --experimental-strip-types products/agentic-architecture/scripts/verify-agentic-architecture.mjs` to test RFC 9728 metadata, RS256 JWKS + HS256 OAuth 2.1 audience/issuer/expiry checks, stateful `proposalId` approval, STDIO environment auth, and two-provider supervisor dispatch.

---

## Frequently asked questions

### Does this require a specific cloud or model provider?
No. The C4 workspace, ADRs, and capability seam (`PAT-02`) use model-agnostic capability tiers (`tier-a-fast-classifier`, `tier-b-balanced-builder`, `tier-c-frontier-reasoner`, `tier-d-independent-checker`) and multi-provider adapters so your team can route across Anthropic, OpenAI, Google Gemini, or xAI and execute a 48-hour provider exit drill (`PAT-10`).

### Is `reference-mcp-server.mjs` a toy mock or a runnable server?
It is a zero-dependency Node.js module exporting both a Streamable HTTP server (`startStreamableHttpMcpServer`, serving `GET /.well-known/oauth-protected-resource` per RFC 9728 and `POST /mcp` with `401 WWW-Authenticate` headers) and a newline-delimited JSON-RPC 2.0 STDIO server (`runStdioServer`). Its token verifier (`verifyOAuth2BearerToken`) supports both asymmetric `RS256` verification against a configured `jwks: { keys: [...] }` set (matching `kid`) and `HS256` shared-secret verification, checking `iss`, `nbf`, `exp`, RFC 8707 `aud`, and per-tier `scope`.

### What stays free and open-source in `frankxai/ai-architect`?
The Apache-2.0 `/architect` nine-stage Claude Code plugin (17 commands, 11 agents, 14 skills, 16 eval cases), the 3 runnable cloud deployment templates (`templates/deploy/`), and the public field guide (`guide/`, comprising 23 manuscript chapters and appendices in `guide/manuscript/` — 51 total markdown files across `guide/` including labs and templates — backed by 58 dated primary sources in `guide/research/sources.yaml`) remain 100% free and open-source.

---

## Join the founding architect waitlist

- **Target surface:** `https://www.frankx.ai/ai-architecture`
- **Action:** Join the waitlist (`cta.mode = "waitlist_only"`, `checkout.enabled = false`) to receive `ADR-0001` and the OpenTelemetry trace cost evaluator immediately upon release.
