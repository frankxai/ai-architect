# Multi-cloud architecture catalog

Seven workload patterns, each realized on Google Cloud, Vercel, Cloudflare, AWS, Azure and Railway, compiled into views an architect can put in front of a customer and an engineer can open in their own tools. Prepared 11 October 2026. Designs, not deployments: no realization here carries a provider receipt.

| Pattern | Sophistication | Customer job |
|---|---|---|
| [Grounded research desk](patterns/grounded-research-desk.json) | A1 | A defensible answer from governed documents, or a plain refusal |
| [Support resolution agent](patterns/support-resolution-agent.json) | A3 | Order, refund or account problems solved in one contact, within written authority |
| [Document intake pipeline](patterns/document-intake-pipeline.json) | A2 | Invoices and claims posted once as validated records; exceptions reach a person |
| [Agentic operations workflow](patterns/agentic-operations-workflow.json) | A4 | A purchase request moved to an approved order by coordinated specialists |
| [Enterprise MCP tool hub](patterns/enterprise-mcp-tool-hub.json) | A2 | Company tools for Claude and other agents behind scopes, consent and audit |
| [In-product copilot](patterns/in-product-copilot.json) | A2 | Help inside a SaaS product, isolated per tenant and metered per tenant |
| [AI governance plane](patterns/ai-governance-plane.json) | A0 | One gateway, budget ledger and release gate for every AI workload |

## How it is built

- `roles.json`: 25 provider-neutral roles in five layers, each with an original glyph.
- `providers.json`: provider stance, the six scoring criteria, consumption drivers and the default service for every role.
- `services.json`: the service registry. Each entry records launch stage and how its name was verified (`source`, `prior` or `inferred`).
- `sources.json`: dated sources. Compilation fails once a review date passes; re-read the source, do not move the date.
- `patterns/*.json`: components on a grid, typed flows with data classes, the request journey, team lanes, screens, evaluations, risks, illustrative economics and one realization per provider with scores and a rationale.
- `templates.json`: the one-click templates that implement the [answer contract](../templates/deploy/answer-core/README.md).

## Compile

```bash
node catalog/compile.mjs /tmp/catalog-out --revision "$(git rev-parse HEAD)"
node --test catalog/compile.test.mjs
```

Output per pattern: `<provider>.reactflow.json`, `<provider>.mmd`, `<provider>.drawio`, `<provider>.svg` for every provider, plus `journey.sequence.mmd` and `workspace.dsl` (Structurizr, every provider as a deployment environment). `catalog.json` is the resolved bundle the Academy Studio renders; `llms.txt` is a plain-text summary; `manifest.json` hashes every file.

The views were validated with the tools that consume them on 11 October 2026: all 49 Mermaid flowcharts and 7 sequence diagrams parse and render in Mermaid 12.1.0, all 7 workspaces parse with the Structurizr DSL 6.2.3 library, and every diagrams.net file, SVG and React Flow document is well-formed with no dangling edge.

## Rules the compiler enforces

- A realization may bind a component only to its own provider's services or to a portable service.
- The request journey must cover every flow; every component must carry a flow.
- Scores are integers from 1 to 5 with a written rationale. They are judgement, not benchmarks, and a provider's consumption opportunity never changes them.
- Economics charge cost to every attempt and report cost per accepted result. Every pattern states that its figures are assumptions.
- Official Google Cloud icons appear only for Google services and only when the icon file matches its recorded hash. Other nodes use role glyphs. Download hosts for further official icon sets were blocked from the build environment; add icons by downloading them from cloud.google.com/icons and recording their hashes in `solution-kit/icons/registry.json`.
- Screen fixtures may not use a percent sign, so illustrative numbers cannot be read as measurements.

## Claude Code and MCP

`skills/architecture-studio/SKILL.md` teaches the method; `/architect-visualize <pattern> [provider]` writes the chosen views into a customer's `docs/architecture/views/`; the MCP server exposes `catalog_patterns`, `catalog_realization` and `catalog_view`.

Licensing: original catalog content is Apache-2.0 with the repository. Provider names are trademarks of their owners and do not imply partnership. Google Cloud icons remain Google property and are excluded from the Apache grant.
