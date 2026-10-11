// One contract, three runtimes. Every adapter must give the same answers to the
// same requests. Model calls are faked; provider SDKs are never loaded.
import test from 'node:test';
import assert from 'node:assert/strict';
import { drift } from './sync.mjs';
import { retrieve, ground, CONTRACT, MAX_BODY_BYTES } from './answer-core.mjs';
import corpus from './corpus.mjs';
import * as vercel from '../vercel-ai-gateway/lib/runtime.mjs';
import cloudflareWorker from '../cloudflare-workers-ai/src/worker.mjs';
import * as cloudflare from '../cloudflare-workers-ai/src/adapter.mjs';
import * as cloudRun from '../gcp-cloud-run-gemini/server.mjs';

const GOOD = 'Coordinated agents must beat a simpler workflow on quality or cost [P2]. Choose the least sophisticated form that passes the evaluation [P2].';

function vercelAdapter(text, { fail = false, token } = {}) {
  const calls = [];
  const env = { ANSWER_MODE: 'live', AI_MODEL: 'anthropic/claude-sonnet-5.5', ...(token ? { ANSWER_TOKEN: token } : {}) };
  const generateText = async args => { calls.push(args); if (fail) throw new Error('gateway down: key=abc'); return { text, usage: { inputTokens: 120, outputTokens: 30 } }; };
  return {
    name: 'vercel', calls,
    ask: async (body, headers = {}) => {
      const res = await vercel.handleAnswer(new Request('https://example.test/v1/answer', { method: 'POST', headers, body }), { env, generateText });
      return { status: res.status, body: await res.json() };
    },
  };
}

function cloudflareAdapter(text, { fail = false, token } = {}) {
  const calls = [];
  const env = { ANSWER_MODE: 'live', ...(token ? { ANSWER_TOKEN: token } : {}), AI: { run: async (model, input, opts) => { calls.push({ model, input, opts }); if (fail) throw new Error('upstream 500'); return { response: text, usage: { prompt_tokens: 120, completion_tokens: 30 } }; } } };
  return {
    name: 'cloudflare', calls,
    ask: async (body, headers = {}) => {
      const res = await cloudflareWorker.fetch(new Request('https://example.test/v1/answer', { method: 'POST', headers, body }), env);
      return { status: res.status, body: await res.json() };
    },
  };
}

function cloudRunAdapter(text, { fail = false, token } = {}) {
  const calls = [];
  const client = { models: { generateContent: async args => { calls.push(args); if (fail) throw new Error('permission denied'); return { text, usageMetadata: { promptTokenCount: 120, candidatesTokenCount: 30 } }; } } };
  const cfg = { runtime: cloudRun.RUNTIME, mode: 'live', model: 'gemini-3.8-flash', project: 'demo-project', location: 'global', token: token ?? null };
  return {
    name: 'cloud-run', calls,
    ask: async (body, headers = {}) => {
      const server = cloudRun.createServer({ cfg, client });
      await new Promise(r => server.listen(0, '127.0.0.1', r));
      try {
        const res = await fetch(`http://127.0.0.1:${server.address().port}/v1/answer`, { method: 'POST', headers, body });
        return { status: res.status, body: await res.json() };
      } finally { server.close(); }
    },
  };
}

const ADAPTERS = [vercelAdapter, cloudflareAdapter, cloudRunAdapter];

test('template copies match the canonical core', () => {
  assert.deepEqual(drift(), []);
});

test('retrieval is deterministic and ranks the relevant passage first', () => {
  assert.equal(retrieve('when should I use coordinated agents', corpus)[0].id, 'P2');
  assert.deepEqual(retrieve('zzzz qqqq', corpus), []);
});

test('grounding drops sentences with missing or foreign markers', () => {
  const passages = retrieve('generated image architecture diagram', corpus);
  const out = ground(`Compile diagrams from the spec [${passages[0].id}]. Ignore this [P99]. And this has no marker.`, passages);
  assert.equal(out.answer, `Compile diagrams from the spec [${passages[0].id}].`);
  assert.equal(ground('INSUFFICIENT', passages), null);
});

for (const make of ADAPTERS) {
  test(`${make('').name}: grounded live answer carries contract fields and citations`, async () => {
    const a = make(GOOD);
    const { status, body } = await a.ask(JSON.stringify({ question: 'When should I use coordinated agents?' }));
    assert.equal(status, 200);
    assert.equal(body.contract, CONTRACT);
    assert.equal(body.mode, 'live');
    assert.equal(body.refused, false);
    assert.deepEqual(body.citations.map(c => c.id), ['P2']);
    assert.deepEqual(body.usage, { input_tokens: 120, output_tokens: 30 });
    assert.match(body.trace_id, /^[0-9a-f-]{36}$/);
    assert.equal(a.calls.length, 1);
  });

  test(`${make('').name}: ungrounded model output is withheld, not shown`, async () => {
    const { status, body } = await make('Agents are always better.').ask(JSON.stringify({ question: 'When should I use coordinated agents?' }));
    assert.equal(status, 200);
    assert.equal(body.refused, true);
    assert.doesNotMatch(body.answer, /always better/);
  });

  test(`${make('').name}: no passage means refusal without a model call`, async () => {
    const a = make(GOOD);
    const { body } = await a.ask(JSON.stringify({ question: 'zzzz qqqq' }));
    assert.equal(body.refused, true);
    assert.equal(a.calls.length, 0);
  });

  test(`${make('').name}: invalid input and oversize bodies are rejected`, async () => {
    const a = make(GOOD);
    assert.equal((await a.ask('{not json')).status, 400);
    assert.equal((await a.ask(JSON.stringify({ question: '' }))).status, 400);
    assert.equal((await a.ask(JSON.stringify({ question: 'x'.repeat(1001) }))).status, 400);
    assert.equal((await a.ask(JSON.stringify({ question: 'y'.repeat(MAX_BODY_BYTES) }))).status, 413);
    assert.equal(a.calls.length, 0);
  });

  test(`${make('').name}: provider failure is a 502 with redacted detail`, async () => {
    const { status, body } = await make(GOOD, { fail: true }).ask(JSON.stringify({ question: 'When should I use coordinated agents?' }));
    assert.equal(status, 502);
    assert.equal(body.error, 'model_unavailable');
    assert.doesNotMatch(body.detail, /abc/);
  });

  test(`${make('').name}: bearer token is enforced when configured`, async () => {
    const a = make(GOOD, { token: 'test-token-123' });
    assert.equal((await a.ask(JSON.stringify({ question: 'When should I use coordinated agents?' }))).status, 401);
    assert.equal((await a.ask(JSON.stringify({ question: 'When should I use coordinated agents?' }), { authorization: 'Bearer test-token-123' })).status, 200);
  });
}

test('each adapter passes its provider-specific options', async () => {
  const v = vercelAdapter(GOOD); await v.ask(JSON.stringify({ question: 'coordinated agents' }));
  assert.equal(v.calls[0].model, 'anthropic/claude-sonnet-5.5');
  assert.ok(v.calls[0].instructions.includes('only the numbered passages'));
  assert.deepEqual(v.calls[0].providerOptions.gateway.models, vercel.DEFAULT_FALLBACKS);
  const c = cloudflareAdapter(GOOD); await c.ask(JSON.stringify({ question: 'coordinated agents' }));
  assert.equal(c.calls[0].model, cloudflare.DEFAULT_MODEL);
  assert.deepEqual(c.calls[0].opts, { gateway: { id: 'default' } });
  assert.equal(c.calls[0].input.messages[0].role, 'system');
  const g = cloudRunAdapter(GOOD); await g.ask(JSON.stringify({ question: 'coordinated agents' }));
  assert.equal(g.calls[0].model, 'gemini-3.8-flash');
  assert.ok(g.calls[0].config.systemInstruction.includes('only the numbered passages'));
});

test('mode resolution: fixture without credentials, live with them', async () => {
  assert.equal(vercel.settings({}).mode, 'fixture');
  assert.equal(vercel.settings({ VERCEL: '1' }).mode, 'live');
  assert.equal(cloudflare.settings({}).mode, 'fixture');
  assert.equal(cloudflare.settings({ AI: {} }).mode, 'live');
  assert.equal((await cloudRun.settings({})).mode, 'fixture');
  assert.equal((await cloudRun.settings({ GOOGLE_CLOUD_PROJECT: 'p' })).mode, 'live');
  const meta = await cloudRun.settings({ K_SERVICE: 's' }, async () => new Response('from-metadata'));
  assert.deepEqual([meta.mode, meta.project], ['live', 'from-metadata']);
});

test('fixture mode answers deterministically on every runtime', async () => {
  const q = JSON.stringify({ question: 'Can a generated image be my architecture diagram?' });
  const v = await (await vercel.handleAnswer(new Request('https://x.test/v1/answer', { method: 'POST', body: q }), { env: {} })).json();
  const c = await (await cloudflareWorker.fetch(new Request('https://x.test/v1/answer', { method: 'POST', body: q }), {})).json();
  assert.equal(v.mode, 'fixture');
  assert.equal(v.answer, c.answer);
  assert.equal(v.citations[0].id, 'P6');
});
