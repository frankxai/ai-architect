// Copies the canonical answer core into each template so every template stays
// self-contained (Deploy to Cloudflare, Vercel clone and Cloud Run Button each
// build one directory). `--check` fails when any copy drifted.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const TARGETS = {
  'vercel-ai-gateway': { 'answer-core.mjs': 'lib/answer-core.mjs', 'corpus.mjs': 'lib/corpus.mjs', 'index.html': 'public/index.html' },
  'cloudflare-workers-ai': { 'answer-core.mjs': 'src/answer-core.mjs', 'corpus.mjs': 'src/corpus.mjs', 'index.html': 'public/index.html' },
  'gcp-cloud-run-gemini': { 'answer-core.mjs': 'src/answer-core.mjs', 'corpus.mjs': 'src/corpus.mjs', 'index.html': 'public/index.html' },
};

export function drift() {
  const out = [];
  for (const [template, files] of Object.entries(TARGETS)) {
    for (const [source, target] of Object.entries(files)) {
      const want = fs.readFileSync(path.join(HERE, source));
      const file = path.join(HERE, '..', template, target);
      if (!fs.existsSync(file) || !want.equals(fs.readFileSync(file))) out.push(`${template}/${target}`);
    }
  }
  return out;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--check')) {
    const stale = drift();
    if (stale.length) { console.error(`Template copies differ from answer-core:\n${stale.join('\n')}\nRun: node templates/deploy/answer-core/sync.mjs`); process.exit(1); }
    console.log('Answer core copies are identical in all templates.');
  } else {
    for (const [template, files] of Object.entries(TARGETS)) {
      for (const [source, target] of Object.entries(files)) {
        const file = path.join(HERE, '..', template, target);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.copyFileSync(path.join(HERE, source), file);
      }
    }
    console.log(`Synced answer core into ${Object.keys(TARGETS).length} templates.`);
  }
}
