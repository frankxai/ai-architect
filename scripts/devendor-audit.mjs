#!/usr/bin/env node
// Devendor audit: fails if any named-customer or named-employer term appears
// anywhere in the repo (except node_modules, .git, and this script — the
// pattern itself has to name the terms it looks for).
//
// Usage: node scripts/devendor-audit.mjs
// Prints a per-file count table. Exits 1 if the total count is nonzero.

import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseLedger } from '../guide/scripts/validate-ledgers.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

// eslint-disable-next-line no-useless-escape
const PATTERN = /oracle|\bOCI\b|canon europe|morrisons|\bNHS\b|pearson|vodafone/i;

const EXCLUDE_DIRS = new Set(['.git', 'node_modules']);
const EXCLUDE_FILES = new Set(['NOTICE', 'LICENSE', 'LICENSING.md']);
const BINARY_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.pdf', '.zip']);

// Exact public-source attribution, not an employer/customer narrative exception.
// Other fields, unknown records, and every other path remain subject to the audit.
export const ATTRIBUTED_SOURCES = {
  S34: { title: 'Oracle Enterprise Generative AI Stack', publisher: 'Oracle', url: 'https://docs.oracle.com/en/solutions/oci-genai-enterprise/index.html' },
  S35: { title: 'Oracle AI Center of Excellence', publisher: 'Oracle', url: 'https://www.oracle.com/uk/artificial-intelligence/ai-center-excellence/' },
};

export function auditContent(relativePath, content) {
  // Host separators only. A literal backslash on POSIX is a different filename
  // and must still be scanned.
  const rel = String(relativePath).split(path.sep).join('/');
  if (rel !== 'guide/research/sources.yaml') return content;
  const document = parseLedger(content);
  for (const record of document.sources ?? []) {
    const allowed = ATTRIBUTED_SOURCES[record.id];
    if (!allowed || !Object.entries(allowed).every(([field, value]) => record[field] === value)) continue;
    for (const field of Object.keys(allowed)) record[field] = '[attributed public source]';
  }
  return JSON.stringify(document);
}

export function violationCount(relativePath, content) {
  return auditContent(relativePath, content).match(new RegExp(PATTERN, 'gi'))?.length ?? 0;
}

function walk(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (EXCLUDE_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
    } else if (!EXCLUDE_FILES.has(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

function main() {
const files = walk(repoRoot).filter((f) => f !== __filename);

const hits = [];
let totalHits = 0;

for (const file of files) {
  const ext = path.extname(file).toLowerCase();
  if (BINARY_EXT.has(ext)) continue;

  let content;
  try {
    content = readFileSync(file, 'utf8');
  } catch {
    continue;
  }

  const count = violationCount(path.relative(repoRoot, file), content);
  if (count > 0) {
    hits.push({ file: path.relative(repoRoot, file), count });
    totalHits += count;
  }
}

const nameWidth = Math.max(...hits.map((h) => h.file.length), 20, 'file'.length);
console.log('devendor-audit');
console.log(`${'file'.padEnd(nameWidth)}  count`);
console.log('-'.repeat(nameWidth + 10));
for (const h of hits) {
  console.log(`${h.file.padEnd(nameWidth)}  ${h.count}`);
}
console.log('-'.repeat(nameWidth + 10));
console.log(`${totalHits} hit(s) across ${hits.length} file(s), ${files.length} file(s) scanned`);

process.exit(totalHits > 0 ? 1 : 0);
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) main();
