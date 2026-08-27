# Durable worker plane

A long-running process, a queue, a database. This is the "where does an
eleven-minute run live" decision, encoded as a Railway service instead of a
slide.

The web request that started the job is not this service. Put the experience
plane on a request-scoped host (`templates/deploy/request-scoped-agent`) and
hand work to this worker over HTTP.

## What is decided

| decision | how this kit settles it |
|---|---|
| model call seam | `src/model.js` is the only module that imports a provider SDK |
| loop shape | fixed workflow in `src/jobs.js` — named steps, a budget, an exit |
| trust boundary | tool results enter as `{ kind: 'data', text }` and never as system text |
| long-run home | this process. No serverless timeout. |

## Run locally

```bash
node src/server.js
```

`GET /health` → `{ ok: true }`
`POST /jobs` `{ "goal": "..." }` → enqueues a bounded job
`GET /jobs/:id` → status

## Deploy on Railway

Human action: create a Railway template from this directory in the dashboard,
then publish it if you want marketplace kickback. This repo does not publish
templates for you.

Required variables:

- `MODEL_API_KEY` — the one provider this kit talks to
- `DATABASE_URL` — Postgres
- `REDIS_URL` — optional; in-memory queue if unset

## Affiliate / kickback

Railway pays template authors a usage kickback on published marketplace
templates. Linking the button from frankx.ai is the distribution path. Creating
the template in a Railway workspace is founder-gated.
