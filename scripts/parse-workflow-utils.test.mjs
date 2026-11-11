import test from 'node:test';
import assert from 'node:assert/strict';
import {
  modelForAgent,
  cliHint,
  reasoningEffort,
  previousStage,
  stageById,
  commandFileForStage,
  previousGate,
} from './parse-workflow.mjs';

const mockStages = [{ stage: 'a' }, { stage: 'b' }, { stage: 'c' }];

test('modelForAgent returns correct properties based on agent', () => {
  assert.deepEqual(modelForAgent('principal-architect'), { model: 'opus', judgment: true });
  assert.deepEqual(modelForAgent('discovery-analyst'), { model: 'sonnet', judgment: false });
  assert.deepEqual(modelForAgent('unknown-agent'), { model: 'sonnet', judgment: false });
});

test('cliHint returns correct properties based on model', () => {
  assert.deepEqual(cliHint('opus'), {
    default: 'claude',
    commands: {
      claude: 'claude -p --model opus --effort high',
    },
  });
  assert.deepEqual(cliHint('sonnet'), {
    default: 'codex',
    commands: {
      codex: 'codex exec --sandbox workspace-write',
      claude: 'claude -p --model sonnet',
    },
  });
});

test('reasoningEffort returns correct effort based on model', () => {
  assert.equal(reasoningEffort('opus'), 'high');
  assert.equal(reasoningEffort('sonnet'), 'medium');
  assert.equal(reasoningEffort('unknown'), 'low');
});

test('previousStage returns the previous stage object or null', () => {
  assert.deepEqual(previousStage(mockStages, 'b'), { stage: 'a' });
  assert.deepEqual(previousStage(mockStages, 'c'), { stage: 'b' });
  assert.equal(previousStage(mockStages, 'a'), null);
  assert.equal(previousStage(mockStages, 'unknown'), null);
});

test('stageById returns the stage object or null', () => {
  assert.deepEqual(stageById(mockStages, 'b'), { stage: 'b' });
  assert.equal(stageById(mockStages, 'unknown'), null);
});

test('commandFileForStage returns the formatted string', () => {
  assert.equal(commandFileForStage('discover'), 'commands/architect-discover.md');
  assert.equal(commandFileForStage('decide'), 'commands/architect-decide.md');
});

test('previousGate returns the previous stage object or null', () => {
  assert.deepEqual(previousGate(mockStages, { stage: 'b' }), { stage: 'a' });
  assert.deepEqual(previousGate(mockStages, { stage: 'c' }), { stage: 'b' });
  assert.equal(previousGate(mockStages, { stage: 'a' }), null);
  assert.equal(previousGate(mockStages, null), null);
});
