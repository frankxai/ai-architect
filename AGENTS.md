# AGENTS.md — AI Architect

This is the entry point for Codex, Windsurf, or any harness that reads `AGENTS.md` instead of
Claude Code's `/plugin` mechanism. If you are Claude Code, use `.claude-plugin/plugin.json`
and the `commands/` directory instead — this file still applies, but the slash commands are
the faster path.

## What this is

A gated architecture lifecycle for systems that call a language model. `/architect` (or, in
a harness without slash commands, a human or agent reading this file) runs nine stages inside
the **customer's own repository** and writes an evidence-backed artifact set to
`docs/architecture/`. It runs on the customer's own model keys. There is no hosted service, no
account, and no multi-tenant backend — the coding agent that already has the repository open
is the runtime.

No agent in this workflow writes application source code. Every agent writes only inside
`docs/architecture/`, and only the files listed for it. See `SOP.md` (below) for the full write
scope table.

## The nine stages

| id | stage | agent | writes | gate |
|---|---|---|---|---|
| 1 | frame | discovery-analyst | `00-frame.md` | `gate.frame` |
| 2 | discover | discovery-analyst | `01-discovery.md` | `gate.discovery` |
| 3 | flow | experience-designer | `02-user-flows.md`, `03-experience-blueprint.md` | `gate.flow` |
| 4 | decide | principal-architect | `SYSTEM.md`, `adr/*`, `architecture.json` | `gate.decisions` |
| 5 | cost | economics-analyst | `04-roi.md`, `prices.json` | `gate.economics` |
| 6 | secure | trust-reviewer | `05-trust-boundary.md` | `gate.trust` |
| 7 | prove | eval-engineer | `06-evals/cases.jsonl`, `06-evals/rubric.md` | `gate.evals` |
| 8 | operate | delivery-engineer | `WORKFLOW.md`, `SOP.md`, `07-runbook.md` | `gate.operate` |
| 9 | verify | independent-verifier | `receipts/<date>-verify.md`, `review.md` | `gate.verify` |

Each stage has exactly one gate. A red gate stops the run at that stage — later stages do not
start on top of a red gate. The full stage table (with each stage's required input files) lives
in `templates/WORKFLOW.md`, and gets copied to `docs/architecture/WORKFLOW.md` by the `operate`
stage. `/architect` parses that file's `## Stage table` rather than hardcoding the stage list,
so a customer can add a stage by adding a row.

## Where SOP.md lives

The standing operating procedure — model routing, write scopes, stop conditions, human gates,
and escalation — is `templates/SOP.md` in this repository. On a customer's first run it is
copied, unedited, to `docs/architecture/SOP.md`, and every stage after that reads the copy in
the customer's repo, not the template. If `docs/architecture/SOP.md` and any other instruction
disagree, `SOP.md` wins.

Read `templates/SOP.md` before running any stage. It defines:

- which work runs on opus (judgment: decisions, trust boundary, verification), which on sonnet
  (build: discovery, flows, economics, evals, runbook), and which is mechanical
- the write-scope table (agent → files it may write → everything else it must not)
- the eight human gates that no agent in this workflow ever crosses on its own: `publish`,
  `external_send`, `spend`, `dns`, `credentials`, `destructive`, `legal_ip`, `brand_identity`
- the escalation table: who a stuck stage reports to, and with what

## Running a stage without slash commands

A harness without `/architect*` commands can still run the lifecycle by hand:

1. Read `templates/SOP.md` (or `docs/architecture/SOP.md` if it already exists in the target
   repository — that copy wins).
2. Read `templates/WORKFLOW.md` (or `docs/architecture/WORKFLOW.md` if present) and parse the
   `## Stage table`. Find the first stage whose gate is not `PASS` or `SKIPPED` (with a reason)
   in `docs/architecture/architecture.json` — if that file does not exist yet, the next stage is
   the first row.
3. Before running that stage, confirm the gate of the stage *before* it is not `FAIL`. If it is,
   stop and name the fix-first gate instead of proceeding.
4. Open `agents/<stage-agent>.md` for the stage you are about to run (the agent id is the
   `agent` column of the stage row, e.g. `discovery-analyst`). Read its `Purpose`, `Inputs`,
   `Outputs`, `Write scope`, `Stop conditions`, and `Procedure` sections in full, then follow
   them as your own instructions for this turn — read the required input files, do the
   procedure, and write only the files listed in its `Write scope`. Stop immediately if any of
   its stop conditions is met; stopping and reporting the reason is a correct outcome, not a
   failure.
5. Check what you wrote against the gate's green condition (`templates/WORKFLOW.md`'s
   `## Gate table`, reproduced in the brief above) yourself — an agent's own claim that a gate
   passed is not the gate result.
6. Update `docs/architecture/architecture.json`: set `gates["<gate.id>"].status` to `PASS` or
   `FAIL`, record the evidence pointers you actually checked, add any new file to `artifacts`,
   and leave `verified_by` as `null` (only the `verify` stage sets that, and only to
   `independent-verifier`).
7. Report the stage, the gate result, the files written, and the next stage — one stage per
   turn. Never overwrite a file that already exists; write `<name>.proposed.md` beside it and
   say so.

Machine-readable equivalents of the same checks live in `scripts/` (`check-artifacts.mjs`,
`check-roi.mjs`) and can be run directly: `node scripts/check-artifacts.mjs path/to/docs/architecture`.

## Everything else about this repository

`agents/` — the eight stage agents, each a self-contained instruction file (frontmatter +
purpose + inputs + outputs + write scope + stop conditions + procedure + handoff).
`commands/` — the `/architect*` slash commands (Claude Code only).
`skills/` — reference material the agents load: the review rubric, discovery question bank,
ROI model, trust-boundary method, eval-harness method, ADR template, and six architecture-shape
references.
`schemas/` — the JSON Schemas for `architecture.json`, `prices.json`, and the eval cases file.
`templates/` — the blank artifact templates written into a customer's `docs/architecture/`.
`data/team.json` — the machine-readable team roster, generated from `agents/*.md` by
`node scripts/build-team-json.mjs`; do not hand-edit it.
`scripts/` — the gate checks and install tooling; `npm test` runs the full set.
`examples/` — dogfooded, worked artifact sets for reference.
