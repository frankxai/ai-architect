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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

// eslint-disable-next-line no-useless-escape
const PATTERN = /oracle|\bOCI\b|canon europe|morrisons|\bNHS\b|pearson|vodafone/i;

const EXCLUDE_DIRS = new Set(['.git', 'node_modules']);
const BINARY_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.pdf', '.zip']);

function walk(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (EXCLUDE_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
    } else {
      files.push(full);
    }
  }
  return files;
}

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

  const matches = content.match(new RegExp(PATTERN, 'gi'));
  if (matches && matches.length > 0) {
    hits.push({ file: path.relative(repoRoot, file), count: matches.length });
    totalHits += matches.length;
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
