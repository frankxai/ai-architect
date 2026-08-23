#!/usr/bin/env node
// Checks that skills/ai-architect-review/SKILL.md is byte-identical to its
// source of truth: the site worktree copy when present locally, else a
// pinned sha256 in scripts/skill-parity.json. Pass --remote to also fetch
// https://www.frankx.ai/skills/ai-architect-review/SKILL.md and compare.

import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const LOCAL_SKILL_PATH = path.join(repoRoot, 'skills', 'ai-architect-review', 'SKILL.md');
const SITE_WORKTREE_PATH =
  'C:\\Users\\frank\\starlight\\repos\\.worktrees\\frankx-ai-architect-team\\public\\skills\\ai-architect-review\\SKILL.md';
const PINNED_HASH_PATH = path.join(__dirname, 'skill-parity.json');
const REMOTE_URL = 'https://www.frankx.ai/skills/ai-architect-review/SKILL.md';

const remoteFlag = process.argv.includes('--remote');

function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

function fail(message) {
  console.log(`FAIL skill-parity: ${message}`);
  process.exit(1);
}

if (!existsSync(LOCAL_SKILL_PATH)) {
  fail(`missing ${path.relative(repoRoot, LOCAL_SKILL_PATH)}`);
}

const localHash = sha256(readFileSync(LOCAL_SKILL_PATH));

let referenceHash;
let referenceLabel;

if (existsSync(SITE_WORKTREE_PATH)) {
  referenceHash = sha256(readFileSync(SITE_WORKTREE_PATH));
  referenceLabel = `site worktree (${SITE_WORKTREE_PATH})`;
} else if (existsSync(PINNED_HASH_PATH)) {
  const pinned = JSON.parse(readFileSync(PINNED_HASH_PATH, 'utf8'));
  referenceHash = pinned.sha256;
  referenceLabel = `pinned hash (scripts/skill-parity.json, recorded ${pinned.recorded_at})`;
} else {
  fail(`no site worktree at ${SITE_WORKTREE_PATH} and no pinned hash at scripts/skill-parity.json`);
}

console.log('skill-parity: ai-architect-review/SKILL.md');
console.log(`  local     ${localHash}`);
console.log(`  reference ${referenceHash}  [${referenceLabel}]`);

let ok = localHash === referenceHash;
console.log(ok ? '  PASS local vs reference' : '  FAIL local vs reference: hashes differ');

if (remoteFlag) {
  try {
    const res = await fetch(REMOTE_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const remoteHash = sha256(Buffer.from(await res.arrayBuffer()));
    console.log(`  remote    ${remoteHash}  [${REMOTE_URL}]`);
    if (remoteHash !== localHash) {
      console.log('  FAIL local vs remote: hashes differ');
      ok = false;
    } else {
      console.log('  PASS local vs remote');
    }
  } catch (err) {
    console.log(`  SKIPPED remote check: fetch failed (${err.message})`);
  }
}

process.exit(ok ? 0 : 1);
