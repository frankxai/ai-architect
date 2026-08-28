import { mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const server = path.join(pluginRoot, 'mcp', 'server.mjs');

function rpc(messages) {
  const input = messages.map((m) => `${JSON.stringify(m)}\n`).join('');
  return spawnSync(process.execPath, [server], {
    input,
    encoding: 'utf8',
    timeout: 15000,
  });
}

function parseLines(stdout) {
  return stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

test('initialize + tools/list includes init and card', () => {
  const result = rpc([
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'test', version: '0' } } },
    { jsonrpc: '2.0', method: 'notifications/initialized' },
    { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} },
  ]);
  assert.equal(result.status, 0);
  const messages = parseLines(result.stdout);
  const init = messages.find((m) => m.id === 1);
  assert.equal(init.result.serverInfo.name, 'ai-architect');
  const list = messages.find((m) => m.id === 2);
  const names = list.result.tools.map((t) => t.name);
  for (const name of ['architect_status', 'architect_init', 'architect_card', 'architect_next_stage']) {
    assert.ok(names.includes(name), `missing ${name}`);
  }
});

test('architect_init copies SOP and WORKFLOW once', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'aa-mcp-'));
  mkdirSync(path.join(root, 'docs'), { recursive: true });
  const result = rpc([
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'test', version: '0' } } },
    {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: { name: 'architect_init', arguments: { root } },
    },
  ]);
  assert.equal(result.status, 0);
  const call = parseLines(result.stdout).find((m) => m.id === 2);
  const payload = JSON.parse(call.result.content[0].text);
  assert.equal(payload.exit, 0, payload.stderr);
  const start = payload.stdout.indexOf('{');
  const end = payload.stdout.lastIndexOf('}');
  assert.ok(start >= 0 && end > start, payload.stdout);
  const body = JSON.parse(payload.stdout.slice(start, end + 1));
  assert.deepEqual(body.written.sort(), ['SOP.md', 'WORKFLOW.md']);
});
