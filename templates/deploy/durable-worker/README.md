# Durable worker plane

A bounded dry-run lab for the run plane. The name identifies the intended
deployment shape; the included queue is an in-memory Map and array. Jobs are
lost on process restart. No database, Redis integration, live model, or recovery
protocol is implemented in this kit.

The web request that started the job is not this service. Put the experience
plane on a request-scoped host (`templates/deploy/request-scoped-agent`) and
hand work to this worker over HTTP.

## What is decided

| decision | how this kit settles it |
|---|---|
| model call seam | `src/model.js` is the only module that imports a provider SDK |
| loop shape | fixed workflow in `src/jobs.js` — named steps, a budget, an exit |
| trust boundary | mocked retrieval is labelled `{ kind: 'data', text }`; this alone does not enforce model instruction handling |
| long-run home | this process. No serverless timeout. |

## Run locally

```bash
WORKER_SHARED_TOKEN=local-worker-test-token node src/server.js
```

`GET /health` → `{ ok: true }`
`POST /jobs` `{ "goal": "..." }` → enqueues a bounded dry-run job
`GET /jobs/:id` → status, including `queued`, `running`, `done`, or `failed`
`POST /tick` → processes one queued job; only an authenticated operator calls it

All job and tick routes require `Authorization: Bearer <WORKER_SHARED_TOKEN>`.
Without a configured token they fail closed. Health reports the dry-run and
memory storage mode. Requests are limited to 64 KiB and goals to 8000 characters.
The lab retains at most 1000 jobs and may evict terminal jobs. This bearer token
defines one trusted tenant boundary; it is not per-user authorization.

## Deploy on Railway

Human action: create a Railway template from this directory in the dashboard,
then publish it if you want marketplace kickback. This repo does not publish
templates for you.

Select `templates/deploy/durable-worker` as the service root. Required variable:
`WORKER_SHARED_TOKEN`, generated privately for this tenant. Use a long random
value for a cloud installation. The proxy receives the same worker token.

Leave `MODEL_API_KEY` unset. Setting it currently produces a terminal failed
job because the live adapter is intentionally unwired. `DATABASE_URL` and
`REDIS_URL` have no consumer here; adding them does not create persistence.

Before selling this as an operated stack, replace the in-memory queue with
durable storage and leases, wire the model seam, test restart recovery and
idempotency, and add operator telemetry. The proxy only creates and polls jobs;
there is no automatic scheduler or streaming implementation in this lab.

## Affiliate / kickback

The [Railway template program](https://docs.railway.com/templates) links its
current kickback terms. Confirm eligibility and current terms before calculating
revenue. These local tests neither publish a template nor prove earned income.
