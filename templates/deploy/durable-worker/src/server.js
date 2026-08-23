import http from 'node:http';
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

export function createServer() {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

    if (req.method === 'GET' && url.pathname === '/health') {
      return json(res, 200, { ok: true, plane: 'run' });
    }

    if (req.method === 'POST' && url.pathname === '/jobs') {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      let body = {};
      try {
        body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
      } catch {
        return json(res, 400, { error: 'invalid json' });
      }
      if (!body.goal || typeof body.goal !== 'string') {
        return json(res, 400, { error: 'goal required' });
      }
      const job = enqueue(body.goal);
      return json(res, 202, job);
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
  });
}

if (process.argv[1] && process.argv[1].endsWith('server.js')) {
  createServer().listen(PORT, () => {
    process.stdout.write(`durable-worker listening on ${PORT}\n`);
  });
}
