#!/usr/bin/env node
// Plugin self-evals. These grade the installable surface, not a customer's
// production loop. Customer evals live in docs/architecture/06-evals/.
//
// Usage:
//   node evals/run.mjs
//   node evals/run.mjs --allow-missing
//
// --allow-missing  exit 0 when evals/cases/ is empty (bootstrap). Once any
//                  cases.jsonl exists, missing required kinds fail the run.

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const casesDir = path.join(__dirname, 'cases');
const allowMissing = process.argv.includes('--allow-missing');

function loadCases() {
  if (!existsSync(casesDir)) return [];
  const files = readdirSync(casesDir).filter((f) => f.endsWith('.jsonl'));
  const cases = [];
  for (const file of files) {
    const raw = readFileSync(path.join(casesDir, file), 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      cases.push({ file, ...JSON.parse(trimmed) });
    }
  }
  return cases;
}

function fileExistsFromRepo(rel) {
  return existsSync(path.join(repoRoot, rel));
}

function runCase(c) {
  if (c.check === 'file_exists') {
    const ok = fileExistsFromRepo(c.target);
    return { ok, detail: ok ? 'present' : `missing ${c.target}` };
  }
  if (c.check === 'file_contains') {
    const full = path.join(repoRoot, c.target);
    if (!existsSync(full)) return { ok: false, detail: `missing ${c.target}` };
    const text = readFileSync(full, 'utf8');
    const ok = text.includes(c.needle);
    return { ok, detail: ok ? 'found' : `needle not in ${c.target}` };
  }
  if (c.check === 'json_field') {
    const full = path.join(repoRoot, c.target);
    if (!existsSync(full)) return { ok: false, detail: `missing ${c.target}` };
    const obj = JSON.parse(readFileSync(full, 'utf8'));
    const value = c.path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
    const ok = value === c.expect;
    return { ok, detail: ok ? 'match' : `got ${JSON.stringify(value)}` };
  }
  return { ok: false, detail: `unknown check ${c.check}` };
}

const cases = loadCases();

if (cases.length === 0) {
  if (allowMissing) {
    console.log('evals: no cases yet; --allow-missing so this is not a failure');
    process.exit(0);
  }
  console.log('FAIL evals: no cases in evals/cases/*.jsonl');
  process.exit(1);
}

const kinds = new Set(cases.map((c) => c.kind));
const requiredKinds = ['golden', 'refusal', 'injection'];
const rows = [];
let failed = 0;

for (const c of cases) {
  let result;
  try {
    result = runCase(c);
  } catch (err) {
    result = { ok: false, detail: err.message };
  }
  if (!result.ok) failed += 1;
  rows.push({ id: c.id, kind: c.kind, status: result.ok ? 'PASS' : 'FAIL', detail: result.detail });
}

console.log('evals');
const width = Math.max(...rows.map((r) => r.id.length), 12);
console.log(`${'id'.padEnd(width)}  kind        status    detail`);
console.log('-'.repeat(width + 48));
for (const r of rows) {
  console.log(`${r.id.padEnd(width)}  ${(r.kind || '').padEnd(10)}  ${r.status.padEnd(8)}  ${r.detail}`);
}
console.log('-'.repeat(width + 48));

const missingKinds = requiredKinds.filter((k) => !kinds.has(k));
if (missingKinds.length) {
  console.log(`FAIL required kinds missing: ${missingKinds.join(', ')}`);
  failed += 1;
}

console.log(`${rows.length} cases, ${rows.length - rows.filter((r) => r.status === 'FAIL').length} pass, ${failed} fail`);
process.exit(failed > 0 ? 1 : 0);
