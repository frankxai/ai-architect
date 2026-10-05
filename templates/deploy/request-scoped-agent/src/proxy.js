import http from 'node:http';
import { timingSafeEqual } from 'node:crypto';

const MAX_BODY_BYTES = 64 * 1024;

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload),
    'cache-control': 'no-store',
  });
  res.end(payload);
}

function authorized(req, token) {
  if (typeof token !== 'string' || !token) return false;
  const supplied = Buffer.from(req.headers.authorization || '');
  const expected = Buffer.from(`Bearer ${token}`);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export function createHandler({
  workerUrl = process.env.WORKER_URL,
  workerToken = process.env.WORKER_SHARED_TOKEN,
  accessToken = process.env.PROXY_ACCESS_TOKEN,
  timeoutMs = 5000,
} = {}) {
  return async (req, res) => {
    try {
      const url = new URL(req.url || '/', 'http://localhost');
      if (req.method === 'GET' && url.pathname === '/health') {
        return json(res, 200, { ok: true, plane: 'experience', mode: 'dry-run' });
      }
      if (!workerUrl || !workerToken || !accessToken) {
        return json(res, 503, { error: 'proxy not configured' });
      }
      if (!authorized(req, accessToken)) return json(res, 401, { error: 'unauthorized' });
      const create = req.method === 'POST' && url.pathname === '/jobs';
      const status = req.method === 'GET' && /^\/jobs\/job_\d+$/.test(url.pathname);
      if (!create && !status) return json(res, 404, { error: 'not found' });

      let base;
      try {
        base = new URL(workerUrl);
        if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password
          || base.pathname !== '/' || base.search || base.hash) throw new Error('invalid URL');
      } catch {
        return json(res, 503, { error: 'proxy not configured' });
      }
      let body;
      if (create) {
        const chunks = [];
        let size = 0;
        for await (const chunk of req) {
          size += chunk.length;
          if (size <= MAX_BODY_BYTES) chunks.push(chunk);
        }
        if (size > MAX_BODY_BYTES) return json(res, 413, { error: 'body too large' });
        body = Buffer.concat(chunks);
      }
      const upstream = await fetch(new URL(url.pathname, base), {
        method: req.method,
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${workerToken}`,
        },
        body,
        redirect: 'error',
        signal: AbortSignal.timeout(timeoutMs),
      });
      const text = await upstream.text();
      if (upstream.status === 401 || upstream.status === 403) {
        return json(res, 502, { error: 'worker authentication failed' });
      }
      res.writeHead(upstream.status, {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      });
      res.end(text);
    } catch (error) {
      if (!res.headersSent) {
        json(res, error.name === 'TimeoutError' || error.name === 'AbortError' ? 504 : 502,
          { error: 'worker unavailable' });
      } else res.end();
    }
  };
}

export function createServer(options) {
  const server = http.createServer(createHandler(options));
  server.requestTimeout = 15000;
  return server;
}
