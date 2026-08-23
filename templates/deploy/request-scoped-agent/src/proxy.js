import http from 'node:http';

const PORT = Number(process.env.PORT || 3000);
const WORKER_URL = process.env.WORKER_URL || 'http://127.0.0.1:8080';

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload),
  });
  res.end(payload);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  if (req.method === 'GET' && url.pathname === '/health') {
    return json(res, 200, { ok: true, plane: 'experience', worker: WORKER_URL });
  }
  if (req.method === 'POST' && url.pathname === '/jobs') {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const upstream = await fetch(`${WORKER_URL}/jobs`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: Buffer.concat(chunks),
    });
    const text = await upstream.text();
    res.writeHead(upstream.status, { 'content-type': 'application/json; charset=utf-8' });
    res.end(text);
    return;
  }
  return json(res, 404, { error: 'not found' });
});

if (process.argv[1] && process.argv[1].endsWith('proxy.js')) {
  server.listen(PORT, () => {
    process.stdout.write(`experience proxy listening on ${PORT} → ${WORKER_URL}\n`);
  });
}

export { server };
