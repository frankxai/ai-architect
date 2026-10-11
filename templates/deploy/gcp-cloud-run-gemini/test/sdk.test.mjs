// Proves the installed @google/genai accepts the adapter's client options and
// exposes the call surface it uses. Live calls need Google credentials and are
// out of scope for this offline test.
import test from 'node:test';
import assert from 'node:assert/strict';
import { GoogleGenAI } from '@google/genai';
import { createServer, settings } from '../server.mjs';

test('Agent Platform client constructs with the adapter options', () => {
  const ai = new GoogleGenAI({ enterprise: true, project: 'demo-project', location: 'global' });
  assert.equal(typeof ai.models.generateContent, 'function');
});

test('server serves the page and health in fixture mode', async () => {
  const cfg = await settings({});
  const server = createServer({ cfg });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const page = await fetch(base + '/');
    assert.equal(page.status, 200);
    assert.match(page.headers.get('content-security-policy'), /frame-ancestors 'none'/);
    assert.match(await page.text(), /Grounded answers/);
    const health = await (await fetch(base + '/health')).json();
    assert.deepEqual([health.mode, health.runtime], ['fixture', 'google-cloud-run']);
    assert.equal((await fetch(base + '/missing')).status, 404);
  } finally { server.close(); }
});
