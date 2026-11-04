# Competitive bar and market benchmark (2026-10-24)

Product: `product_agentic_architecture_playbook` (AI Architect Studio: the Agentic Architecture Playbook and Kit)
Canonical path: `frankxai/ai-architect` (`products/agentic-architecture/`); mirrored to `frankxai/product-plans` for catalog tracking.
Stage: `building` (release gates G0 through G5 not yet signed off; price remains Frank's decision; EUR reference band EUR 149 to 199 for team/seat licensing under evaluation).

## 1. What engineering leads and CTOs actually compare this against

A staff engineer, principal architect, or CTO evaluating an **Agentic Architecture Playbook and Kit** compares it against three real categories:
1. **Foundational AI engineering books and vendor architecture guides** (O'Reilly's *AI Engineering*, Anthropic's *Building effective agents*, OpenAI's *Practical guide to building agents*, and the OWASP Agentic Top 10).
2. **Commercial coding-agent harness and starter kits** (`ClaudeKit`, `BuiltByZac` Full Stack AI Agent Bundle, `GetAutopilotKit`, and `AgentKitCo`).
3. **Internal DIY assembly** from scattered blog posts, protocol specs, and ad-hoc scripts.

| Alternative | URL | Price (checked 2026-10-24) | What it ships well | Where it stops for a production system architect |
| :--- | :--- | :--- | :--- | :--- |
| 1. Chip Huyen, *AI Engineering* (O'Reilly Media, 2025, ISBN `9781098166298`) | `https://www.oreilly.com/library/view/ai-engineering/9781098166298/` | ~EUR 65 (USD 69.99 retail print list price for ISBN `9781098166298`; O'Reilly's URL returns HTTP 403 to automated crawlers) | Rigorous book-length treatment of foundation model evaluation, RAG, finetuning, latency math, and production patterns. | Prose reference book only; does not ship a runnable C4-as-code workspace, an ADR repository template, an executable OAuth 2.1 MCP proxy, or an OTel span cost calculator. |
| 2. Vendor & standards guides: Anthropic (*Building effective agents*), OpenAI (*A practical guide to building agents*), OWASP Top 10 for Agentic Applications (2026) | `https://www.anthropic.com/engineering/building-effective-agents` / `https://genai.owasp.org/` | Free | Clear taxonomy of workflows vs. agents, orchestrator-workers, evaluator-optimizers, and the 10 primary agentic threat classes (`S05`, `S06`, `S18`). | Conceptual guidance only; leaves the engineering lead to author their own C4 DSL, ADRs, MCP authorization server, and cost-per-accepted-outcome evaluator from scratch. |
| 3. ClaudeKit (AI Kit for Claude Code) | `https://getclaudekit.com/ai` | USD 99 (~EUR 92) one-time (shown against USD 199) | Comprehensive 196-file Claude Code kit covering `.claude/` commands, MCP building, securing, testing and deploying, evals, red-teaming, guardrails, cost controls, and human-in-the-loop approval. | Built for configuring the Claude Code harness; does not ship a vendor-neutral Structurizr C4 model, a 10-ADR architecture decision library with worked trade-offs, or a two-provider supervisor that dispatches across distinct model families in code. |
| 4. BuiltByZac (Full Stack AI Agent Bundle) | `https://builtbyzac.com/bundle.html` | USD 99 (~EUR 92) bundle (individual packs USD 29 / 49 / 19 / 49) | Ships a TypeScript MCP Server Starter Kit, Multi-Agent Workflow Templates, `CLAUDE.md Linter`, `Drift Detector`, and `Lean Mode`. | Focuses on starter templates and prompt/session hygiene; does not include a C4 architecture-as-code model, a 10-chapter architecture playbook with worked ADRs, or an OTel GenAI trace cost-per-accepted-outcome analyzer. |
| 5. GetAutopilotKit (Rules Pack) | `https://getautopilotkit.com/` | USD 79 (~EUR 73) one-time | Clean 14-file markdown rule set (`CLAUDE.md`, `AGENTS.md`, `skills/`) for coding agents across repositories. | Explicitly states *"This is rules and skills, not application code."* Contains no runnable MCP servers, no workflow code, no C4 models, and no cost or threat evaluator. |
| 6. AgentKitCo (AI Coding Agent Config Kit) | `https://agentkitco.com/products/agent-config-kit/` | USD 14 (~EUR 13) one-time | Low-cost 12-template stack configuration pack (`CLAUDE.md` / `.cursorrules`) across popular web frameworks. | Starter `[REPLACE ME]` configuration files for individual developers; does not provide worked architecture decisions, runnable servers, or multi-agent verification code. |

---

## 2. How this Playbook and Kit earns its position

- **Against books and free vendor guides (*AI Engineering*, Anthropic, OpenAI, OWASP):** Books and guides explain *what* to do; this kit gives the architect the **runnable artifacts** they have to hand to their team on Monday morning: a validated Structurizr C4 workspace (`18` elements, `16` relationships) + `4` Mermaid views, `10` accepted ADRs with `3` concrete rejected alternatives and unique consequences each, a working Streamable HTTP + STDIO MCP server (`reference-mcp-server.mjs`), and a trace-driven cost calculator (`evaluate-workbook.mjs`).
- **Against coding-agent config kits (ClaudeKit at USD 99, BuiltByZac at USD 99, GetAutopilotKit at USD 79, AgentKitCo at USD 14):** Those packs optimize a developer's coding-agent harness (primarily `.claude/`). This product is an **architecture design and runtime boundary kit** for the production agent system the team is building for its own users, spanning multiple model families and cloud runtimes.

---

## 3. Verifiable engineering commitments in this repository

1. **Full-depth 10-chapter Playbook (`playbook/chapters/01..10`):** Every chapter is written in full (`1,000+` non-code prose words each) with zero shared boilerplate paragraphs, pairing a formal pattern (`PAT-01..10`), an ADR (`ADR-0001..0010`), a concrete failure mode (`FM-01..10`), and a red-team checklist.
2. **MCP 2025-06-18 compliant reference server (`kit/mcp/reference-mcp-server.mjs`):** Fails closed on missing secrets (`E_SERVER_UNCONFIGURED`), serves a Streamable HTTP endpoint (`POST /mcp` + `GET /.well-known/oauth-protected-resource` RFC 9728 metadata + `401 WWW-Authenticate`), verifies OAuth 2.1 tokens using `RS256` against `jwks.keys` or `HS256` (checking `iss`, `nbf`, `exp`, RFC 8707 `aud`, and `scope`), enforces STDIO environment credentials (`E_STDIO_BEARER_FORBIDDEN`), exports `inputSchema` on every tool, and enforces stateful server-side `proposalId` approval (`propose_release_gate` -> `approve_release_gate`).
3. **Executable two-provider TypeScript supervisor & OTel cost ingester (`kit/workflows/supervisor-maker-checker.ts`, `kit/workbooks/evaluate-workbook.mjs`):** Enforces prefix-aware disjoint write paths, cross-family Maker/Checker isolation, and dispatch-time subagent recursion bans, dispatches across two provider families (with a dry-run fixture for CI), and computes cost per accepted outcome directly from OpenTelemetry GenAI span exports (`sample-otel-spans.json`).
