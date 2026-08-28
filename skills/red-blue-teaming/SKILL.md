---
name: red-blue-teaming
description: Use during /architect-red and /architect-blue. Attack evidence, trust, cost, and human-gate bypass; then map each finding to a fail-closed control. Never edit the files under attack.
---

# Red / blue teaming

Red team and blue team are **overlays**. They are not extra rows in WORKFLOW.md.
The nine-stage lifecycle still owns `architecture.json`. These two files sit beside it.

## Red (attack)

Four probes, each with an evidence pointer or ABSENT:

1. Fake evidence — a PASS/MADE claim whose pointer does not contain the claim.
2. Instruction smuggling — T3 tool/retrieved text in the instruction position.
3. Cost inflation — a number not in `prices.json` and not arithmetic over those rows.
4. Human-gate bypass — a runbook step that publishes, spends, or rotates credentials.

Do not exploit production. Do not rotate secrets. Do not send external messages.
Write `docs/architecture/red-team.md` only.

## Blue (defend)

For each red finding: control, owner, detection command, residual human gate.
Prefer an existing lifecycle gate over a new one.
Write `docs/architecture/blue-team.md` only.

## Independence

Red does not write blue. Blue does not rewrite red. Verifier may re-derive both.
