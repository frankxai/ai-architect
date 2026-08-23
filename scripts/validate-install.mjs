#!/usr/bin/env node
// Gate: validates the plugin's own installable surface, not a customer's
// docs/architecture output (that is scripts/check-artifacts.mjs).
//
// Checks:
//   - .claude-plugin/plugin.json and marketplace.json parse, and the
//     marketplace's plugin entry name matches plugin.json's name
//   - every commands/*.md has "description:" and "argument-hint:" frontmatter
//   - every agents/*.md has "name:", "description:", and "model:" frontmatter
//   - every skills/*/SKILL.md has "name:" and "description:" frontmatter
//
// Prints a gate table. Exits 1 on any FAIL.

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const rows = [];
function check(name, ok, detail) {
  rows.push({ name, status: ok ? 'PASS' : 'FAIL', detail: detail || '' });
  return ok;
}

function readFrontmatter(filePath) {
  const content = readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const fm = {};
  let currentKey = null;
  for (const line of match[1].split('\n')) {
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (kv) {
      currentKey = kv[1];
      fm[currentKey] = kv[2].trim();
    } else if (currentKey && /^\s+/.test(line)) {
      // continuation of a folded/multi-line value; ignore for presence checks
      fm[currentKey] += ' ' + line.trim();
    }
  }
  return fm;
}

function listMarkdownFiles(dir) {
  const full = path.join(repoRoot, dir);
  if (!existsSync(full)) return [];
  return readdirSync(full)
    .filter((f) => f.endsWith('.md'))
    .map((f) => path.join(dir, f));
}

// 1. plugin.json parses and has a name
const pluginJsonPath = path.join(repoRoot, '.claude-plugin', 'plugin.json');
let pluginJson = null;
if (!existsSync(pluginJsonPath)) {
  check('.claude-plugin/plugin.json exists', false, 'missing');
} else {
  try {
    pluginJson = JSON.parse(readFileSync(pluginJsonPath, 'utf8'));
    check('.claude-plugin/plugin.json parses', true);
    check('.claude-plugin/plugin.json: has name', typeof pluginJson.name === 'string' && pluginJson.name.length > 0, String(pluginJson.name));
  } catch (err) {
    check('.claude-plugin/plugin.json parses', false, err.message);
  }
}

// 2. marketplace.json parses, has a matching plugin entry
const marketplaceJsonPath = path.join(repoRoot, '.claude-plugin', 'marketplace.json');
if (!existsSync(marketplaceJsonPath)) {
  check('.claude-plugin/marketplace.json exists', false, 'missing');
} else {
  try {
    const marketplace = JSON.parse(readFileSync(marketplaceJsonPath, 'utf8'));
    check('.claude-plugin/marketplace.json parses', true);
    check('.claude-plugin/marketplace.json: has name', typeof marketplace.name === 'string' && marketplace.name.length > 0);
    check(
      '.claude-plugin/marketplace.json: has owner',
      marketplace.owner && typeof marketplace.owner === 'object' && typeof marketplace.owner.name === 'string'
    );
    const plugins = Array.isArray(marketplace.plugins) ? marketplace.plugins : [];
    check('.claude-plugin/marketplace.json: plugins is a non-empty array', plugins.length > 0);
    const entry = plugins.find((p) => pluginJson && p.name === pluginJson.name);
    check(
      'marketplace plugin entry name matches plugin.json name',
      Boolean(entry),
      entry ? `matched "${entry.name}"` : `no entry named "${pluginJson ? pluginJson.name : '(plugin.json missing)'}"`
    );
    if (entry) {
      check(`marketplace entry "${entry.name}": has source`, typeof entry.source === 'string' && entry.source.length > 0);
    }
  } catch (err) {
    check('.claude-plugin/marketplace.json parses', false, err.message);
  }
}

// 3. commands/*.md frontmatter
const commandFiles = listMarkdownFiles('commands');
check('commands/: at least one command file found', commandFiles.length > 0, `${commandFiles.length} found`);
for (const rel of commandFiles) {
  const fm = readFrontmatter(path.join(repoRoot, rel));
  if (!fm) {
    check(`${rel}: has frontmatter`, false, 'no --- frontmatter block found');
    continue;
  }
  check(`${rel}: has description`, typeof fm.description === 'string' && fm.description.length > 0);
  check(`${rel}: has argument-hint`, typeof fm['argument-hint'] === 'string' && fm['argument-hint'].length > 0);
}

// 4. agents/*.md frontmatter
const agentFiles = listMarkdownFiles('agents');
check('agents/: at least one agent file found', agentFiles.length > 0, `${agentFiles.length} found`);
for (const rel of agentFiles) {
  const fm = readFrontmatter(path.join(repoRoot, rel));
  if (!fm) {
    check(`${rel}: has frontmatter`, false, 'no --- frontmatter block found');
    continue;
  }
  check(`${rel}: has name`, typeof fm.name === 'string' && fm.name.length > 0);
  check(`${rel}: has description`, typeof fm.description === 'string' && fm.description.length > 0);
  check(`${rel}: has model`, typeof fm.model === 'string' && fm.model.length > 0, fm.model || 'missing');
}

// 5. skills/*/SKILL.md frontmatter
const skillsRoot = path.join(repoRoot, 'skills');
const skillDirs = existsSync(skillsRoot)
  ? readdirSync(skillsRoot, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name)
  : [];
check('skills/: at least one skill directory found', skillDirs.length > 0, `${skillDirs.length} found`);
for (const dir of skillDirs) {
  const rel = path.join('skills', dir, 'SKILL.md');
  const full = path.join(repoRoot, rel);
  if (!existsSync(full)) {
    check(`${rel}: exists`, false, 'missing SKILL.md');
    continue;
  }
  const fm = readFrontmatter(full);
  if (!fm) {
    check(`${rel}: has frontmatter`, false, 'no --- frontmatter block found');
    continue;
  }
  check(`${rel}: has name`, typeof fm.name === 'string' && fm.name.length > 0);
  check(`${rel}: has description`, typeof fm.description === 'string' && fm.description.length > 0);
}

// print gate table
const nameWidth = Math.max(...rows.map((r) => r.name.length), 20);
console.log('validate-install');
console.log(`${'check'.padEnd(nameWidth)}  status    detail`);
console.log('-'.repeat(nameWidth + 60));
for (const r of rows) {
  console.log(`${r.name.padEnd(nameWidth)}  ${r.status.padEnd(8)}  ${r.detail}`);
}
console.log('-'.repeat(nameWidth + 60));
const failCount = rows.filter((r) => r.status === 'FAIL').length;
console.log(`${rows.length} checks, ${rows.length - failCount} pass, ${failCount} fail`);

process.exit(failCount > 0 ? 1 : 0);
