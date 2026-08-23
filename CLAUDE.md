# CLAUDE.md — AI Architect

This is the AI Architect plugin repository itself, not a customer's `docs/architecture/` output.

- Full operating instructions for the nine-stage lifecycle are in `AGENTS.md` — read that first.
- The `/architect*` commands live in `commands/`; `/architect` is the router, the rest run one
  stage each. Each command loads `SOP.md` before doing anything else (`templates/SOP.md` here,
  or a customer's `docs/architecture/SOP.md` once one exists — that copy wins if the two
  disagree).
- No agent in this workflow writes application source code. Every agent writes only inside
  `docs/architecture/`, and only the files listed in its own `Write scope` section in
  `agents/<id>.md`. If you are asked to implement the design this repo produces, that is a
  different task in a different repository — say so rather than doing it here.
- `npm test` runs the plugin's own gates (manifest validation, skill parity, devendor audit,
  ROI honesty, evals). Run it before claiming a change works. The artifact contract gate
  (`npm run artifacts`) is a separate script, not part of `npm test` — run it on its own when
  checking a `docs/architecture/` output tree.
