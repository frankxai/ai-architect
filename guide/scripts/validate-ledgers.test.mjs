import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { FINAL_GATES, isCalendarDate, parseLedger, validateLedgers } from './validate-ledgers.mjs';

function fixture() {
  const read = (file) => parseLedger(fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'));
  return { sources: read('research/sources.yaml'), claims: read('research/claims.yaml'), edition: read('edition.yaml') };
}
const validate = (data) => validateLedgers(data, '2026-09-07');

test('current working edition validates without certifying final review', () => {
  const data = fixture();
  assert.deepEqual(validate(data), []);
  assert.equal(data.edition.status, 'draft');
  assert.equal(data.edition.required_gates.accountable_author, 'pending');
});
test('real calendar dates, including leap years', () => {
  for (const value of ['2026-02-29', '2026-13-04', '2026-09-31', '2026-9-07', null]) assert.equal(isCalendarDate(value), false);
  assert.equal(isCalendarDate('2028-02-29'), true);
});
test('duplicate YAML keys and unsafe aliases fail parsing', () => {
  assert.throws(() => parseLedger('id: one\nid: two'));
  assert.throws(() => parseLedger('one: &x [value]\ntwo: *x'));
});
test('duplicate source and claim IDs fail before deduplication', () => {
  const data = fixture();
  data.sources.sources.push({ ...data.sources.sources[0] });
  data.claims.claims.push({ ...data.claims.claims[0] });
  assert.match(validate(data).join('\n'), /duplicate source ID/);
  assert.match(validate(data).join('\n'), /duplicate claim ID/);
});
test('missing metadata, unknown references and stale dates fail', () => {
  const data = fixture();
  delete data.sources.sources[0].url;
  delete data.claims.claims[0].class;
  data.claims.claims[1].sources = ['S999'];
  data.claims.claims[2].review_by = '2026-02-30';
  data.sources.sources[2].review_by = '2026-09-06';
  const result = validate(data).join('\n');
  for (const expected of ['missing url', 'invalid claim class', 'unknown source S999', 'invalid calendar date', 'stale evidence']) assert.ok(result.includes(expected), expected);
});
test('failed, pending, and absent gates cannot produce a released edition', () => {
  for (const value of ['failed', 'pending', undefined]) {
    const data = fixture();
    data.edition.status = 'released';
    data.edition.publication_state = 'final-edition';
    data.edition.required_gates = Object.fromEntries(FINAL_GATES.map((gate) => [gate, 'passed']));
    data.edition.gate_evidence = Object.fromEntries(FINAL_GATES.map((gate) => [gate, 'test-only evidence']));
    data.edition.required_gates.accountable_author = value;
    assert.match(validate(data).join('\n'), /requires passed gate: accountable_author/);
  }
});
test('a passed label alone is not a review receipt', () => {
  const data = fixture();
  data.edition.required_gates.humanizer = 'passed';
  assert.match(validate(data).join('\n'), /passed gate lacks evidence: humanizer/);
});
