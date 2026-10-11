---
name: architecture-studio
description: Choose a workload pattern, realize it on Google Cloud, Vercel, Cloudflare, AWS, Azure or Railway, and produce exact views (React Flow, Mermaid, C4/Structurizr, diagrams.net, SVG) from one catalog. Use when an architect must compare providers for a customer, show the customer experience and team handoffs, weigh customer value against provider consumption, or hand over a one-click deployable starting point.
---

# Architecture studio

A customer conversation needs four things on one page: what the person sees, how the request moves, which provider service carries each step, and what it costs the customer per accepted result. Slides drift from each other. This skill keeps them as views of one catalog entry, so the screen mockup, the sequence, the C4 deployment view and the deploy button cannot disagree.

## Inputs

- `catalog/patterns/*.json`: seven provider-neutral workload patterns. Each has components with roles, typed flows with data classes, a request journey, team lanes, screens, evaluations, risks and a realization per provider.
- `catalog/providers.json`: provider stance, scoring criteria, consumption drivers and the default service for every role.
- `catalog/services.json`: the service registry with launch stage and how each name was verified.
- `catalog/sources.json`: dated sources. Compilation fails once a review date passes.

## Procedure

1. **Frame the job, not the provider.** Write the customer job, the baseline and the accepted result in the customer's words. Pick the pattern whose `customer_job` and `accepted_result` match; do not pick by technology. If none fits, write a new pattern file instead of bending one.
2. **Choose the least sophisticated form.** The pattern's `sophistication` (A0 to A4) is a ceiling, not a target. An A4 pattern carries an eval that must show coordination beats a simpler workflow; if the customer cannot run it, start at A2.
3. **Apply hard constraints before scores.** Residency, data rights, identity estate, latency, operating owner and budget remove providers outright. Only then compare the six criteria in `providers.json`. Scores are recorded judgement with a rationale; re-weight them with the customer, never for the provider.
4. **Read the two ledgers separately.** `economics.computed` is the customer ledger: value, every attempt's cost, cost per accepted result. `consumption_drivers` is the provider ledger: which meters grow. A provider's consumption opportunity is presented after the customer choice, never as a reason for it.
5. **Compile the views.** `node catalog/compile.mjs <empty-dir> --revision <sha>` writes per pattern and provider: React Flow JSON, Mermaid flowchart, diagrams.net XML and SVG, plus one Mermaid sequence of the journey and one Structurizr workspace with every provider as a deployment environment. All views share component and flow IDs.
6. **Check what to confirm.** Each realization lists `caution`: services in beta or whose name was inferred from a rename. Confirm those against current provider documentation before a customer sees them.
7. **Hand over a running slice.** Where a realization names a template, the catalog bundle carries its one-click deploy URL. The three templates implement one answer contract on Vercel, Cloudflare and Cloud Run and pass one conformance suite.

## Choosing the visual medium

| Need | Use | Never |
|---|---|---|
| Customer will read service names, data classes or icons | Compiled SVG or diagrams.net export | A generated image |
| Interactive walkthrough in a workshop | React Flow JSON in the Academy Studio | A static slide |
| Engineering review and versioned diagrams in Git | Structurizr DSL (C4 container and deployment views) and Mermaid | Hand-drawn boxes |
| Request journey and team handoffs | Mermaid sequence | A flowchart with numbered arrows |
| Customer moment, storyboard, proposal cover | Image recipes in the bundle (`image_recipes`), marked concept art | Labels or logos inside the generated image |

## Evidence rules

A compiled view is a design. It becomes `local-tested` only for a template that ran its tests, `provider-tested` only with a deployment receipt from the named provider, and `production-verified` only with an accepted customer journey and telemetry. A diagram never asserts its own success. Official Google Cloud icons appear only where their hash matches the registry; every other node uses an original role glyph.

## MCP

The plugin's MCP server exposes `catalog_patterns`, `catalog_realization` and `catalog_view`, so an agent can fetch a resolved realization or a view as text without compiling to disk.
