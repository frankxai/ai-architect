# Answer core: one contract, three runtimes

`answer-core.mjs` defines `ai-architect-answer/v1`: retrieve passages, ask the model to write only from them, keep sentences with valid passage markers, refuse otherwise. `corpus.mjs` is the bundled demonstration corpus and `index.html` the shared page.

Each deploy template carries a byte-identical copy because one-click deploy flows build a single directory:

| Template | Runtime | Model path |
|---|---|---|
| [vercel-ai-gateway](../vercel-ai-gateway) | Vercel Functions | AI SDK 7 through AI Gateway (OIDC on Vercel) |
| [cloudflare-workers-ai](../cloudflare-workers-ai) | Cloudflare Workers | Workers AI binding through AI Gateway |
| [gcp-cloud-run-gemini](../gcp-cloud-run-gemini) | Cloud Run | Gemini on Agent Platform via `@google/genai` |

Edit the files here, then:

```bash
node templates/deploy/answer-core/sync.mjs          # copy into every template
node templates/deploy/answer-core/sync.mjs --check  # CI: fail on drift
node --test templates/deploy/answer-core/conformance.test.mjs
```

The conformance suite runs the same requests against all three adapters with faked model calls and checks status codes, contract fields, grounding, refusal, token enforcement, oversize bodies and redacted provider errors. It never loads a provider SDK, so it runs in the repository's root `npm test` without installing template dependencies.
