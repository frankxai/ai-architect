# Multi-cloud catalog candidate / 11 October 2026

State: working-source proposal stacked on the solution-atlas candidate. Accountable owner: Frank Riemer. No final-book, customer, deployment or credential gate is closed.

## What was added

Chapter 20, a seven-pattern catalog realized on six providers with a compiler and tests, three deploy templates that share one answer contract and a conformance suite, a Claude Code skill and command, and three read-only MCP catalog tools.

## Source inspection

| Source | Inspected support | Route | Limit |
|---|---|---|---|
| S53 Agent Platform name changes | Feature rename table | Search index of the official page | Page body not fetched from this environment |
| S54 Deploy to Cloudflare buttons | Subdirectory rule, provisioned resources | Cloudflare documentation search tool | No deploy performed |
| S55 Cloud Run Button | Parameters, app.json, hooks | Public repository README | No button run performed |
| S56 AI Gateway SDKs and APIs | Model strings, fallbacks, OIDC | Vercel documentation search tool | No gateway call performed |
| S57 Structurizr DSL | Workspace syntax | Validated by parsing with the published DSL library 6.2.3 | Rendering not checked |
| S58 AI Gateway Workers binding | env.AI.run with gateway ID | Cloudflare documentation search tool | No Workers AI call performed |

## Evidence

Engine `npm test` passed, including the catalog suite and the 24-case cross-runtime conformance suite. Template suites passed with installed SDKs: AI SDK 7.0.137 with a mock model, @google/genai 2.28.0 client construction, and a Cloudflare Worker bundled by wrangler 4.149.0 and served by the local Workers runtime in fixture mode. Generated Mermaid and Structurizr outputs were parsed by their real tools. A Docker daemon was not available, so the Cloud Run container build is unverified.

## Not established

No provider deployment, live model call, customer pilot, cost measurement or partner relationship. Scores are recorded judgement. The employer devendor rule holds: the public catalog names no employer.
