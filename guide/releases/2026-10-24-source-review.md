# Partial source review, 2026-10-24

The twenty-eight sources whose review deadline was 2026-10-15 or 2026-10-18 were reopened and read using public primary documentation on 2026-10-24. This closes their expired-date maintenance task and updates Appendix A and claim C052 where vendor catalogs changed. It does not close any final-edition review gate. Sources outside this set retain their prior access dates.

| Source | Observation from inspected primary documentation on 2026-10-24 | Next review |
|---|---|---|
| [S01](https://developers.openai.com/api/docs/models) | Featured text models remain GPT-6 Astra (`gpt-6-astra`, $10/$50 per MTok, 1.05M context, 128K max output), GPT-6.1 Sol (`gpt-6.1-sol`, $2/$10 per MTok, 1.05M context, 128K max output), and GPT-6 Luna (`gpt-6-luna`, $0.10/$0.50 per MTok, 1.05M context, 128K max output). | 2026-11-15 |
| [S02](https://platform.claude.com/docs/en/models/overview) | Current lineup table lists `claude-fable-5-1` ($10/$50), `claude-opus-5-5` ($4/$20), `claude-sonnet-5-5` ($2/$10), and `claude-haiku-5-5` (from $0.10 input / from $0.50 output per MTok, 1M context, 128K max output), replacing `claude-haiku-4-5-20251001`. | 2026-11-15 |
| [S03](https://ai.google.dev/gemini-api/docs/models) | Catalog now lists Gemini 4 Argon (`gemini-4-argon`) alongside Gemini 3.8 Flash (`gemini-3.8-flash`) and Live/TTS variants, while `gemini-3.1-pro-preview` remains in preview. | 2026-11-15 |
| [S04](https://docs.x.ai/developers/models) | Flagship text row remains `grok-4.7` at $2.00 input and $6.00 output per MTok, 500K context window, and May 2026 knowledge cutoff. | 2026-11-15 |
| [S13](https://developers.openai.com/api/docs/guides/evaluation-best-practices) | Continues to document eval-driven development, production-shaped datasets, and human calibration. | 2026-11-15 |
| [S14](https://developers.openai.com/api/docs/guides/agent-evals) | Continues to document trace grading across model calls, tool invocations, guardrails, and handoffs. | 2026-11-15 |
| [S20](https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai) | States general application on 2 August 2026, GPAI application from 2 August 2025, and high-risk transition dates (2 December 2027 for Annex III and 2 August 2028 for Annex I). | 2026-11-15 |
| [S22](https://www.nist.gov/artificial-intelligence/ai-agent-standards-initiative) | Continues to list industry standards, open protocols, agent identity, and security evaluation as active pillars. | 2026-11-15 |
| [S28](https://kubernetes.io/blog/2026/03/20/running-agents-on-kubernetes-with-agent-sandbox/) | Continues to describe the in-development Agent Sandbox controller for stateful isolated agent pods. | 2026-11-15 |
| [S29](https://kubernetes.io/blog/2026/03/09/announcing-ai-gateway-wg/) | Continues to describe active AI Gateway Working Group work on inference, MCP, and agent traffic routing. | 2026-11-15 |
| [S30](https://kubernetes.io/blog/2025/06/05/introducing-gateway-api-inference-extension/) | Continues to document model-aware routing and `InferencePool` resources. | 2026-11-15 |
| [S38](https://digital-strategy.ec.europa.eu/en/policies/contents-code-gpai) | Documents the three GPAI Code of Practice chapters (Transparency, Copyright, and Safety and Security for systemic-risk models under Article 55). | 2026-11-15 |
| [S39](https://digital-strategy.ec.europa.eu/en/library/draft-commission-guidelines-classification-high-risk-ai-systems) | Presents the 19 May 2026 publication as draft Commission guidelines on Article 6 high-risk AI classification. | 2026-11-15 |
| [S41](https://aaif.io/blog/a2a-joins-aaif) | Continues to distinguish AGENTS.md, runtimes, MCP, gateways, and A2A 1.0 interoperability. | 2026-11-15 |
| [S42](https://cloud.google.com/icons) through [S58](https://developers.cloudflare.com/ai-gateway/usage/worker-binding-methods/) | Re-read S42, S43, S44, S45, S46, S47, S48, S49, S50, S51, S52, S56, and S58; cloud icon sets, Cloud Run AI docs, OpenAI image tool/deprecation dates (1 December 2026 for `chatgpt-image-latest`), Vercel Workflow/Sandbox/AI Gateway OIDC docs, DTCG 2025.10, Canva REST APIs, WCAG 2.2, Core Web Vitals, and Cloudflare AI Gateway worker bindings match claims C064 to C077 and C084. | 2026-11-15 |

Corrections applied from this inspection: C052 and Appendix A now record `claude-haiku-5-5` (from USD 0.10 input and USD 0.50 output per million tokens, 1M context, 128K max output) in place of `claude-haiku-4-5-20251001`, and Appendix A notes `gemini-4-argon` on the Google Gemini API models page. All other reviewed claims (C001, C002, C020, C021, C026, C027, C035, C036, C040, C041, C043, C045 to C051, C053, C064 to C077, and C084) still match their primary sources.

No model was called during this review. Documentary inspection does not establish account availability, live runtime performance, or final human publication sign-off.
