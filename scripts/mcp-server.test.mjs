import { mkdtempSync, mkdirSync, symlinkSync, existsSync, rmSync, writeFileSync } from 'node:fs';
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

test('malformed input does not crash or corrupt subsequent requests', () => {
  const result = spawnSync(process.execPath, [server], {
    input: 'null\n{broken\n[]\n' + JSON.stringify({ jsonrpc: '2.0', id: 9, method: 'ping' }) + '\n',
    encoding: 'utf8', timeout: 15000,
  });
  assert.equal(result.status, 0, result.stderr);
  const messages = parseLines(result.stdout);
  assert.deepEqual(messages.slice(0, 3).map((message) => message.error.code), [-32600, -32700, -32600]);
  assert.deepEqual(messages[3].result, {});
});

test('notifications do not execute tools or emit responses', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'aa-mcp-notification-'));
  try {
    const result = rpc([{ jsonrpc: '2.0', method: 'tools/call', params: { name: 'architect_init', arguments: { root } } }]);
    assert.equal(result.status, 0);
    assert.equal(result.stdout, '');
    assert.equal(existsSync(path.join(root, 'docs')), false);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('invalid tool arguments and unsuccessful subprocesses are marked as tool errors', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'aa-mcp-corrupt-'));
  mkdirSync(path.join(root, 'docs', 'architecture'), { recursive: true });
  writeFileSync(path.join(root, 'docs', 'architecture', 'WORKFLOW.md'), '# invalid workflow');
  try {
    const result = rpc([
      { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'architect_card', arguments: { root: 8 } } },
      { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'architect_card', arguments: { root: '/does-not-exist/aa-customer' } } },
      { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'unknown_tool' } },
      { jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'architect_card', arguments: { root } } },
    ]);
    assert.equal(result.status, 0);
    const messages = parseLines(result.stdout);
    assert.equal(messages[0].result.isError, true);
    assert.equal(messages[1].result.isError, true);
    assert.equal(messages[2].error.code, -32602);
    assert.equal(messages[3].result.isError, true);
    assert.equal(JSON.parse(messages[3].result.content[0].text).exit, 1);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('initialization rejects symlink paths without writing outside the repository', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'aa-mcp-symlink-'));
  const outside = mkdtempSync(path.join(tmpdir(), 'aa-mcp-outside-'));
  try {
    symlinkSync(outside, path.join(root, 'docs'), 'dir');
    const result = rpc([{ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'architect_init', arguments: { root } } }]);
    const message = parseLines(result.stdout)[0];
    assert.equal(message.result.isError, true);
    assert.equal(existsSync(path.join(outside, 'architecture')), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
  }
});
