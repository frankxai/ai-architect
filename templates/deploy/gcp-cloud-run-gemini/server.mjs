// Cloud Run adapter for the ai-architect-answer/v1 contract.
// Gemini runs on Gemini Enterprise Agent Platform through @google/genai with
// the service account's Application Default Credentials; no API key is stored.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { answer, health, MAX_BODY_BYTES } from './src/answer-core.mjs';
import corpus from './src/corpus.mjs';

export const RUNTIME = 'google-cloud-run';
export const DEFAULT_MODEL = 'gemini-3.8-flash';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const METADATA = 'http://metadata.google.internal/computeMetadata/v1/project/project-id';

export async function settings(env = process.env, fetchImpl = fetch) {
  const requested = (env.ANSWER_MODE ?? 'auto').toLowerCase();
  let project = env.GOOGLE_CLOUD_PROJECT || null;
  if (!project && env.K_SERVICE && requested !== 'fixture') {
    try {
      const res = await fetchImpl(METADATA, { headers: { 'Metadata-Flavor': 'Google' }, signal: AbortSignal.timeout(1500) });
      if (res.ok) project = (await res.text()).trim() || null;
    } catch { project = null; }
  }
  const mode = requested === 'live' || (requested === 'auto' && project) ? 'live' : 'fixture';
  return { runtime: RUNTIME, mode, model: env.GEMINI_MODEL || DEFAULT_MODEL, project, location: env.GOOGLE_CLOUD_LOCATION || 'global', token: env.ANSWER_TOKEN || null };
}

export function geminiGenerator(cfg, client) {
  let ai = client ?? null;
  return async ({ instructions, prompt, maxOutputTokens }) => {
    if (!cfg.project) throw new Error('No Google Cloud project resolved; set GOOGLE_CLOUD_PROJECT');
    if (!ai) {
      const { GoogleGenAI } = await import('@google/genai');
      ai = new GoogleGenAI({ enterprise: true, project: cfg.project, location: cfg.location });
    }
    const res = await ai.models.generateContent({
      model: cfg.model,
      contents: prompt,
      config: { systemInstruction: instructions, maxOutputTokens, abortSignal: AbortSignal.timeout(20000) },
    });
    return { text: res.text ?? '', usage: { inputTokens: res.usageMetadata?.promptTokenCount, outputTokens: res.usageMetadata?.candidatesTokenCount } };
  };
}

const PAGE_HEADERS = {
  'content-type': 'text/html; charset=utf-8',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'content-security-policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'",
};

function send(res, { status, headers, body }) {
  const payload = typeof body === 'string' ? body : JSON.stringify(body);
  res.writeHead(status, { ...headers, 'content-length': Buffer.byteLength(payload) });
  res.end(payload);
}

export function createServer({ cfg, client } = {}) {
  const generate = geminiGenerator(cfg, client);
  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', 'http://localhost');
      if (req.method === 'GET' && url.pathname === '/health') return send(res, health({ ...cfg, corpus }));
      if (url.pathname === '/v1/answer') {
        let bodyText = '';
        if (req.method === 'POST') {
          const chunks = [];
          let size = 0;
          for await (const chunk of req) {
            size += chunk.length;
            if (size > MAX_BODY_BYTES) break;
            chunks.push(chunk);
          }
          // null tells the contract the body exceeded the limit (413).
          bodyText = size > MAX_BODY_BYTES ? null : Buffer.concat(chunks).toString('utf8');
        }
        return send(res, await answer(
          { method: req.method, authorization: req.headers.authorization, bodyText },
          { ...cfg, corpus, generate, traceId: crypto.randomUUID(), now: () => performance.now() },
        ));
      }
      if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
        return send(res, { status: 200, headers: PAGE_HEADERS, body: await readFile(path.join(HERE, 'public/index.html'), 'utf8') });
      }
      return send(res, { status: 404, headers: { 'content-type': 'application/json; charset=utf-8' }, body: { error: 'not_found' } });
    } catch {
      return send(res, { status: 500, headers: { 'content-type': 'application/json; charset=utf-8' }, body: { error: 'internal_error' } });
    }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const cfg = await settings();
  const port = Number(process.env.PORT || 8080);
  createServer({ cfg }).listen(port, () => console.log(JSON.stringify({ msg: 'listening', port, runtime: RUNTIME, mode: cfg.mode, model: cfg.model, location: cfg.location })));
}
