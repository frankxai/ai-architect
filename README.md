# AI Architect

A gated architecture lifecycle for systems that call a language model.

Install it into the coding agent that already has the repository open. `/architect`
runs a nine-stage team. Each stage writes files under `docs/architecture/`. Each
stage has a gate. A red gate stops the run. An independent verifier re-derives
every evidence pointer in a fresh context.

It runs on your keys. There is no hosted agent and no account.

Maintained at [frankx.ai/ai-architect](https://www.frankx.ai/ai-architect).

## Install

Four paths in, depending on your harness. Every one of them runs on your own model keys,
inside your own repository — there is no hosted agent and no account.

### Claude Code

```
/plugin marketplace add frankxai/ai-architect
/plugin install ai-architect@frankx
```

### Codex, Cursor, Gemini CLI — the skills registry

```bash
npx skills add frankxai/ai-architect
```

### Cursor — the full team, as project rules

```bash
node scripts/install-cross-harness.mjs --cursor
```

Run from a clone of this repository. Writes one `.cursor/rules/ai-architect-<skill>.mdc` per
skill in `skills/`, pointing at that skill's `SKILL.md` and the `/architect` stage it serves.

### Codex, Windsurf, Copilot — the full team, via AGENTS.md

```bash
node scripts/install-cross-harness.mjs --agents-md --target /path/to/your/repo
```

Inserts a marked block into that repository's `AGENTS.md` with the install commands and a
pointer to `SOP.md`, and leaves the rest of the file alone. This repository's own `AGENTS.md`
is what a harness with no slash commands reads to run a stage by hand.

### Conductor (Codex / Claude / any CLI)

Slash commands still run the team inside Claude Code. The conductor is the
mechanical router for every other harness: it parses `WORKFLOW.md`, finds the
next incomplete gate, and prints a dispatch card. It does not call a model.

```bash
node scripts/architect-conductor.mjs --root /path/to/your/repo init
node scripts/architect-conductor.mjs --root /path/to/your/repo next
node scripts/architect-conductor.mjs --root /path/to/your/repo card
node scripts/architect-conductor.mjs --root /path/to/your/repo check
```

`card` names the stage, agent, model (`opus` or `sonnet`), reasoning effort, and
the write paths under `docs/architecture/`. Sonnet cards default to Codex;
opus cards default to Claude. A red previous gate exits 2. A goal mismatch
exits 3. Dispatch stays opt-in — this CLI prints JSON only.

Overlays (not extra WORKFLOW rows): `/architect-red`, `/architect-blue`,
`/architect-cloud`. Process: `team/PROCESS.md`. skills.sh pack:
`skills/ai-architect/SKILL.md`. Local MCP adds `architect_init` and
`architect_card` (no model calls).

### Review skill only, no install

If you want the four-decision review and not the full lifecycle team, copy
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

## The artifact contract

Everything `/architect` writes lands under `<your repo>/docs/architecture/`, in this shape:

```
SYSTEM.md                  boundary · seven planes with owners · four decisions with verdict + evidence pointer
WORKFLOW.md                stage table (stage · agent · input · output · gate) — /architect parses this for stage order
SOP.md                     model routing · write scopes · stop conditions · human gates · escalation — every command loads this first
00-frame.md                one-sentence outcome, named non-goals, kill criterion
01-discovery.md            the discovery question bank, answered
02-user-flows.md           each flow: happy path, failure branch, human step
03-experience-blueprint.md Stage | Human | AI/Agents | Systems, covering every stage in the flows
04-roi.md                  the cost model, arithmetic over prices.json only
prices.json                { schema, rows: [{ item, unit, unit_price, currency, source_url, retrieved_at, notes }] }
05-trust-boundary.md       the retrieval trace, trust tiers, irreversible tools and their human gates
06-evals/cases.jsonl       one JSON line per case: { id, kind, input, expect, must_not }
06-evals/rubric.md         how each case is graded
07-runbook.md              operator commands, dry-run status, rollback, owner
adr/ADR-0001-<slug>.md     one ADR per decision that changed state, numbered upward
architecture.json          { schema, generated_at, goal, decisions, planes, gates, artifacts } — the resumable run state
receipts/<YYYY-MM-DD>-verify.md   the independent verifier's re-derivation, dated
review.md                  the verifier's findings
```

Rules: an existing file is never overwritten — the agent writes `<name>.proposed.md` beside it
and says so. Every generated markdown file ends with the line
`Generated by AI Architect · https://www.frankx.ai/ai-architect`. An evidence pointer is either
`path/to/file.ts:L42` or a fenced command together with its observed output.

## The team

| agent | model | writes |
|---|---|---|
| discovery-analyst | sonnet | `00-frame.md`, `01-discovery.md` |
| experience-designer | sonnet | `02-user-flows.md`, `03-experience-blueprint.md` |
| principal-architect | opus | `SYSTEM.md`, `adr/*`, `architecture.json` |
| economics-analyst | sonnet | `04-roi.md`, `prices.json` |
| trust-reviewer | opus | `05-trust-boundary.md` |
| eval-engineer | sonnet | `06-evals/*` |
| delivery-engineer | sonnet | `WORKFLOW.md`, `SOP.md`, `07-runbook.md` |
| independent-verifier | opus | `receipts/*`, `review.md` — holds no `Edit`/`Write`/`MultiEdit`/`NotebookEdit`; writes only via shell redirection |

No agent writes application source code. Each agent's full purpose, inputs, stop conditions and
handoff target are in its own `agents/<id>.md`. The same roster, generated from those files, is
`data/team.json` (`node scripts/build-team-json.mjs` rebuilds it — never hand-edit the JSON).

## The gates

| gate | stage | green when |
|---|---|---|
| `gate.frame` | frame | a one-sentence outcome, named non-goals, a falsifiable kill criterion |
| `gate.discovery` | discover | at least one answered question per bank section; zero `[assumed]` tags (`[unknown]` is allowed) |
| `gate.flow` | flow | every flow has a failure branch and a human step; the experience blueprint covers every stage |
| `gate.decisions` | decide | four decisions each `MADE` or `OPEN` with an evidence pointer; every `OPEN` carries a dated deferral cost; every plane has an owner |
| `gate.economics` | cost | every price row has `source_url` and `retrieved_at` within 90 days; a sensitivity band on three drivers; no `IRR` |
| `gate.trust` | secure | retrieved text traced to the line where it becomes labelled data; every irreversible tool gated by a human step |
| `gate.evals` | prove | at least 10 cases, at least one refusal case, at least one injection case; the harness runs; the injection case fails closed |
| `gate.operate` | operate | every runbook command exists and dry-runs exit 0; rollback and owner named |
| `gate.verify` | verify | a receipt written by the verifier in a fresh context; every evidence pointer re-derived |

A stage is complete when its gate is `PASS` in `architecture.json`, or `SKIPPED` with a written
reason. `FAIL`, or absent from the gates map, means the stage has not run. When more than one
gate is red, `/architect` names the highest-reversal-cost one first; within `gate.decisions`,
the fix-first order among `OPEN` decisions is `trust`, `run`, `loop`, `model`.

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
