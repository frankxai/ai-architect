#!/usr/bin/env node
// Local stdio MCP server for AI Architect gate checks.
// No model calls. No network sockets.
// architect_init may copy SOP.md and WORKFLOW.md into <root>/docs/architecture/.
// Other tools only read that tree or run local node scripts.
//
// Tools:
//   architect_status            — next incomplete stage from architecture.json
//   architect_check_artifacts   — runs scripts/check-artifacts.mjs
//   architect_check_roi         — runs scripts/check-roi.mjs
//   architect_next_stage        — returns the router hint, does not run agents
//   architect_init              — copies SOP/WORKFLOW once via the conductor
//   architect_card              — dispatch card JSON, does not spawn a model
//   catalog_patterns            — list the multi-cloud workload patterns
//   catalog_realization         — one pattern resolved onto one provider
//   catalog_view                — Mermaid, sequence, React Flow, Structurizr or diagrams.net text
//
// Configure as a local stdio server. Do not host this.
// Caller-supplied `root` is a local filesystem path. This server does not
// make network calls. Treat it as machine-local only.

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { nextIncomplete, parseWorkflow } from '../scripts/parse-workflow.mjs';
import { load, validate, resolve, mermaidFlow, mermaidSequence, reactFlow, structurizr, drawio, deployUrl } from '../catalog/compile.mjs';

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
  {
    name: 'architect_init',
    description: 'Copy SOP.md and WORKFLOW.md into docs/architecture/ once. Mechanical. Does not call a model.',
    inputSchema: {
      type: 'object',
      properties: {
        root: { type: 'string' },
      },
    },
  },
  {
    name: 'architect_card',
    description: 'Print the conductor dispatch card for the next incomplete stage. Does not spawn a model.',
    inputSchema: {
      type: 'object',
      properties: {
        root: { type: 'string' },
      },
    },
  },
  {
    name: 'catalog_patterns',
    description: 'List the multi-cloud workload patterns: id, title, customer job, sophistication and the mean judgement score per provider. Reads the bundled catalog only.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'catalog_realization',
    description: 'Resolve one pattern onto one provider: service per component, scores with rationale, consumption drivers, services to confirm, and the one-click template when one exists.',
    inputSchema: {
      type: 'object',
      required: ['pattern', 'provider'],
      properties: { pattern: { type: 'string' }, provider: { type: 'string' } },
    },
  },
  {
    name: 'catalog_view',
    description: 'Return a generated view as text: mermaid (flowchart), sequence (journey and handoffs), reactflow (JSON), structurizr (C4 DSL with every provider as a deployment environment) or drawio (XML).',
    inputSchema: {
      type: 'object',
      required: ['pattern', 'format'],
      properties: {
        pattern: { type: 'string' },
        provider: { type: 'string', description: 'Required for mermaid, reactflow and drawio.' },
        format: { type: 'string', enum: ['mermaid', 'sequence', 'reactflow', 'structurizr', 'drawio'] },
      },
    },
  },
].map((tool) => ({
  ...tool,
  inputSchema: { ...tool.inputSchema, additionalProperties: false },
  annotations: {
    readOnlyHint: tool.name !== 'architect_init',
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
}));

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
  const index = stages.findIndex((s) => s.stage === row.stage);
  for (let i = 0; i < index; i += 1) {
    const previous = stages[i];
    if (arch?.gates?.[previous.gate]?.status === 'FAIL') {
      return {
        stage: null,
        blocked: true,
        fix_first: previous.gate,
        run: `/architect --stage ${previous.stage}`,
        status: 'FAIL',
      };
    }
  }
  const g = arch?.gates?.[row.gate];
  return { stage: row.stage, gate: row.gate, status: g?.status || 'absent' };
}

function runScript(script, root) {
  const result = spawnSync(process.execPath, [path.join(pluginRoot, 'scripts', script), path.join(root, 'docs', 'architecture')], {
    encoding: 'utf8',
    cwd: root,
    timeout: 15000,
  });
  return {
    exit: result.status ?? 1,
    stdout: (result.stdout || '').slice(0, 8000),
    stderr: (result.stderr || result.error?.message || '').slice(0, 2000),
  };
}

function runConductor(root, command) {
  const result = spawnSync(process.execPath, [
    path.join(pluginRoot, 'scripts', 'architect-conductor.mjs'),
    '--root',
    root,
    '--plugin-root',
    pluginRoot,
    command,
  ], {
    encoding: 'utf8',
    cwd: root,
    timeout: 15000,
  });
  return {
    exit: result.status ?? 1,
    stdout: (result.stdout || '').slice(0, 8000),
    stderr: (result.stderr || result.error?.message || '').slice(0, 2000),
  };
}

let catalogCache = null;
function catalog() {
  if (catalogCache) return catalogCache;
  const cat = load();
  // Read with the latest check date so an overdue review does not hide the data;
  // overdue sources are reported with every answer instead.
  validate(cat, cat.sources.map((s) => s.checked_on).sort().at(-1));
  const today = new Date().toISOString().slice(0, 10);
  catalogCache = { cat, patterns: resolve(cat), stale: cat.sources.filter((s) => s.review_by < today).map((s) => s.id) };
  return catalogCache;
}

function handleCatalog(name, args) {
  const allowed = { catalog_patterns: [], catalog_realization: ['pattern', 'provider'], catalog_view: ['pattern', 'provider', 'format'] }[name];
  if (!args || typeof args !== 'object' || Array.isArray(args) || Object.keys(args).some((k) => !allowed.includes(k))
    || Object.values(args).some((v) => typeof v !== 'string' || !v)) {
    throw new Error(`arguments must be an object with string fields from: ${allowed.join(', ') || 'none'}`);
  }
  const { cat, patterns, stale } = catalog();
  const notice = { state: 'designed architectures; no provider deployment receipts', stale_sources: stale };
  if (name === 'catalog_patterns') {
    return { ...notice, patterns: patterns.map((p) => ({ id: p.id, title: p.title, sophistication: p.sophistication, customer_job: p.customer_job, accepted_result: p.accepted_result, scores: Object.fromEntries(Object.entries(p.realizations).map(([k, r]) => [k, r.mean_score])) })) };
  }
  const pat = patterns.find((p) => p.id === args.pattern);
  if (!pat) throw new Error(`unknown pattern; choose one of: ${patterns.map((p) => p.id).join(', ')}`);
  const providers = cat.providers.providers.map((p) => p.id);
  if (args.provider !== undefined && !providers.includes(args.provider)) throw new Error(`unknown provider; choose one of: ${providers.join(', ')}`);
  if (name === 'catalog_realization') {
    if (!args.provider) throw new Error('provider is required');
    const r = pat.realizations[args.provider];
    const template = r.template ? cat.templates.find((t) => t.id === r.template) : null;
    return {
      ...notice, pattern: pat.id, provider: args.provider, headline: r.headline, notes: r.notes, scores: r.scores, rationale: r.rationale,
      components: pat.components.map((c) => ({ id: c.id, role: c.role, label: c.label, service: r.bindings[c.id] })),
      consumption_drivers: r.consumption_drivers, confirm_before_use: r.caution, economics: pat.economics.computed,
      template: template ? { id: template.id, deploy_url: deployUrl(template), evidence: template.evidence, not_verified: template.not_verified } : null,
    };
  }
  if (['mermaid', 'reactflow', 'drawio'].includes(args.format) && !args.provider) throw new Error(`${args.format} needs a provider`);
  const text = {
    mermaid: () => mermaidFlow(cat, pat, args.provider),
    sequence: () => mermaidSequence(pat),
    reactflow: () => JSON.stringify(reactFlow(pat, args.provider), null, 2),
    structurizr: () => structurizr(cat, pat),
    drawio: () => drawio(cat, pat, args.provider),
  }[args.format];
  if (!text) throw new Error('format must be mermaid, sequence, reactflow, structurizr or drawio');
  return { ...notice, pattern: pat.id, provider: args.provider ?? null, format: args.format, text: text() };
}

function handleTool(name, args = {}) {
  if (name.startsWith('catalog_')) return handleCatalog(name, args);
  if (!args || typeof args !== 'object' || Array.isArray(args)
    || (args.root !== undefined && (typeof args.root !== 'string' || !args.root))
    || Object.keys(args).some((key) => key !== 'root')) {
    throw new Error('arguments must be an object with an optional nonempty root string');
  }
  const root = path.resolve(args.root || process.cwd());
  if (!existsSync(root) || !statSync(root).isDirectory()) {
    throw new Error('root must be an existing customer repository directory');
  }
  if (name === 'architect_status' || name === 'architect_next_stage') {
    const arch = readArch(root);
    const next = nextStage(arch, root);
    return {
      root,
      goal: arch?.goal || null,
      generated_at: arch?.generated_at || null,
      next,
      command: next.blocked
        ? next.run
        : next.stage
          ? `/architect --stage ${next.stage}`
          : '/architect',
    };
  }
  if (name === 'architect_check_artifacts') return runScript('check-artifacts.mjs', root);
  if (name === 'architect_check_roi') return runScript('check-roi.mjs', root);
  if (name === 'architect_init') return runConductor(root, 'init');
  if (name === 'architect_card') return runConductor(root, 'card');
  throw new Error(`unknown tool ${name}`);
}

function respond(id, result) {
  process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id, result })}\n`);
}

function respondError(id, code, message) {
  process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } })}\n`);
}

let buffer = '';
let discarding = false;
const MAX_LINE_CHARS = 1024 * 1024;
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  if (discarding) {
    const end = chunk.indexOf('\n');
    if (end < 0) return;
    chunk = chunk.slice(end + 1);
    discarding = false;
  }
  buffer += chunk;
  let idx;
  while ((idx = buffer.indexOf('\n')) >= 0) {
    const line = buffer.slice(0, idx).trim();
    buffer = buffer.slice(idx + 1);
    if (!line) continue;
    if (line.length > MAX_LINE_CHARS) {
      respondError(null, -32600, 'request too large');
      continue;
    }
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      respondError(null, -32700, 'parse error');
      continue;
    }
    if (!msg || typeof msg !== 'object' || Array.isArray(msg) || msg.jsonrpc !== '2.0'
      || typeof msg.method !== 'string'
      || (msg.id !== undefined && msg.id !== null && typeof msg.id !== 'string' && typeof msg.id !== 'number')) {
      respondError(null, -32600, 'invalid request');
      continue;
    }
    const { id, method, params } = msg;
    if (id === undefined) continue; // JSON-RPC notifications never receive a response.
    if (method === 'initialize') {
      respond(id, {
        protocolVersion: '2025-03-26',
        serverInfo: { name: 'ai-architect', version: '0.1.3' },
        capabilities: { tools: {} },
      });
      continue;
    }
    if (method === 'ping') {
      respond(id, {});
      continue;
    }
    if (method === 'tools/list') {
      respond(id, { tools: TOOLS });
      continue;
    }
    if (method === 'tools/call') {
      if (!params || typeof params.name !== 'string' || !TOOLS.some((tool) => tool.name === params.name)) {
        respondError(id, -32602, 'unknown tool or invalid parameters');
        continue;
      }
      try {
        const data = handleTool(params.name, Object.hasOwn(params, 'arguments') ? params.arguments : {});
        respond(id, {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
          ...(data.exit !== undefined && data.exit !== 0 ? { isError: true } : {}),
        });
      } catch (err) {
        respond(id, { content: [{ type: 'text', text: err.message }], isError: true });
      }
      continue;
    }
    if (id != null) respondError(id, -32601, `method not found: ${method}`);
  }
  if (buffer.length > MAX_LINE_CHARS) {
    buffer = '';
    discarding = true;
    respondError(null, -32600, 'request too large');
  }
});
process.stdin.on('end', () => process.exit(0));
