---
name: cloud-harness
description: Use during /architect-cloud. Compare clouds and agent harnesses with evidence. Never provision, never crown a vendor without a price row or a file in the repo.
---

# Cloud and harness choice

This skill is an overlay. It does not add a WORKFLOW.md stage.

## Rule

A cloud or harness is MADE only with:

- a file in this repository (`vercel.json`, `railway.toml`, IaC, Dockerfile), or
- a `prices.json` row with `source_url` and `retrieved_at`

Otherwise OPEN, with a dated deferral cost. `[unknown]` beats a slogan.

## Clouds to consider (not a ranking)

AWS Bedrock, Azure OpenAI, GCP Vertex, Vercel, Railway, plus any regional
generative-AI API the repo already uses. Ask region, who holds keys, data
residency, spend gate, rollback.

## How this team is provided to people

| path | for | mechanism |
|---|---|---|
| Claude Code plugin | interactive lifecycle | `/plugin marketplace add` then `/architect` |
| skills.sh pack | one-skill install | `skills/ai-architect/SKILL.md` |
| Conductor CLI | Codex / any CLI | `node scripts/architect-conductor.mjs card` |
| MCP stdio | Hermes and other MCP hosts | `mcp/server.mjs` local only |
| AGENTS.md block | Cursor, Copilot, Windsurf | `install-cross-harness.mjs --agents-md` |

Do not stand up a hosted architect agent. Customer keys stay with the customer.

## Human gates

provision, spend, dns, credentials remain operator actions.
