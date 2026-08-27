#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  WorkflowParseError,
  cliHint,
  modelForAgent,
  nextIncomplete,
  parseWorkflow,
  reasoningEffort,
} from './parse-workflow.mjs';

const COMMANDS = new Set(['status', 'next', 'card', 'check', 'init']);
const HUMAN_GATE_HEADING = /^##\s+Human gates\s*$/i;
const DECISION_FIX_ORDER = ['trust', 'run', 'loop', 'model'];
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const defaultPluginRoot = path.resolve(scriptDir, '..');

class ConductorError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'ConductorError';
    this.code = code;
    this.details = details;
  }
}

function parseArgs(argv) {
  const options = {
    root: process.cwd(),
    pluginRoot: defaultPluginRoot,
    stage: null,
    from: null,
    command: null,
    goalParts: [],
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const names = {
      '--root': 'root',
      '--plugin-root': 'pluginRoot',
      '--stage': 'stage',
      '--from': 'from',
    };
    if (names[arg]) {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) {
        throw new ConductorError('invalid-arguments', `${arg} requires a value`);
      }
      options[names[arg]] = value;
      index += 1;
      continue;
    }
    if (COMMANDS.has(arg)) {
      if (options.command) {
        throw new ConductorError('invalid-arguments', 'provide exactly one command');
      }
      options.command = arg;
      continue;
    }
    if (arg.startsWith('--')) {
      throw new ConductorError('invalid-arguments', `unknown option: ${arg}`);
    }
    options.goalParts.push(arg);
  }
  if (!options.command) {
    throw new ConductorError('invalid-arguments', 'command must be one of: status, next, card, check, init');
  }
  if (options.stage && options.from) {
    throw new ConductorError('invalid-arguments', '--stage and --from are mutually exclusive');
  }
  return {
    ...options,
    root: path.resolve(options.root),
    pluginRoot: path.resolve(options.pluginRoot),
    offeredGoal: options.goalParts.join(' ').trim() || null,
  };
}

function assertDirectory(directory, label) {
  if (!existsSync(directory) || !statSync(directory).isDirectory()) {
    throw new ConductorError('invalid-directory', `${label} must be an existing directory`, {
      [label]: directory,
    });
  }
}

function contractPath(root, pluginRoot, filename) {
  const customerPath = path.join(root, 'docs', 'architecture', filename);
  if (existsSync(customerPath)) return customerPath;
  const templatePath = path.join(pluginRoot, 'templates', filename);
  if (!existsSync(templatePath)) {
    throw new ConductorError('missing-contract', `missing ${filename} in customer and plugin roots`);
  }
  return templatePath;
}

function readArchitecture(root) {
  const architecturePath = path.join(root, 'docs', 'architecture', 'architecture.json');
  if (!existsSync(architecturePath)) return null;
  try {
    return JSON.parse(readFileSync(architecturePath, 'utf8'));
  } catch (error) {
    throw new ConductorError('invalid-architecture-json', error.message, { path: architecturePath });
  }
}

function markdownCells(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith('|')) return null;
  return trimmed.replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());
}

function unquote(value) {
  const match = value.trim().match(/^`([^`]*)`$/);
  return match ? match[1].trim() : value.trim();
}

function humanGates(sop) {
  const lines = sop.replace(/\r\n?/g, '\n').split('\n');
  const heading = lines.findIndex((line) => HUMAN_GATE_HEADING.test(line.trim()));
  if (heading < 0) throw new ConductorError('corrupt-sop', 'missing "## Human gates" heading');
  const section = [];
  for (let index = heading + 1; index < lines.length; index += 1) {
    if (/^#{1,6}\s+/.test(lines[index].trim())) break;
    section.push(lines[index]);
  }
  const rows = section.map(markdownCells).filter(Boolean);
  const header = rows.findIndex((cells) => cells.map((cell) => cell.toLowerCase()).join('|') === 'gate|covers');
  if (header < 0 || !rows[header + 1]?.every((cell) => /^:?-{3,}:?$/.test(cell))) {
    throw new ConductorError('corrupt-sop', 'human gates table is corrupt');
  }
  const gates = [];
  for (const cells of rows.slice(header + 2)) {
    if (cells.length !== 2) continue;
    gates.push(unquote(cells[0]));
  }
  if (gates.length === 0) throw new ConductorError('corrupt-sop', 'human gates table has zero rows');
  return gates;
}

function selectStage(stages, architecture, options) {
  if (options.stage) {
    const exact = stages.find((stage) => stage.stage === options.stage);
    if (!exact) throw new ConductorError('unknown-stage', `unknown stage: ${options.stage}`);
    return { stage: exact, emptyReason: null };
  }
  if (options.from) {
    const index = stages.findIndex((stage) => stage.stage === options.from);
    if (index < 0) throw new ConductorError('unknown-stage', `unknown stage: ${options.from}`);
    return { stage: nextIncomplete(stages.slice(index), architecture), emptyReason: 'empty' };
  }
  return { stage: nextIncomplete(stages, architecture), emptyReason: 'complete' };
}

function stageStatus(stage, architecture) {
  return architecture?.gates?.[stage.gate]?.status || 'absent';
}

function stageSummary(stage, architecture) {
  if (!stage) return null;
  return {
    stage: stage.stage,
    agent: stage.agent,
    gate: stage.gate,
    input: stage.input,
    output: stage.output,
    status: stageStatus(stage, architecture),
  };
}

function blockFor(stages, stage, architecture) {
  if (!stage) return null;
  const index = stages.findIndex((row) => row.stage === stage.stage);
  for (let i = 0; i < index; i += 1) {
    const previous = stages[i];
    const gateState = architecture?.gates?.[previous.gate];
    if (gateState?.status !== 'FAIL') continue;
    let fixFirst = previous.gate;
    if (previous.gate === 'gate.decisions') {
      const decision = DECISION_FIX_ORDER.find((key) => architecture?.decisions?.[key]?.verdict === 'OPEN');
      if (decision) fixFirst = `${previous.gate}/${decision}`;
    }
    return {
      blocked: true,
      fix_first: fixFirst,
      missing: gateState.missing || gateState.reason || 'an earlier gate failed',
      run: `/architect-${previous.stage}`,
    };
  }
  return null;
}

function outputTokens(output) {
  const quoted = [...String(output).matchAll(/`([^`]+)`/g)].map((match) => match[1].trim()).filter(Boolean);
  if (quoted.length > 0) return quoted;
  return String(output)
    .split(',')
    .map((part) => part.trim())
    .filter((part) => /^[\w./{}*+-]+$/.test(part));
}

function isContained(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function writePaths(root, output) {
  const artifactRoot = path.resolve(root, 'docs', 'architecture');
  return outputTokens(output).map((relativePath) => {
    const unix = String(relativePath).replace(/\\/g, '/').replace(/^\.?\//, '');
    const stripped = unix.replace(/^docs\/architecture\//, '');
    if (!stripped || stripped.includes('\0') || path.isAbsolute(stripped) || path.win32.isAbsolute(stripped)) {
      throw new ConductorError('unsafe-write-path', `output path is not artifact-relative: ${relativePath}`);
    }
    if (stripped.split('/').some((seg) => seg === '..')) {
      throw new ConductorError('unsafe-write-path', `output path escapes docs/architecture: ${relativePath}`);
    }
    const target = path.resolve(artifactRoot, stripped);
    if (!isContained(artifactRoot, target)) {
      throw new ConductorError('unsafe-write-path', `output path escapes docs/architecture: ${relativePath}`);
    }
    return path.posix.join('docs', 'architecture', stripped);
  });
}

function commandFile(pluginRoot, stage) {
  const candidate = path.resolve(pluginRoot, 'commands', `architect-${stage.stage}.md`);
  const commandRoot = path.resolve(pluginRoot, 'commands');
  if (!isContained(commandRoot, candidate)) {
    throw new ConductorError('unsafe-command-path', `stage id produces an unsafe command path: ${stage.stage}`);
  }
  return existsSync(candidate) ? candidate : null;
}

function dispatchCard(root, pluginRoot, stage, architecture, gates) {
  const routing = modelForAgent(stage.agent);
  const hint = cliHint(routing.model);
  return {
    stage: stage.stage,
    agent: stage.agent,
    gate: stage.gate,
    goal: architecture?.goal || null,
    model: routing.model,
    judgment: routing.judgment,
    reasoning_effort: reasoningEffort(routing.model),
    cli: {
      default: hint.default,
      claude: hint.commands.claude,
      codex: hint.commands.codex || hint.commands.claude,
    },
    write_paths: writePaths(root, stage.output),
    stop_if_previous_gate_fail: true,
    human_gates: gates,
    command_file: commandFile(pluginRoot, stage),
  };
}

function runCheck(root, pluginRoot) {
  const artifactRoot = path.join(root, 'docs', 'architecture');
  if (!existsSync(artifactRoot)) return { ok: true, skipped: 'no-architecture-dir' };
  const result = spawnSync(process.execPath, [
    path.join(pluginRoot, 'scripts', 'check-artifacts.mjs'),
    artifactRoot,
  ], {
    cwd: root,
    encoding: 'utf8',
  });
  const exit = result.status ?? 1;
  return {
    ok: exit === 0,
    exit,
    stdout: result.stdout || '',
    stderr: result.stderr || result.error?.message || '',
  };
}

function print(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

export function run(argv = process.argv.slice(2)) {
  let options;
  try {
    options = parseArgs(argv);
    assertDirectory(options.root, 'root');
    assertDirectory(options.pluginRoot, 'plugin-root');

    if (options.command === 'init') {
      const archDir = path.join(options.root, 'docs', 'architecture');
      mkdirSync(archDir, { recursive: true });
      const written = [];
      const skipped = [];
      for (const name of ['SOP.md', 'WORKFLOW.md']) {
        const dest = path.join(archDir, name);
        const src = path.join(options.pluginRoot, 'templates', name);
        if (!existsSync(src)) {
          throw new ConductorError('missing-contract', `missing templates/${name}`);
        }
        if (existsSync(dest)) skipped.push(name);
        else {
          copyFileSync(src, dest);
          written.push(name);
        }
      }
      print({ ok: true, written, skipped });
      return 0;
    }

    const sopPath = contractPath(options.root, options.pluginRoot, 'SOP.md');
    process.stderr.write(`sop: ${sopPath}\n`);
    const sop = readFileSync(sopPath, 'utf8');
    const gates = humanGates(sop);
    const workflowPath = contractPath(options.root, options.pluginRoot, 'WORKFLOW.md');
    const stages = parseWorkflow(readFileSync(workflowPath, 'utf8'));
    const architecture = readArchitecture(options.root);

    if (options.offeredGoal && architecture && architecture.goal !== options.offeredGoal) {
      print({
        error: 'goal-mismatch',
        existing: architecture.goal ?? null,
        offered: options.offeredGoal,
      });
      return 3;
    }

    const selected = selectStage(stages, architecture, options);
    const blocked = selected.stage ? blockFor(stages, selected.stage, architecture) : null;

    if (options.command === 'status') {
      print({
        sop: sopPath,
        workflow: workflowPath,
        goal: architecture?.goal || options.offeredGoal || null,
        gates: architecture?.gates || {},
        next: stageSummary(selected.stage, architecture),
        blocked: Boolean(blocked),
      });
      return 0;
    }

    if (options.command === 'check') {
      const result = runCheck(options.root, options.pluginRoot);
      print(result);
      return result.ok ? 0 : result.exit;
    }

    if (blocked) {
      print(blocked);
      return 2;
    }
    if (!selected.stage) {
      print({ next: null, reason: selected.emptyReason });
      return 0;
    }
    if (options.command === 'next') {
      print({ next: stageSummary(selected.stage, architecture) });
      return 0;
    }
    print(dispatchCard(options.root, options.pluginRoot, selected.stage, architecture, gates));
    return 0;
  } catch (error) {
    if (error instanceof WorkflowParseError) {
      print({ error: 'corrupt-workflow', message: error.message, details: error.details });
      return 1;
    }
    if (error instanceof ConductorError) {
      print({ error: error.code, message: error.message, ...error.details });
      return 1;
    }
    print({ error: 'conductor-failure', message: error.message });
    return 1;
  }
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : null;
if (invokedPath === import.meta.url) process.exitCode = run();
