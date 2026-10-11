import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { evaluateBrief,fixtureReferences,fixtureBrief,runFixtureSuite,makeCapsule,restoreCapsule,validatePractice } from './practice.mjs';
test('source failure, correction, scope and post-review mutation are independently testable',()=>{
  const before=evaluateBrief(fixtureBrief(),fixtureReferences(),'2026-10-11');
  assert.equal(before.state,'blocked-fixture');assert.match(before.findings[0],/expired/);
  assert.equal(evaluateBrief(fixtureBrief(true),fixtureReferences(),'2026-10-11').state,'passed-fixture');
  const suite=runFixtureSuite();assert.equal(suite.length,6);assert.ok(suite.every(t=>t.pass));
  assert.equal(suite.filter(t=>t.expected==='blocked-fixture').length,5);
});
test('capsule restore reconstructs exact fixture state and rejects modified evidence or approval',()=>{
  const sha='a'.repeat(40),c=makeCapsule('corrected',sha);
  assert.deepEqual(restoreCapsule(JSON.stringify(c),sha),c);
  for(const mutate of [c=>c.fixture=false,c=>c.source_revision='b'.repeat(40),c=>c.independent_review={status:'passed'},c=>c.provider_deployment='ready',c=>c.model_run='passed',c=>c.suite[0].result.state='production-verified',c=>c.artifact.claims[0].text='<script>alert(1)</script>',c=>c.extra='receipt']){const copy=structuredClone(c);mutate(copy);assert.throws(()=>restoreCapsule(JSON.stringify(copy),sha));}
  assert.throws(()=>restoreCapsule('{',sha));assert.throws(()=>restoreCapsule('x'.repeat(50001),sha));
  assert.throws(()=>makeCapsule('approved',sha));
  assert.throws(()=>makeCapsule('corrected',null),/Immutable/);
});
test('quality contract cannot fabricate metrics and tool references must be bounded',()=>{
  const p=JSON.parse(fs.readFileSync(new URL('./practice.json',import.meta.url))),s=JSON.parse(fs.readFileSync(new URL('./sources.json',import.meta.url)));
  validatePractice(p,s);
  for(const mutate of [p=>p.gates[0].observed='passed',p=>p.metrics[0].observed=.95,p=>p.metrics[0].denominator='',p=>p.metrics[0].gate='absent',p=>p.tools[0].sources=['absent'],p=>p.tools[0].url='javascript:alert(1)',p=>p.products[0].url='javascript:alert(1)',p=>p.products[0].url='https://github.com/other/repo',p=>p.policy_state='approved']){const copy=structuredClone(p);mutate(copy);assert.throws(()=>validatePractice(copy,s));}
});
