import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WorkflowError,
  nextIncomplete,
  outputWritePaths,
  parseStageTable,
} from './parse-workflow.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(__dirname, '..');
const conductor = path.join(pluginRoot, 'scripts', 'architect-conductor.mjs');
const templateWorkflow = readFileSync(path.join(pluginRoot, 'templates', 'WORKFLOW.md'), 'utf8');

function run(args, cwd = pluginRoot) {
  return spawnSync(process.execPath, [conductor, ...args], {
    encoding: 'utf8',
    cwd,
  });
}

function parseStdout(result) {
  const text = (result.stdout || '').trim();
  assert.ok(text, `expected JSON stdout, got stderr=${result.stderr}`);
  return JSON.parse(text);
}

function tempRoot() {
  return mkdtempSync(path.join(tmpdir(), 'ai-architect-conductor-'));
}

test('template WORKFLOW has nine lifecycle stages and no overlay agents', () => {
  const stages = parseStageTable(templateWorkflow);
  assert.equal(stages.length, 9);
  assert.equal(stages[0].stage, 'frame');
  assert.equal(stages[0].gate, 'gate.frame');
  assert.equal(stages.at(-1).stage, 'verify');
  const agents = new Set(stages.map((s) => s.agent));
  for (const overlay of ['red-team', 'blue-team', 'cloud-harness']) {
    assert.equal(agents.has(overlay), false);
  }
});

test('custom 10th stage is next after nine PASS', () => {
  const extra = templateWorkflow.replace(
    '| `gate.verify` |\n\n## Gate table',
    '| `gate.verify` |\n| observe | discovery-analyst | `review.md` | `08-observe.md` | `gate.observe` |\n\n## Gate table',
  );
  assert.notEqual(extra, templateWorkflow);
  const stages = parseStageTable(extra);
  assert.equal(stages.length, 10);
  const gates = Object.fromEntries(
    stages.slice(0, 9).map((s) => [s.gate, { status: 'PASS' }]),
  );
  const next = nextIncomplete(stages, { gates });
  assert.equal(next.stage, 'observe');
});

test('missing architecture.json → frame via CLI', () => {
  const root = tempRoot();
  const result = run(['--root', root, '--plugin-root', pluginRoot, 'next']);
  assert.equal(result.status, 0);
  const json = parseStdout(result);
  assert.equal(json.next.stage, 'frame');
});

test('previous FAIL blocks --stage discover (exit 2)', () => {
  const root = tempRoot();
  const archDir = path.join(root, 'docs', 'architecture');
  mkdirSync(archDir, { recursive: true });
  writeFileSync(
    path.join(archDir, 'architecture.json'),
    JSON.stringify({ goal: 'demo', gates: { 'gate.frame': { status: 'FAIL' } } }),
  );
  const result = run(['--root', root, '--plugin-root', pluginRoot, '--stage', 'discover', 'card']);
  assert.equal(result.status, 2);
  const json = parseStdout(result);
  assert.equal(json.blocked, true);
  assert.equal(json.fix_first, 'gate.frame');
});

test('SKIPPED with reason counts complete', () => {
  const stages = parseStageTable(templateWorkflow);
  const next = nextIncomplete(stages, {
    gates: { 'gate.frame': { status: 'SKIPPED', reason: 'already framed' } },
  });
  assert.equal(next.stage, 'discover');
});

test('SKIPPED without reason is incomplete', () => {
  const stages = parseStageTable(templateWorkflow);
  const next = nextIncomplete(stages, {
    gates: { 'gate.frame': { status: 'SKIPPED' } },
  });
  assert.equal(next.stage, 'frame');
});

test('goal-mismatch exit 3', () => {
  const root = tempRoot();
  const archDir = path.join(root, 'docs', 'architecture');
  mkdirSync(archDir, { recursive: true });
  writeFileSync(
    path.join(archDir, 'architecture.json'),
    JSON.stringify({ goal: 'ship receipts', gates: {} }),
  );
  const result = run(['--root', root, '--plugin-root', pluginRoot, 'next', 'a different goal']);
  assert.equal(result.status, 3);
  const json = parseStdout(result);
  assert.equal(json.error, 'goal-mismatch');
  assert.equal(json.existing, 'ship receipts');
});

test('corrupt table throws', () => {
  assert.throws(() => parseStageTable('# no table\n'), WorkflowError);
  assert.throws(
    () => parseStageTable('## Stage table\n| stage | nope |\n|---|---|\n| a | b |\n'),
    WorkflowError,
  );
});

test('write_paths stay under docs/architecture', () => {
  const stages = parseStageTable(templateWorkflow);
  const frame = stages[0];
  const paths = outputWritePaths(frame.output);
  assert.ok(paths.length);
  for (const p of paths) {
    assert.ok(p.startsWith('docs/architecture/'));
    assert.equal(p.includes('..'), false);
  }
  assert.throws(() => outputWritePaths('../secret.md'), WorkflowError);
});

test('card for empty root names frame and human gates', () => {
  const root = tempRoot();
  const result = run(['--root', root, '--plugin-root', pluginRoot, 'card']);
  assert.equal(result.status, 0);
  const json = parseStdout(result);
  assert.equal(json.stage, 'frame');
  assert.equal(json.agent, 'discovery-analyst');
  assert.equal(json.model, 'sonnet');
  assert.equal(json.cli.default, 'codex');
  assert.ok(json.human_gates.includes('publish'));
  for (const p of json.write_paths) {
    assert.ok(p.startsWith('docs/architecture/'));
  }
});

test('check skips missing architecture dir', () => {
  const root = tempRoot();
  const result = run(['--root', root, '--plugin-root', pluginRoot, 'check']);
  assert.equal(result.status, 0);
  const json = parseStdout(result);
  assert.equal(json.skipped, 'no-architecture-dir');
});

test('init writes SOP and WORKFLOW once, then skips', () => {
  const root = tempRoot();
  const first = run(['--root', root, '--plugin-root', pluginRoot, 'init']);
  assert.equal(first.status, 0);
  const created = parseStdout(first);
  assert.deepEqual(created.written.sort(), ['SOP.md', 'WORKFLOW.md']);
  const second = run(['--root', root, '--plugin-root', pluginRoot, 'init']);
  assert.equal(second.status, 0);
  const again = parseStdout(second);
  assert.deepEqual(again.skipped.sort(), ['SOP.md', 'WORKFLOW.md']);
  assert.deepEqual(again.written, []);
});

test('ancestral FAIL blocks --stage secure (exit 2)', () => {
  const root = tempRoot();
  const archDir = path.join(root, 'docs', 'architecture');
  mkdirSync(archDir, { recursive: true });
  writeFileSync(
    path.join(archDir, 'architecture.json'),
    JSON.stringify({ goal: 'demo', gates: { 'gate.frame': { status: 'FAIL' } } }),
  );
  const result = run(['--root', root, '--plugin-root', pluginRoot, '--stage', 'secure', 'card']);
  assert.equal(result.status, 2);
  const json = parseStdout(result);
  assert.equal(json.blocked, true);
  assert.equal(json.fix_first, 'gate.frame');
});

test('conductor card rejects escaping write paths', () => {
  const root = tempRoot();
  const archDir = path.join(root, 'docs', 'architecture');
  mkdirSync(archDir, { recursive: true });
  writeFileSync(
    path.join(archDir, 'WORKFLOW.md'),
    [
      '## Stage table',
      '',
      '| stage | agent | input | output | gate |',
      '|---|---|---|---|---|',
      '| frame | discovery-analyst | goal | `00-frame.md`, `foo/../../../etc/x.md` | `gate.frame` |',
      '',
    ].join('\n'),
  );
  writeFileSync(path.join(archDir, 'SOP.md'), readFileSync(path.join(pluginRoot, 'templates', 'SOP.md'), 'utf8'));
  const result = run(['--root', root, '--plugin-root', pluginRoot, 'card']);
  assert.equal(result.status, 1);
  const json = parseStdout(result);
  assert.equal(json.error, 'unsafe-write-path');
});

