# Request-scoped agent surface

The experience plane: a short HTTP request, streamed tokens, a human who can
interrupt. This kit does **not** run an eleven-minute loop. It accepts a goal,
enqueues work on the durable worker, and streams status.

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

This directory is a contract and a deploy shape, not a second Next.js app.
Point `WORKER_URL` at the worker and use any request-scoped host.

```bash
# example: curl the worker through this sidecar
WORKER_URL=http://127.0.0.1:8080 node src/proxy.js
```

## Deploy

Vercel (or any Node host) for this process. Railway for the worker.
One-click buttons on frankx.ai should clone **both**, not pretend one platform
owns the loop.
