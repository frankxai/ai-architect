// Vercel adapter for the ai-architect-answer/v1 contract.
// Model calls go through AI Gateway with the AI SDK. On Vercel the project's
// OIDC token authenticates the gateway; elsewhere set AI_GATEWAY_API_KEY.
import { answer, health } from './answer-core.mjs';
import corpus from './corpus.mjs';

export const RUNTIME = 'vercel-functions';
export const DEFAULT_MODEL = 'anthropic/claude-sonnet-5.5';
export const DEFAULT_FALLBACKS = ['anthropic/claude-sonnet-5', 'google/gemini-3.6-flash'];

export function settings(env = process.env) {
  const requested = (env.ANSWER_MODE ?? 'auto').toLowerCase();
  const credential = Boolean(env.AI_GATEWAY_API_KEY) || env.VERCEL === '1';
  const mode = requested === 'live' || (requested === 'auto' && credential) ? 'live' : 'fixture';
  const fallbacks = (env.AI_FALLBACK_MODELS ?? DEFAULT_FALLBACKS.join(',')).split(',').map(s => s.trim()).filter(Boolean);
  return { runtime: RUNTIME, mode, model: env.AI_MODEL || DEFAULT_MODEL, fallbacks, token: env.ANSWER_TOKEN || null };
}

export function gatewayGenerator(cfg, generateText) {
  return async ({ instructions, prompt, maxOutputTokens }) => {
    const generate = generateText ?? (await import('ai')).generateText;
    const result = await generate({
      model: cfg.model,
      instructions,
      prompt,
      maxOutputTokens,
      timeout: 20000,
      providerOptions: { gateway: { models: cfg.fallbacks } },
    });
    return { text: result.text, usage: { inputTokens: result.usage?.inputTokens, outputTokens: result.usage?.outputTokens } };
  };
}

const toResponse = r => new Response(JSON.stringify(r.body), { status: r.status, headers: r.headers });

export async function handleAnswer(request, { env = process.env, generateText } = {}) {
  const cfg = settings(env);
  const bodyText = request.method === 'POST' ? await request.text() : '';
  const result = await answer(
    { method: request.method, authorization: request.headers.get('authorization'), bodyText },
    { ...cfg, corpus, generate: gatewayGenerator(cfg, generateText), traceId: crypto.randomUUID(), now: () => performance.now() },
  );
  return toResponse(result);
}

export function handleHealth({ env = process.env } = {}) {
  return toResponse(health({ ...settings(env), corpus }));
}
