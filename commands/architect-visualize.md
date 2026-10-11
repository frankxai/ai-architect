---
description: Realize a catalog workload pattern on a chosen provider and write its views (Mermaid, sequence, C4/Structurizr, diagrams.net, React Flow, SVG) into docs/architecture/views/. Reads the catalog; writes only under docs/architecture/views/.
argument-hint: "<pattern-id> [provider] | --list"
---

# /architect-visualize

Produces customer-ready architecture views from the multi-cloud catalog. Arguments: `$ARGUMENTS`.
Load `${CLAUDE_PLUGIN_ROOT}/skills/architecture-studio/SKILL.md` before Step 1.

## Step 1: list or select

With `--list` or no argument, call the MCP tool `catalog_patterns` (or read
`${CLAUDE_PLUGIN_ROOT}/catalog/patterns/`) and print id, title, sophistication and the customer job.
Stop there.

Otherwise the first argument is a pattern id. If `docs/architecture/00-frame.md` exists, read its
customer job and accepted result and say in one line whether the pattern matches. If it does not,
stop and name the closest pattern instead of forcing a fit.

## Step 2: choose the provider with the customer's constraints

If a provider is given, use it. If not, read `docs/architecture/01-discovery.md` when present and
remove providers that fail a hard constraint (residency, identity estate, data rights, latency,
operating owner, budget). For the remaining providers call `catalog_realization` and show the six
scores with their rationale. Recommend one provider and say which constraint decided it. Never use a
provider's consumption drivers as a reason for the recommendation.

## Step 3: compile

```bash
node ${CLAUDE_PLUGIN_ROOT}/catalog/compile.mjs "$TMPDIR/ai-architect-views" --revision "$(git -C ${CLAUDE_PLUGIN_ROOT} rev-parse HEAD)"
```

If compilation fails because a source review date passed, report the source IDs and stop. Do not
edit dates to make it pass.

Copy only the chosen pattern's files into `docs/architecture/views/<pattern-id>/`:
`<provider>.mmd`, `<provider>.svg`, `<provider>.drawio`, `<provider>.reactflow.json`,
`journey.sequence.mmd` and `workspace.dsl`. If a target file exists, write `<name>.proposed.<ext>`
beside it instead of overwriting.

## Step 4: report

Print, in this order:

1. The realization headline and the services for each component.
2. `confirm_before_use`: every service in beta or named from an inferred rename.
3. The customer ledger from `economics`: monthly value, monthly cost including every attempt, cost
   per accepted result, and the basis sentence that says these are assumptions.
4. The provider ledger: consumption drivers, labelled as the provider's view.
5. The template deploy URL when one exists, with its evidence state and what is not verified.

State plainly that the views are designs. A view does not change any gate in
`architecture.json`; only the stage agents and `/architect-verify` do that.
