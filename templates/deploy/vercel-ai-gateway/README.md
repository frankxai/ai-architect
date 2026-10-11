# Grounded answers on Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Ffrankxai%2Fai-architect%2Ftree%2Fmain%2Ftemplates%2Fdeploy%2Fvercel-ai-gateway&project-name=vercel-ai-gateway&repository-name=vercel-ai-gateway)

A small, complete service for the `ai-architect-answer/v1` contract: Vercel Functions (Fluid compute), AI SDK 7 and AI Gateway. It answers only from a bundled corpus, cites every sentence, and withholds anything it cannot ground. The same contract runs on [Cloudflare](../cloudflare-workers-ai) and [Cloud Run](../gcp-cloud-run-gemini); one [conformance suite](../answer-core/conformance.test.mjs) proves all three behave the same.

## What happens when you click deploy

1. Vercel clones this directory into a new repository and deploys it with no build step: `public/` is served, `api/` becomes functions.
2. On Vercel the function authenticates to AI Gateway with the project's OIDC token, so no model key is stored. Outside Vercel, set `AI_GATEWAY_API_KEY`.
3. Open the deployment, ask a question, check `/health` for `mode: live`.

AI Gateway usage is billed to the Vercel team that deploys it.

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `AI_MODEL` | `anthropic/claude-sonnet-5.5` | Primary gateway model string |
| `AI_FALLBACK_MODELS` | `anthropic/claude-sonnet-5,google/gemini-3.6-flash` | Ordered fallbacks applied by the gateway |
| `ANSWER_MODE` | `auto` | `live`, `fixture` (deterministic, no model) or `auto` |
| `ANSWER_TOKEN` | unset | When set, `/v1/answer` requires `Authorization: Bearer <token>` |
| `AI_GATEWAY_API_KEY` | unset | Only needed off Vercel |

## Contract

`POST /v1/answer` with `{"question": "..."}` returns `answer`, `citations[]`, `refused`, `mode`, `model`, `usage`, `latency_ms` and `trace_id`. Errors: 400 invalid input, 401 missing token, 405 wrong method, 413 body over 8 KiB, 502 model unavailable (detail redacted). `GET /health` reports runtime and mode.

## Local

```bash
npm ci
npm test                       # real AI SDK with a mock model; no network
```

## Evidence state

Local-tested: the adapter passes the shared conformance suite and runs through the real AI SDK 7 `generateText` with a mock model. Not yet provider-tested: no deployment receipt exists for this template. Replace the bundled corpus with your own index before any real use; keyword retrieval is a demonstration, not a search engine.
