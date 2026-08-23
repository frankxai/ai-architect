#!/usr/bin/env node
// Gate: economics honesty checks for docs/architecture (gate.economics).
// Usage: node scripts/check-roi.mjs [path/to/docs/architecture]
//
// - Every row in prices.json has source_url and retrieved_at, and
//   retrieved_at is within the last 90 days.
// - The literal string "IRR" never appears in 04-roi.md or prices.json.
// - Any line in 04-roi.md containing a "%" character also contains the word
//   "baseline" or "source" (case-insensitive) — a percentage with no stated
//   baseline or source is an invented number.
//
// Prints a gate table. Exits 1 on any FAIL. Exits 0 with SKIPPED if the
// target directory or prices.json does not exist yet.

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const dirArg = process.argv[2] || path.join('docs', 'architecture');
const targetDir = path.resolve(process.cwd(), dirArg);
const pricesPath = path.join(targetDir, 'prices.json');
const roiPath = path.join(targetDir, '04-roi.md');

const rows = [];
function check(name, ok, detail) {
  rows.push({ name, status: ok ? 'PASS' : 'FAIL', detail: detail || '' });
}

if (!existsSync(targetDir) || !existsSync(pricesPath)) {
  console.log(`SKIPPED roi: ${path.relative(process.cwd(), targetDir) || dirArg} or prices.json not found`);
  process.exit(0);
}

const IRR_PATTERN = /\bIRR\b/;
const MAX_AGE_DAYS = 90;

function daysAgo(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return (Date.now() - d.getTime()) / 86400000;
}

const pricesRaw = readFileSync(pricesPath, 'utf8');
check('prices.json: no literal "IRR"', !IRR_PATTERN.test(pricesRaw));

let prices;
try {
  prices = JSON.parse(pricesRaw);
  check('prices.json: parses', true);
} catch (err) {
  check('prices.json: parses', false, err.message);
  prices = { rows: [] };
}

const priceRows = Array.isArray(prices.rows) ? prices.rows : [];
check('prices.json: has at least one row', priceRows.length > 0, `${priceRows.length} rows`);

priceRows.forEach((row, i) => {
  const label = row.item ? `"${row.item}"` : `row ${i}`;
  const hasSource = typeof row.source_url === 'string' && /^https?:\/\//.test(row.source_url);
  check(`prices.json: ${label} has source_url`, hasSource, hasSource ? row.source_url : 'missing or not a URL');

  const age = typeof row.retrieved_at === 'string' ? daysAgo(row.retrieved_at) : null;
  const fresh = age !== null && age >= 0 && age <= MAX_AGE_DAYS;
  check(
    `prices.json: ${label} retrieved_at within ${MAX_AGE_DAYS} days`,
    fresh,
    age === null ? 'missing or unparseable date' : `${Math.round(age)} days ago (retrieved_at=${row.retrieved_at})`
  );
});

if (existsSync(roiPath)) {
  const roi = readFileSync(roiPath, 'utf8');
  check('04-roi.md: no literal "IRR"', !IRR_PATTERN.test(roi));

  const lines = roi.split('\n');
  const percentLines = lines
    .map((line, idx) => ({ line, idx }))
    .filter(({ line }) => line.includes('%'));

  const bad = percentLines.filter(
    ({ line }) => !/baseline/i.test(line) && !/source/i.test(line)
  );

  check(
    '04-roi.md: every "%" line names a baseline or a source',
    bad.length === 0,
    bad.length === 0
      ? `${percentLines.length} percent line(s) checked`
      : `${bad.length} line(s) missing "baseline"/"source": ${bad.map((b) => `L${b.idx + 1}`).join(', ')}`
  );
} else {
  check('04-roi.md: exists', false, 'file missing');
}

const nameWidth = Math.max(...rows.map((r) => r.name.length), 20);
console.log(`check-roi: ${path.relative(process.cwd(), targetDir)}`);
console.log(`${'check'.padEnd(nameWidth)}  status    detail`);
console.log('-'.repeat(nameWidth + 60));
for (const r of rows) {
  console.log(`${r.name.padEnd(nameWidth)}  ${r.status.padEnd(8)}  ${r.detail}`);
}
console.log('-'.repeat(nameWidth + 60));
const failCount = rows.filter((r) => r.status === 'FAIL').length;
console.log(`${rows.length} checks, ${rows.length - failCount} pass, ${failCount} fail`);

process.exit(failCount > 0 ? 1 : 0);
