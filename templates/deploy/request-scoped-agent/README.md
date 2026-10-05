# Request-scoped agent surface

The experience plane: a short authenticated HTTP request. This dry-run lab
creates a job on the worker and exposes status polling. There is no token
streaming, cancellation, live model adapter, or end-user tenancy in this kit.

## Pairing

Deploy this next to `templates/deploy/durable-worker`.

```
browser  →  this service (request-scoped)
                 │
                 └── POST /jobs  →  durable-worker
```

## Decisions this kit does not make

Model seam, trust boundary, and long-run home belong to the worker. If you put
a provider SDK import in this service, the first review check fails on purpose.

## Local

Use Node 22 or later. Run the worker in one terminal with
`WORKER_SHARED_TOKEN=local-worker-test-token`. In another, start this surface:

```bash
WORKER_URL=http://127.0.0.1:8080 \
WORKER_SHARED_TOKEN=local-worker-test-token \
PROXY_ACCESS_TOKEN=local-proxy-test-token node src/server.js
```

## Deploy

`POST /jobs` with `{ "goal": "..." }` creates a job. `GET /jobs/:id` polls it.
Both require `Authorization: Bearer <PROXY_ACCESS_TOKEN>`. The proxy supplies
the worker's separate token only on its server-to-server request. Keep both
tokens in private server configuration; do not embed them in a public website.
An unauthenticated public health response reveals no worker URL or credentials.

The proxy refuses an unset configuration, caps request bodies at 64 KiB,
disables upstream redirects, and limits each worker call to five seconds. A
failed upstream call returns 502 or 504 without killing the process. `/tick`
remains an operator-only worker endpoint and is never proxied.

## Deploy

Select this directory as the Vercel project root and configure `WORKER_URL`,
`WORKER_SHARED_TOKEN`, and `PROXY_ACCESS_TOKEN` as private environment variables.
`src/server.js` is the recognized Node server entrypoint; `package.json` selects
ES modules. There is no rewrite to a missing API file.

The [Vercel Node runtime documentation](https://vercel.com/docs/functions/runtimes/node-js),
read on 2026-10-05, describes detection of `src/server.js` with `server.listen()`.
Local tests verify HTTP behavior; they do not prove a cloud deployment. Deploy
the worker separately, then smoke-test authentication, job creation, status,
operator execution, and failure handling in the actual tenant.
