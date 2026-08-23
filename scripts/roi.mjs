#!/usr/bin/env node
// Payback calculator: reads prices.json (for provenance) and an inputs.json,
// prints a payback-period range sensitized ±30% on 3 drivers.
//
// Usage: node scripts/roi.mjs [prices.json] [inputs.json]
// Defaults: docs/architecture/prices.json, docs/architecture/inputs.json
//
// inputs.json shape (ai-architect.roi-inputs.v1):
// {
//   "schema": "ai-architect.roi-inputs.v1",
//   "build_cost_usd": 20000,
//   "monthly_volume": 50000,
//   "baseline_unit_cost_usd": 0.05,
//   "new_unit_cost_usd": 0.02
// }
// monthly_savings = monthly_volume * (baseline_unit_cost_usd - new_unit_cost_usd)
// payback_months  = build_cost_usd / monthly_savings
//
// The 3 sensitized drivers are build_cost_usd, monthly_volume, and the
// per-unit savings (baseline_unit_cost_usd - new_unit_cost_usd). The printed
// range moves all three by ±30% simultaneously: best case favors payback
// (lower build cost, higher volume, higher savings-per-unit), worst case
// disfavors it.

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const pricesArg = process.argv[2] || path.join('docs', 'architecture', 'prices.json');
const inputsArg = process.argv[3] || path.join('docs', 'architecture', 'inputs.json');
const pricesPath = path.resolve(process.cwd(), pricesArg);
const inputsPath = path.resolve(process.cwd(), inputsArg);

if (!existsSync(inputsPath)) {
  console.error(`roi.mjs: no inputs file at ${inputsArg}`);
  console.error('See the inputs.json shape documented at the top of scripts/roi.mjs.');
  process.exit(1);
}

const inputs = JSON.parse(readFileSync(inputsPath, 'utf8'));
const required = ['build_cost_usd', 'monthly_volume', 'baseline_unit_cost_usd', 'new_unit_cost_usd'];
const missing = required.filter((k) => typeof inputs[k] !== 'number');
if (missing.length > 0) {
  console.error(`roi.mjs: inputs.json is missing numeric field(s): ${missing.join(', ')}`);
  process.exit(1);
}

let priceRowCount = 0;
if (existsSync(pricesPath)) {
  try {
    const prices = JSON.parse(readFileSync(pricesPath, 'utf8'));
    priceRowCount = Array.isArray(prices.rows) ? prices.rows.length : 0;
  } catch {
    // prices.json is provenance context only; a parse failure here does not
    // block the calculation, check-roi.mjs is the gate for prices.json.
  }
}

function payback({ buildCost, volume, unitSavings }) {
  if (unitSavings <= 0) return Infinity;
  const monthlySavings = volume * unitSavings;
  return buildCost / monthlySavings;
}

const base = {
  buildCost: inputs.build_cost_usd,
  volume: inputs.monthly_volume,
  unitSavings: inputs.baseline_unit_cost_usd - inputs.new_unit_cost_usd,
};

const basePayback = payback(base);

const best = payback({
  buildCost: base.buildCost * 0.7,
  volume: base.volume * 1.3,
  unitSavings: base.unitSavings * 1.3,
});

const worst = payback({
  buildCost: base.buildCost * 1.3,
  volume: base.volume * 0.7,
  unitSavings: base.unitSavings * 0.7,
});

function fmtMonths(n) {
  return Number.isFinite(n) ? `${n.toFixed(1)} months` : 'never (no positive savings)';
}

console.log('roi.mjs — payback sensitivity (±30% on build cost, volume, unit savings)');
console.log(`  inputs: ${path.relative(process.cwd(), inputsPath)}  (prices.json rows referenced: ${priceRowCount})`);
console.log(`  base case      : ${fmtMonths(basePayback)}`);
console.log(`  best case  (-30% cost / +30% volume / +30% savings): ${fmtMonths(best)}`);
console.log(`  worst case (+30% cost / -30% volume / -30% savings): ${fmtMonths(worst)}`);
console.log(`  range: ${fmtMonths(best)} to ${fmtMonths(worst)}`);
console.log('');
console.log('  driver         base value        low (-30%)        high (+30%)');
console.log(`  build_cost_usd        ${base.buildCost}        ${(base.buildCost * 0.7).toFixed(2)}        ${(base.buildCost * 1.3).toFixed(2)}`);
console.log(`  monthly_volume        ${base.volume}        ${(base.volume * 0.7).toFixed(2)}        ${(base.volume * 1.3).toFixed(2)}`);
console.log(`  unit_savings_usd      ${base.unitSavings.toFixed(4)}        ${(base.unitSavings * 0.7).toFixed(4)}        ${(base.unitSavings * 1.3).toFixed(4)}`);
