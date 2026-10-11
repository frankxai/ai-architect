// Worker routing and binding use, with a fake AI binding and asset fetcher.
import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/worker.mjs';
import { settings, DEFAULT_MODEL } from '../src/adapter.mjs';

test('routes health, answer and assets', async () => {
  const assets = { fetch: async req => new Response(`asset:${new URL(req.url).pathname}`) };
  const env = { ASSETS: assets };
  const health = await (await worker.fetch(new Request('https://w.test/health'), env)).json();
  assert.deepEqual([health.mode, health.runtime], ['fixture', 'cloudflare-workers']);
  assert.equal(await (await worker.fetch(new Request('https://w.test/'), env)).text(), 'asset:/');
  assert.equal((await worker.fetch(new Request('https://w.test/v1/answer'), env)).status, 405);
});

test('live mode sends a gateway-routed call to the configured model', async () => {
  const seen = [];
  const env = { AI: { run: async (...a) => { seen.push(a); return { response: 'Promote only measured artifacts [P10].' }; } } };
  const res = await worker.fetch(new Request('https://w.test/v1/answer', { method: 'POST', body: JSON.stringify({ question: 'What evidence do I need before promotion?' }) }), env);
  const body = await res.json();
  assert.equal(body.citations[0].id, 'P10');
  assert.equal(seen[0][0], DEFAULT_MODEL);
  assert.deepEqual(seen[0][2], { gateway: { id: 'default' } });
  assert.equal(settings({ ANSWER_MODE: 'fixture', AI: {} }).mode, 'fixture');
});
