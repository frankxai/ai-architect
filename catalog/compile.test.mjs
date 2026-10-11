import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { load, validate, resolve, compile, economics, mermaidFlow, structurizr, reactFlow, drawio, svg, wrap, deployUrl } from './compile.mjs';

const TODAY = '2026-10-11';
const fresh = () => structuredClone(load());
const clean = () => fs.mkdtempSync(path.join(os.tmpdir(), 'catalog-'));

test('the committed catalog validates and resolves every pattern on every provider', () => {
  const cat = validate(fresh(), TODAY);
  const patterns = resolve(cat);
  assert.equal(patterns.length, 7);
  for (const p of patterns) {
    assert.equal(Object.keys(p.realizations).length, cat.providers.providers.length);
    for (const r of Object.values(p.realizations)) {
      for (const c of p.components) {
        const binding = r.bindings[c.id];
        if (['user', 'system'].includes(c.role)) assert.equal(binding, null);
        else assert.ok([r.provider, 'portable'].includes(binding.provider), `${p.id}/${r.provider}/${c.id}`);
      }
    }
  }
});

test('validation rejects dangling flows, foreign services and uncovered journeys', () => {
  const a = fresh();
  a.patterns[0].flows[0].to = 'ghost';
  assert.throws(() => validate(a, TODAY), /dangling/);
  const b = fresh();
  const pat = b.patterns.find(p => p.id === 'grounded-research-desk');
  pat.realizations.gcp.map.index = 'cf.ai-search';
  assert.throws(() => validate(b, TODAY), /not a gcp service/);
  const c = fresh();
  c.patterns[0].journey = c.patterns[0].journey.slice(1);
  assert.throws(() => validate(c, TODAY), /journey must cover every flow/);
});

test('validation refuses expired sources and official icons outside Google Cloud', () => {
  const a = fresh();
  assert.throws(() => validate(a, '2027-06-01'), /review date passed/);
  const b = fresh();
  b.services.find(s => s.id === 'cf.workers').icon = 'cloud_run';
  assert.throws(() => validate(b, TODAY), /official icons are only registered for Google Cloud/);
});

test('validation refuses scores outside 1-5 and percent signs that read as measurements', () => {
  const a = fresh();
  a.patterns[0].realizations.vercel.scores.performance = 7;
  assert.throws(() => validate(a, TODAY), /scores/);
  const b = fresh();
  b.patterns[0].screens[0].blocks.push({ type: 'meta', text: 'Accuracy 97%' });
  assert.throws(() => validate(b, TODAY), /percent/);
});

test('economics count every attempt in cost and report cost per accepted result', () => {
  const e = economics({ tasks: 1000, adoption: 0.5, acceptance: 0.8, minutes_saved: 12, hourly_value: 60, run_cost_per_task: 0.1, fixed_monthly: 1000 });
  assert.deepEqual(e, { attempts: 500, accepted: 400, monthly_value: 4800, run_cost: 50, monthly_cost: 1050, net: 3750, cost_per_accepted: 2.63 });
});

test('views carry stable component and flow identifiers', () => {
  const cat = validate(fresh(), TODAY);
  const pat = resolve(cat).find(p => p.id === 'grounded-research-desk');
  const flow = reactFlow(pat, 'cloudflare');
  assert.deepEqual(flow.nodes.map(n => n.id), pat.components.map(c => c.id));
  assert.deepEqual(flow.edges.map(e => e.id), pat.flows.map(f => f.id));
  assert.equal(flow.nodes.find(n => n.id === 'index').data.serviceId, 'cf.ai-search');
  const mmd = mermaidFlow(cat, pat, 'gcp');
  for (const f of pat.flows) assert.ok(mmd.includes(`%% flow ${f.id} `));
  assert.ok(!/\bend\b\s*\[/.test(mmd), 'renderer IDs are prefixed');
  const xml = drawio(cat, pat, 'vercel');
  assert.equal((xml.match(/vertex="1"/g) ?? []).length, pat.components.length);
  const dsl = structurizr(cat, pat);
  assert.equal((dsl.match(/= deploymentEnvironment /g) ?? []).length, cat.providers.providers.length);
  assert.ok(!/\{ [a-z]+ .*\}$/m.test(dsl), 'no single-line blocks: the Structurizr parser rejects them');
});

test('SVG embeds official icons only where a Google Cloud service uses one, and says so', () => {
  const cat = validate(fresh(), TODAY);
  const pat = resolve(cat).find(p => p.id === 'grounded-research-desk');
  const gcp = svg(cat, pat, 'gcp');
  assert.match(gcp, /data:image\/svg\+xml;base64,/);
  assert.match(gcp, /Google Cloud icons are Google trademarks/);
  const cf = svg(cat, pat, 'cloudflare');
  assert.doesNotMatch(cf, /data:image/);
  assert.match(cf, /no vendor icons/);
});

test('long service names wrap to two lines with an ellipsis', () => {
  assert.deepEqual(wrap('Workers Observability + AI Gateway logs', 30), ['Workers Observability + AI', 'Gateway logs']);
  assert.equal(wrap('a '.repeat(40).trim(), 10).length, 2);
  assert.match(wrap('a '.repeat(40).trim(), 10)[1], /…$/);
});

test('deploy URLs point at the template directory on the requested ref', () => {
  const t = { id: 'x', path: 'templates/deploy/x', button: 'vercel' };
  assert.match(deployUrl(t), /repository-url=https%3A%2F%2Fgithub.com%2Ffrankxai%2Fai-architect%2Ftree%2Fmain%2Ftemplates%2Fdeploy%2Fx/);
  assert.match(deployUrl({ ...t, button: 'cloudflare' }, 'release'), /tree%2Frelease%2Ftemplates/);
  assert.match(deployUrl({ ...t, button: 'cloud-run' }), /dir=templates%2Fdeploy%2Fx&revision=main/);
});

test('template READMEs carry the same deploy URL the catalog publishes', () => {
  for (const t of load().templates) {
    const readme = fs.readFileSync(path.join(import.meta.dirname, '..', t.path, 'README.md'), 'utf8');
    assert.ok(readme.includes(deployUrl(t)), `${t.id} README deploy button drifted from catalog`);
  }
});

test('compile is deterministic, hashed and refuses unrelated output directories', () => {
  const a = clean(), b = clean();
  const one = compile(a, { revision: 'abc123', today: TODAY }).manifest;
  const two = compile(b, { revision: 'abc123', today: TODAY }).manifest;
  assert.deepEqual(one.files, two.files);
  const providers = load().providers.providers.length;
  assert.equal(one.files.length, 7 * (2 + providers * 4) + 2);
  assert.ok(one.files.every(f => /^[0-9a-f]{64}$/.test(f.sha256)));
  const dirty = clean();
  fs.writeFileSync(path.join(dirty, 'notes.txt'), 'mine');
  assert.throws(() => compile(dirty, { today: TODAY }), /unrelated files/);
  const bundle = JSON.parse(fs.readFileSync(path.join(a, 'catalog.json'), 'utf8'));
  assert.equal(bundle.source_revision, 'abc123');
  assert.ok(bundle.providers.every(p => !('defaults' in p)));
  assert.ok(bundle.templates.every(t => t.deploy_url.startsWith('https://')));
});
