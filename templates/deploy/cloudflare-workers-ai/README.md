# Grounded answers on Cloudflare Workers

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https%3A%2F%2Fgithub.com%2Ffrankxai%2Fai-architect%2Ftree%2Fmain%2Ftemplates%2Fdeploy%2Fcloudflare-workers-ai)

The `ai-architect-answer/v1` contract on a Worker. The model is `@cf/meta/llama-3.3-70b-instruct-fp8-fast` on Workers AI, called through the AI binding and routed through AI Gateway (`default` gateway, created on first use). No provider key lives in the Worker. The page in `public/` is served as static assets.

## What happens when you click deploy

Cloudflare clones this directory into a new repository, provisions the Workers AI binding, builds with Workers Builds and deploys. Every push to the new repository redeploys; pull requests get preview URLs. Workers AI usage is billed to the deploying account.

## Configuration (`wrangler.jsonc` vars)

| Variable | Default | Purpose |
|---|---|---|
| `AI_MODEL` | `@cf/meta/llama-3.3-70b-instruct-fp8-fast` | Workers AI model ID; vendor models can route through the same binding and AI Gateway |
| `AI_GATEWAY_ID` | `default` | AI Gateway used for logs, caching and rate limits |
| `ANSWER_MODE` | `auto` | `live` when the AI binding exists, else `fixture` |
| `ANSWER_TOKEN` | unset (secret) | When set, `/v1/answer` requires a bearer token |

## Local

```bash
npm ci
npm test                 # adapter tests with a fake AI binding
npm run check            # wrangler bundle, no deploy
npx wrangler dev         # needs a Cloudflare login: the AI binding runs remotely
```

`src/worker.mjs` only exports the handler. Keep it that way: workerd rejects an entry module that exports constants, which a unit test cannot catch but a local `wrangler dev` run does.

## Evidence state

Local-tested: conformance suite, adapter tests, a `wrangler deploy --dry-run` bundle (11.3 KiB) and a local workerd run in fixture mode that served the page, health, cited answers, refusal, 404 and 413. Not yet provider-tested: no deployment receipt or live Workers AI call exists for this template.
