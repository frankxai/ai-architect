const EXPECTED_COLUMNS = ['stage', 'agent', 'input', 'output', 'gate'];

const OPUS_AGENTS = new Set([
  'principal-architect',
  'trust-reviewer',
  'independent-verifier',
]);

const SONNET_AGENTS = new Set([
  'discovery-analyst',
  'experience-designer',
  'economics-analyst',
  'eval-engineer',
  'delivery-engineer',
]);

export class WorkflowParseError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'WorkflowParseError';
    this.code = 'CORRUPT_WORKFLOW';
    this.details = details;
  }
}

function tableCells(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith('|')) return null;
  const withoutEdges = trimmed.replace(/^\|/, '').replace(/\|$/, '');
  return withoutEdges.split('|').map((cell) => cell.trim());
}

function inlineValue(value) {
  const trimmed = value.trim();
  const match = trimmed.match(/^`([^`]*)`$/);
  return match ? match[1].trim() : trimmed;
}

function isSeparator(cells) {
  return cells.length === EXPECTED_COLUMNS.length
    && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

export function parseWorkflow(markdown) {
  if (typeof markdown !== 'string') {
    throw new WorkflowParseError('workflow content must be a string');
  }

  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  const headingIndex = lines.findIndex((line) => /^##\s+Stage table\s*$/i.test(line.trim()));
  if (headingIndex < 0) {
    throw new WorkflowParseError('missing "## Stage table" heading', { kind: 'missing-heading' });
  }

  const section = [];
  for (let index = headingIndex + 1; index < lines.length; index += 1) {
    if (/^#{1,6}\s+/.test(lines[index].trim())) break;
    section.push(lines[index]);
  }

  const headerIndex = section.findIndex((line) => line.trim().length > 0);
  const header = headerIndex >= 0 ? tableCells(section[headerIndex]) : null;
  const normalizedHeader = header?.map((cell) => inlineValue(cell).toLowerCase());
  if (!header || normalizedHeader.length !== EXPECTED_COLUMNS.length
    || normalizedHeader.some((cell, index) => cell !== EXPECTED_COLUMNS[index])) {
    throw new WorkflowParseError(
      `stage table columns must be: ${EXPECTED_COLUMNS.join(' | ')}`,
      { kind: 'wrong-columns', columns: normalizedHeader || [] },
    );
  }

  const separator = tableCells(section[headerIndex + 1] || '');
  if (!separator || !isSeparator(separator)) {
    throw new WorkflowParseError('stage table is missing a valid separator row', { kind: 'wrong-columns' });
  }

  const stages = [];
  const seenStages = new Set();
  const seenGates = new Set();
  for (const line of section.slice(headerIndex + 2)) {
    if (line.trim().length === 0) {
      if (stages.length > 0) break;
      continue;
    }
    const cells = tableCells(line);
    if (!cells) {
      if (stages.length > 0) break;
      continue;
    }
    if (cells.length !== EXPECTED_COLUMNS.length) {
      throw new WorkflowParseError('stage table row has the wrong number of columns', {
        kind: 'wrong-columns',
        row: line,
      });
    }

    const row = Object.fromEntries(EXPECTED_COLUMNS.map((column, index) => [
      column,
      ['stage', 'agent', 'gate'].includes(column) ? inlineValue(cells[index]) : cells[index],
    ]));
    if (EXPECTED_COLUMNS.some((column) => row[column].length === 0)) {
      throw new WorkflowParseError('stage table rows may not contain empty cells', {
        kind: 'empty-cell',
        row: line,
      });
    }
    if (seenStages.has(row.stage) || seenGates.has(row.gate)) {
      throw new WorkflowParseError('stage ids and gate ids must be unique', {
        kind: 'duplicate-row',
        stage: row.stage,
        gate: row.gate,
      });
    }
    seenStages.add(row.stage);
    seenGates.add(row.gate);
    stages.push(row);
  }

  if (stages.length === 0) {
    throw new WorkflowParseError('stage table has zero rows', { kind: 'zero-rows' });
  }
  return stages;
}

export function nextIncomplete(stages, architectureJson, fromStage = null) {
  let started = !fromStage;
  for (const stage of stages) {
    if (!started) {
      if (stage.stage === fromStage) started = true;
      else continue;
    }
    const gate = architectureJson?.gates?.[stage.gate];
    const skippedWithReason = gate?.status === 'SKIPPED'
      && typeof gate.reason === 'string'
      && gate.reason.trim().length > 0;
    if (gate?.status !== 'PASS' && !skippedWithReason) return stage;
  }
  return null;
}

export function previousGate(stages, nextStage) {
  if (!nextStage) return null;
  const index = stages.findIndex((stage) => stage.stage === nextStage.stage);
  return index > 0 ? stages[index - 1] : null;
}

export function modelForAgent(agent) {
  if (OPUS_AGENTS.has(agent)) return { model: 'opus', judgment: true };
  if (SONNET_AGENTS.has(agent)) return { model: 'sonnet', judgment: false };
  return { model: 'sonnet', judgment: false };
}

export function cliHint(model) {
  if (model === 'opus') {
    return {
      default: 'claude',
      commands: {
        claude: 'claude -p --model opus --effort high',
      },
    };
  }
  return {
    default: 'codex',
    commands: {
      codex: 'codex exec --sandbox workspace-write',
      claude: 'claude -p --model sonnet',
    },
  };
}

export function reasoningEffort(model) {
  if (model === 'opus') return 'high';
  if (model === 'sonnet') return 'medium';
  return 'low';
}

export const WorkflowError = WorkflowParseError;
export const parseStageTable = parseWorkflow;

export const HUMAN_GATES = [
  'publish',
  'external_send',
  'spend',
  'dns',
  'credentials',
  'destructive',
  'legal_ip',
  'brand_identity',
];

export function previousStage(stages, currentStage) {
  const index = stages.findIndex((stage) => stage.stage === currentStage);
  return index > 0 ? stages[index - 1] : null;
}

export function stageById(stages, id) {
  return stages.find((stage) => stage.stage === id) || null;
}

export function commandFileForStage(stage) {
  return `commands/architect-${stage}.md`;
}

export function outputWritePaths(outputCell) {
  return String(outputCell || '')
    .split(',')
    .map((part) => inlineValue(part))
    .filter(Boolean)
    .map((rel) => {
      const cleaned = rel.replace(/^docs\/architecture\//, '');
      if (cleaned.includes('..') || /^(?:[a-zA-Z]:[\\/]|[\\/])/.test(cleaned)) {
        throw new WorkflowParseError(`output path escapes docs/architecture/: ${rel}`, { kind: 'unsafe-output' });
      }
      return `docs/architecture/${cleaned}`;
    });
}
