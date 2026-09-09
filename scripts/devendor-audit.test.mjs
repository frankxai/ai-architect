import test from 'node:test';
import assert from 'node:assert/strict';
import { ATTRIBUTED_SOURCES, violationCount } from './devendor-audit.mjs';

const source = { id: 'S34', ...ATTRIBUTED_SOURCES.S34, supports: 'Public architecture guidance' };
const encode = (record) => JSON.stringify({ sources: [record] });
test('exact source attribution is allowed only in the source ledger', () => {
  assert.equal(violationCount('guide/research/sources.yaml', encode(source)), 0);
  assert.equal(violationCount('guide\\research\\sources.yaml', encode(source)), 0);
  assert.ok(violationCount('guide/manuscript/example.md', encode(source)) > 0);
});
test('a source does not exempt narrative, altered URLs, or unknown records', () => {
  const vendor = source.publisher;
  for (const changed of [{ supports: `${vendor} customer result` }, { url: `${source.url}?unapproved` }, { id: 'S99' }]) {
    assert.ok(violationCount('guide/research/sources.yaml', encode({ ...source, ...changed })) > 0);
  }
});
