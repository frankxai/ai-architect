#!/usr/bin/env node
// Local stdio MCP server for AI Architect gate checks.
// No model calls. No network. Reads the current working directory.
//
// Tools:
//   architect_status            — next incomplete stage from architecture.json
//   architect_check_artifacts   — runs scripts/check-artifacts.mjs
//   architect_check_roi         — runs scripts/check-roi.mjs
//   architect_next_stage        — returns the router hint, does not run agents
//
// Configure as a local stdio server. Do not host this.

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { nextIncomplete, parseWorkflow } from '../scripts/parse-workflow.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(__dirname, '..');

const TOOLS = [
  {
    name: 'architect_status',
    description: 'Read docs/architecture/architecture.json and report gate statuses and the next incomplete stage.',
    inputSchema: {
      type: 'object',
      properties: {
        root: { type: 'string', description: 'Customer repository root. Defaults to cwd.' },
      },
    },
  },
  {
    name: 'architect_check_artifacts',
    description: 'Run the artifact-contract gate against docs/architecture.',
    inputSchema: {
      type: 'object',
      properties: {
        root: { type: 'string' },
      },
    },
  },
  {
    name: 'architect_check_roi',
    description: 'Run the economics honesty gate against docs/architecture.',
    inputSchema: {
      type: 'object',
      properties: {
        root: { type: 'string' },
      },
    },
  },
  {
    name: 'architect_next_stage',
    description: 'Return the next /architect invocation. Does not dispatch an agent.',
    inputSchema: {
      type: 'object',
      properties: {
        root: { type: 'string' },
      },
    },
  },
];

function loadStages(root) {
  const preferred = path.join(root, 'docs', 'architecture', 'WORKFLOW.md');
  const fallback = path.join(pluginRoot, 'templates', 'WORKFLOW.md');
  const file = existsSync(preferred) ? preferred : fallback;
  return parseWorkflow(readFileSync(file, 'utf8'));
}

function archPath(root) {
  return path.join(root, 'docs', 'architecture', 'architecture.json');
}

function readArch(root) {
  const p = archPath(root);
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, 'utf8'));
}

function nextStage(arch, root) {
  const stages = loadStages(root);
  const row = nextIncomplete(stages, arch);
  if (!row) {
    return { stage: null, reason: arch ? 'all gates complete' : 'architecture.json missing; start with /architect' };
  }
  const g = arch?.gates?.[row.gate];
  return { stage: row.stage, gate: row.gate, status: g?.status || 'absent' };
}

function runScript(script, root) {
  const result = spawnSync(process.execPath, [path.join(pluginRoot, 'scripts', script), path.join(root, 'docs', 'architecture')], {
    encoding: 'utf8',
    cwd: root,
  });
  return {
    exit: result.status,
    stdout: (result.stdout || '').slice(0, 8000),
    stderr: (result.stderr || '').slice(0, 2000),
  };
}

function handleTool(name, args = {}) {
  const root = path.resolve(args.root || process.cwd());
  if (name === 'architect_status' || name === 'architect_next_stage') {
    const arch = readArch(root);
    const next = nextStage(arch, root);
    return {
      root,
      goal: arch?.goal || null,
      generated_at: arch?.generated_at || null,
      next,
      command: next.stage === 'verify' ? '/architect-verify' : next.stage ? `/architect --stage ${next.stage}` : '/architect',
    };
  }
  if (name === 'architect_check_artifacts') return runScript('check-artifacts.mjs', root);
  if (name === 'architect_check_roi') return runScript('check-roi.mjs', root);
  throw new Error(`unknown tool ${name}`);
}

function respond(id, result) {
  process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id, result })}\n`);
}

function respondError(id, code, message) {
  process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } })}\n`);
}

let buffer = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  buffer += chunk;
  let idx;
  while ((idx = buffer.indexOf('\n')) >= 0) {
    const line = buffer.slice(0, idx).trim();
    buffer = buffer.slice(idx + 1);
    if (!line) continue;
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      continue;
    }
    const { id, method, params } = msg;
    if (method === 'initialize') {
      respond(id, {
        protocolVersion: '2025-03-26',
        serverInfo: { name: 'ai-architect', version: '0.1.1' },
        capabilities: { tools: {} },
      });
      continue;
    }
    if (method === 'notifications/initialized') continue;
    if (method === 'tools/list') {
      respond(id, { tools: TOOLS });
      continue;
    }
    if (method === 'tools/call') {
      try {
        const data = handleTool(params.name, params.arguments || {});
        respond(id, { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] });
      } catch (err) {
        respondError(id, -32000, err.message);
      }
      continue;
    }
    if (id != null) respondError(id, -32601, `method not found: ${method}`);
  }
});
