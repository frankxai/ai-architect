import http from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { enqueue, getJob, processNext } from './jobs.js';

const PORT = Number(process.env.PORT || 8080);

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload),
  });
  res.end(payload);
}

const MAX_BODY_BYTES = 64 * 1024;

function authorized(req, token) {
  if (typeof token !== 'string' || !token) return false;
  const supplied = Buffer.from(req.headers.authorization || '');
  const expected = Buffer.from(`Bearer ${token}`);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export function createServer({ token = process.env.WORKER_SHARED_TOKEN } = {}) {
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url || '/', 'http://localhost');

      if (req.method === 'GET' && url.pathname === '/health') {
        return json(res, 200, { ok: true, plane: 'run', mode: 'dry-run', persistence: 'memory' });
      }

      if (!token) return json(res, 503, { error: 'worker not configured' });
      if (!authorized(req, token)) return json(res, 401, { error: 'unauthorized' });

      if (req.method === 'POST' && url.pathname === '/jobs') {
        const chunks = [];
        let size = 0;
        for await (const chunk of req) {
          size += chunk.length;
          if (size <= MAX_BODY_BYTES) chunks.push(chunk);
        }
        if (size > MAX_BODY_BYTES) return json(res, 413, { error: 'body too large' });
        let body;
        try {
          body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
        } catch {
          return json(res, 400, { error: 'invalid json' });
        }
        if (!body || typeof body !== 'object' || Array.isArray(body)
          || typeof body.goal !== 'string' || !body.goal.trim() || body.goal.length > 8000) {
          return json(res, 400, { error: 'goal must be a nonempty string of at most 8000 characters' });
        }
        try {
          return json(res, 202, enqueue(body.goal.trim()));
        } catch (error) {
          if (error.code === 'QUEUE_CAPACITY') return json(res, 503, { error: 'queue capacity reached' });
          throw error;
        }
      }

      if (req.method === 'GET' && url.pathname.startsWith('/jobs/')) {
        const id = url.pathname.slice('/jobs/'.length);
        const job = getJob(id);
        if (!job) return json(res, 404, { error: 'not found' });
        return json(res, 200, job);
      }

      if (req.method === 'POST' && url.pathname === '/tick') {
        const result = await processNext();
        return json(res, 200, result);
      }

      return json(res, 404, { error: 'not found' });
    } catch {
      if (!res.headersSent) json(res, 500, { error: 'worker request failed' });
      else res.end();
    }
  });
  server.requestTimeout = 15000;
  return server;
}

if (process.argv[1] && process.argv[1].endsWith('server.js')) {
  createServer().listen(PORT, () => {
    process.stdout.write(`durable-worker listening on ${PORT}\n`);
  });
}
