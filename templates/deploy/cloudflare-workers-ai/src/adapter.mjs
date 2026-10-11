// Cloudflare adapter for the ai-architect-answer/v1 contract.
// Workers AI runs the model through the AI binding and AI Gateway; no provider
// key lives in the Worker. Kept out of worker.mjs because workerd treats every
// named export of the entry module as an entrypoint.
import { answer, health } from './answer-core.mjs';
import corpus from './corpus.mjs';

export const RUNTIME = 'cloudflare-workers';
export const DEFAULT_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

export function settings(env = {}) {
  const requested = String(env.ANSWER_MODE ?? 'auto').toLowerCase();
  const mode = requested === 'live' || (requested === 'auto' && Boolean(env.AI)) ? 'live' : 'fixture';
  return { runtime: RUNTIME, mode, model: env.AI_MODEL || DEFAULT_MODEL, gateway: env.AI_GATEWAY_ID || 'default', token: env.ANSWER_TOKEN || null };
}

export function workersAiGenerator(env, cfg) {
  return async ({ instructions, prompt, maxOutputTokens }) => {
    if (!env.AI) throw new Error('AI binding is not configured');
    const out = await env.AI.run(
      cfg.model,
      { messages: [{ role: 'system', content: instructions }, { role: 'user', content: prompt }], max_tokens: maxOutputTokens },
      { gateway: { id: cfg.gateway } },
    );
    const text = typeof out?.response === 'string' ? out.response : out?.choices?.[0]?.message?.content ?? '';
    return { text, usage: { inputTokens: out?.usage?.prompt_tokens, outputTokens: out?.usage?.completion_tokens } };
  };
}

const toResponse = r => new Response(JSON.stringify(r.body), { status: r.status, headers: r.headers });

export async function route(request, env) {
  const { pathname } = new URL(request.url);
  const cfg = settings(env);
  if (pathname === '/health') return toResponse(health({ ...cfg, corpus }));
  if (pathname === '/v1/answer') {
    const bodyText = request.method === 'POST' ? await request.text() : '';
    return toResponse(await answer(
      { method: request.method, authorization: request.headers.get('authorization'), bodyText },
      { ...cfg, corpus, generate: workersAiGenerator(env, cfg), traceId: crypto.randomUUID(), now: () => Date.now() },
    ));
  }
  if (env.ASSETS) return env.ASSETS.fetch(request);
  return toResponse({ status: 404, headers: { 'content-type': 'application/json; charset=utf-8' }, body: { error: 'not_found' } });
}
