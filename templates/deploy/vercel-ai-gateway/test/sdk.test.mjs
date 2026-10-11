// Runs the adapter through the real AI SDK 7 generateText with a mock model,
// proving the option names (instructions, maxOutputTokens, timeout) and the
// usage mapping against the installed SDK, without a network call.
import test from 'node:test';
import assert from 'node:assert/strict';
import { generateText } from 'ai';
import { MockLanguageModelV4 } from 'ai/test';
import { handleAnswer } from '../lib/runtime.mjs';

const usage = { inputTokens: { total: 210, noCache: 210, cacheRead: 0, cacheWrite: 0 }, outputTokens: { total: 40, text: 40, reasoning: 0 } };

test('real generateText receives instructions and the token cap', async () => {
  const model = new MockLanguageModelV4({
    doGenerate: { content: [{ type: 'text', text: 'Compile exact diagrams from the specification [P6].' }], finishReason: { unified: 'stop', raw: 'stop' }, usage, warnings: [] },
  });
  const viaMock = args => generateText({ ...args, model, providerOptions: undefined });
  const res = await handleAnswer(
    new Request('https://example.test/v1/answer', { method: 'POST', body: JSON.stringify({ question: 'Can a generated image be my architecture diagram?' }) }),
    { env: { ANSWER_MODE: 'live' }, generateText: viaMock },
  );
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.refused, false);
  assert.equal(body.citations[0].id, 'P6');
  assert.deepEqual(body.usage, { input_tokens: 210, output_tokens: 40 });
  const call = model.doGenerateCalls[0];
  assert.equal(call.maxOutputTokens, 600);
  assert.equal(call.prompt[0].role, 'system');
  assert.match(call.prompt[0].content, /only the numbered passages/);
});

test('health reports fixture mode without a gateway credential', async () => {
  const { handleHealth } = await import('../lib/runtime.mjs');
  const body = await handleHealth({ env: {} }).json();
  assert.deepEqual([body.mode, body.model, body.contract], ['fixture', null, 'ai-architect-answer/v1']);
});
