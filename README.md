# AI Architect

A gated architecture lifecycle for systems that call a language model.

Install it into the coding agent that already has the repository open. `/architect`
runs a nine-stage team. Each stage writes files under `docs/architecture/`. Each
stage has a gate. A red gate stops the run. An independent verifier re-derives
every evidence pointer in a fresh context.

It runs on your keys. There is no hosted agent and no account.

Maintained at [frankx.ai/ai-architect](https://www.frankx.ai/ai-architect).

## Install

### Claude Code

```bash
# from this repository, as a local marketplace
claude plugin marketplace add .
claude plugin install ai-architect
```

Or clone into a project and point Claude at the directory. The plugin manifest
is `.claude-plugin/plugin.json`.

### Cursor / Codex / any AGENTS.md harness

```bash
node scripts/install-cross-harness.mjs --cursor --agents-md --target /path/to/your/repo
```

`--cursor` writes one rule file per skill. `--agents-md` inserts a marked block
into `AGENTS.md` and leaves the rest of that file alone.

### Review skill only

If you want the four-decision review and not the lifecycle team, copy
`skills/ai-architect-review/SKILL.md` to `.claude/skills/ai-architect-review/SKILL.md`.
The same file is served at `https://www.frankx.ai/skills/ai-architect-review/SKILL.md`.

## What `/architect` writes

| stage | agent | output |
|---|---|---|
| frame | discovery-analyst | `00-frame.md` |
| discover | discovery-analyst | `01-discovery.md` |
| flow | experience-designer | `02-user-flows.md`, `03-experience-blueprint.md` |
| decide | principal-architect | `SYSTEM.md`, `adr/*`, `architecture.json` |
| cost | economics-analyst | `04-roi.md`, `prices.json` |
| secure | trust-reviewer | `05-trust-boundary.md` |
| prove | eval-engineer | `06-evals/cases.jsonl`, `06-evals/rubric.md` |
| operate | delivery-engineer | `WORKFLOW.md`, `SOP.md`, `07-runbook.md` |
| verify | independent-verifier | `receipts/<date>-verify.md`, `review.md` |

The router is re-entrant. Run `/architect` again after a stop. Use
`/architect --stage decide` to redo one stage. Use `/architect-verify` in a
fresh context — that is the point of a separate command.

Agents do not write application source code. If a file already exists they write
`<name>.proposed.md` beside it.

## Local MCP (optional)

A rubric is a file. MCP starts earning its complexity when the reviewer needs to
read the repository and carry gate state across calls. The optional stdio server
exposes those checks. It does not call a model and it does not leave the machine.

```bash
node mcp/server.mjs
```

Tools: `architect_status`, `architect_check_artifacts`, `architect_check_roi`,
`architect_next_stage`. Configure it in your harness as a local stdio server.

## One-click deploy kits

Reference stacks live under `templates/deploy/`. They encode the four decisions
as code, not as a slide.

| kit | plane it owns | deploy |
|---|---|---|
| `durable-worker` | long-run home | Railway worker + Postgres + Redis |
| `request-scoped-agent` | experience | Vercel (or any Node host) in front of the worker |

Publishing a Railway template to the marketplace (and earning kickback) is a
human action in the Railway dashboard. The kit is the source. The button is not
this repository pretending to be your Railway account.

## Related

- Field guide: [frankx.ai/ai-architecture](https://www.frankx.ai/ai-architecture)
- Academy labs: [github.com/frankxai/ai-architect-academy](https://github.com/frankxai/ai-architect-academy)
- CoE operating model: [github.com/frankxai/ai-coe](https://github.com/frankxai/ai-coe)

This repository used to be a single-cloud command center. That tree is preserved
at a legacy tag on this remote. The current tree is vendor-neutral on purpose.

## Verify

```bash
npm test
```

MIT. Frank Riemer / FrankX.
