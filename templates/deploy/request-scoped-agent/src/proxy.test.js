import http from 'node:http';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from './proxy.js';
import { createServer as createWorker } from '../../durable-worker/src/server.js';

async function listen(server, t) {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => {
    server.close(resolve);
    server.closeAllConnections();
  }));
  return `http://127.0.0.1:${server.address().port}`;
}

const workerToken = 'worker-test-secret';
const accessToken = 'proxy-test-secret';
const auth = { authorization: `Bearer ${accessToken}` };

test('proxy creates a job and polls it through authenticated worker boundary', async (t) => {
  const workerUrl = await listen(createWorker({ token: workerToken }), t);
  const proxy = await listen(createServer({ workerUrl, workerToken, accessToken }), t);
  assert.equal((await fetch(`${proxy}/jobs`, { method: 'POST', body: '{}' })).status, 401);
  const created = await fetch(`${proxy}/jobs`, { method: 'POST', headers: auth, body: JSON.stringify({ goal: 'one bounded outcome' }) });
  assert.equal(created.status, 202);
  const job = await created.json();
  const status = await fetch(`${proxy}/jobs/${job.id}`, { headers: auth });
  assert.equal(status.status, 200);
  assert.equal((await status.json()).status, 'queued');
  assert.equal((await fetch(`${proxy}/tick`, { method: 'POST', headers: auth })).status, 404);
  assert.equal((await fetch(`${proxy}/jobs`, { method: 'POST', headers: auth, body: 'x'.repeat(65537) })).status, 413);
  const health = JSON.stringify(await (await fetch(`${proxy}/health`)).json());
  assert.equal(health.includes(workerUrl), false);
  assert.equal(health.includes(workerToken), false);
});

test('worker authentication failures return a bounded gateway error', async (t) => {
  const workerUrl = await listen(createWorker({ token: workerToken }), t);
  const proxy = await listen(createServer({ workerUrl, workerToken: 'wrong-token', accessToken }), t);
  const response = await fetch(`${proxy}/jobs`, { method: 'POST', headers: auth, body: '{}' });
  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), { error: 'worker authentication failed' });
});

test('slow workers time out and proxy continues serving health', async (t) => {
  const workerUrl = await listen(http.createServer(() => {}), t);
  const proxy = await listen(createServer({ workerUrl, workerToken, accessToken, timeoutMs: 30 }), t);
  const response = await fetch(`${proxy}/jobs`, { method: 'POST', headers: auth, body: '{}' });
  assert.equal(response.status, 504);
  assert.equal((await fetch(`${proxy}/health`)).status, 200);
});

test('missing credentials and unsafe worker URLs fail closed', async (t) => {
  const unconfigured = await listen(createServer({ workerUrl: '', workerToken: '', accessToken: '' }), t);
  assert.equal((await fetch(`${unconfigured}/jobs`, { method: 'POST', headers: auth, body: '{}' })).status, 503);
  const unsafe = await listen(createServer({ workerUrl: 'file:///tmp/worker', workerToken, accessToken }), t);
  assert.equal((await fetch(`${unsafe}/jobs`, { method: 'POST', headers: auth, body: '{}' })).status, 503);
});
