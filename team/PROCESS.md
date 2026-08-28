# AI Architect team process

How humans and agents run this plugin together. SOP.md still wins on conflict.

## Provide

| audience | install | first command |
|---|---|---|
| Claude Code | marketplace plugin `ai-architect` | `/architect-init` then `/architect` |
| Codex / GPT | clone or submodule; conductor CLI | `node scripts/architect-conductor.mjs --root . card` |
| Cursor / Copilot | `install-cross-harness.mjs --agents-md` | follow the AGENTS.md block |
| Hermes / MCP hosts | stdio `mcp/server.mjs` (local) | `architect_init` then `architect_card` |
| skills.sh | `skills/ai-architect/SKILL.md` | copy SOP + WORKFLOW, then run stages by hand |

No hosted architect service. Customer keys, customer repo.

## Lifecycle vs overlay

Nine lifecycle stages own `architecture.json`. Red, blue, and cloud are overlays.
They write sibling markdown. They do not add WORKFLOW.md rows.

```
frame → discover → flow → decide → cost → secure → prove → operate → verify
                                              ↘ /architect-red → /architect-blue
decide/cost ↘ /architect-cloud
```

## Who leads

| moment | lead | checker |
|---|---|---|
| irreversible decisions, trust, verify, red, cloud | opus-class | a different model |
| bounded artifacts (flows, evals, runbook, blue) | sonnet-class | opus on verify |
| mechanical routing | conductor / MCP | no model |

Maker and checker are different models. The verifier does not share the writer's context.

## State

`docs/architecture/architecture.json` is the only resumable state.
Conductor `card` is the dispatch ticket. Agents honor `write_paths` and `human_gates`.
A FAIL anywhere earlier blocks `--stage` jumps.

## Academy

Humans and agents learn the same contract in `frankxai/ai-architect-academy`.
The academy does not replace this plugin. It teaches adoption.

## Human gates (never agent)

publish · external_send · spend · dns · credentials · destructive · legal_ip · brand_identity
