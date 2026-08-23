#!/usr/bin/env node
// Builds data/team.json from team/ai-architect-team.json and each
// agents/*.md file's frontmatter and body sections.
//
// Usage: node scripts/build-team-json.mjs
//
// For each agents/*.md: id is the file's basename, name is the H1 heading,
// purpose is the body of "## Purpose", writes is the fenced code block under
// "## Write scope", stops_when is the numbered list under "## Stop
// conditions", and model comes from the frontmatter.
//
// Cross-checks the file set against team/ai-architect-team.json's
// role_scope_refs and warns (does not fail) on any mismatch, since that
// file is the team's own source of truth for who is on the roster.

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const agentsDir = path.join(repoRoot, 'agents');
const teamJsonPath = path.join(repoRoot, 'team', 'ai-architect-team.json');
const outPath = path.join(repoRoot, 'data', 'team.json');

function fail(message) {
  console.error(`FAIL build-team-json: ${message}`);
  process.exit(1);
}

function readFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const fm = {};
  let currentKey = null;
  for (const line of match[1].split('\n')) {
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (kv) {
      currentKey = kv[1];
      fm[currentKey] = kv[2].trim();
    } else if (currentKey && /^\s+/.test(line)) {
      fm[currentKey] += ' ' + line.trim();
    }
  }
  return fm;
}

// Returns the raw text of the named "## Heading" section, up to the next
// "## " heading or end of file.
function readSection(content, heading) {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const startIdx = lines.findIndex((l) => l.trim() === `## ${heading}`);
  if (startIdx === -1) return null;
  const rest = lines.slice(startIdx + 1);
  const endIdx = rest.findIndex((l) => l.startsWith('## '));
  return (endIdx === -1 ? rest : rest.slice(0, endIdx)).join('\n');
}

function readH1(content) {
  const match = content.replace(/\r\n/g, '\n').match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

// "## Purpose" body: drop blank lines, join wrapped lines into paragraphs
// separated by a single space, join paragraphs with two spaces.
function extractPurpose(sectionText) {
  if (!sectionText) return null;
  const paragraphs = sectionText
    .trim()
    .split(/\n\s*\n/)
    .map((p) => p.split('\n').map((l) => l.trim()).filter(Boolean).join(' ').trim())
    .filter(Boolean);
  return paragraphs.join('  ');
}

// "## Write scope" fenced code block: one glob per line.
function extractWrites(sectionText) {
  if (!sectionText) return [];
  const fenceMatch = sectionText.match(/```\n([\s\S]*?)```/);
  if (!fenceMatch) return [];
  return fenceMatch[1]
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

// "## Stop conditions" numbered list: item N starts at "N. ", continuation
// lines are indented under it. Any non-numbered, non-indented line (an
// intro sentence like "Stop, write what you have...") is not an item.
function extractStopsWhen(sectionText) {
  if (!sectionText) return [];
  const lines = sectionText.replace(/\r\n/g, '\n').split('\n');
  const items = [];
  let current = null;
  for (const line of lines) {
    const start = line.match(/^\d+\.\s+(.*)$/);
    if (start) {
      if (current) items.push(current.trim());
      current = start[1].trim();
    } else if (current && /^\s+\S/.test(line)) {
      current += ' ' + line.trim();
    } else if (line.trim() === '' || current) {
      // blank line, or a non-indented line while inside an item: item ends
      if (current) {
        items.push(current.trim());
        current = null;
      }
    }
  }
  if (current) items.push(current.trim());
  return items;
}

if (!existsSync(agentsDir)) fail('agents/ directory not found');
if (!existsSync(teamJsonPath)) fail('team/ai-architect-team.json not found');

let teamRoster = null;
try {
  teamRoster = JSON.parse(readFileSync(teamJsonPath, 'utf8'));
} catch (err) {
  fail(`team/ai-architect-team.json does not parse: ${err.message}`);
}

const rosterIds = new Set(
  (teamRoster.portable_contract?.interfaces?.role_scope_refs || []).map((ref) => ref.replace(/^agent\./, ''))
);

const agentFiles = readdirSync(agentsDir)
  .filter((f) => f.endsWith('.md'))
  .sort();

if (agentFiles.length === 0) fail('no agents/*.md files found');

const agents = agentFiles.map((file) => {
  const filePath = path.join(agentsDir, file);
  const content = readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
  const id = path.basename(file, '.md');
  const fm = readFrontmatter(content);

  if (!fm.name) fail(`${file}: frontmatter missing "name:"`);
  if (!fm.model) fail(`${file}: frontmatter missing "model:"`);

  const purposeSection = readSection(content, 'Purpose');
  const writeScopeSection = readSection(content, 'Write scope');
  const stopSection = readSection(content, 'Stop conditions');

  if (!purposeSection) fail(`${file}: missing "## Purpose" section`);
  if (!writeScopeSection) fail(`${file}: missing "## Write scope" section`);
  if (!stopSection) fail(`${file}: missing "## Stop conditions" section`);

  const purpose = extractPurpose(purposeSection);
  const writes = extractWrites(writeScopeSection);
  const stops_when = extractStopsWhen(stopSection);

  if (writes.length === 0) fail(`${file}: "## Write scope" has no glob lines`);
  if (stops_when.length === 0) fail(`${file}: "## Stop conditions" has no numbered items`);

  return {
    id,
    name: readH1(content) || fm.name,
    purpose,
    writes,
    stops_when,
    model: fm.model,
  };
});

const fileIds = new Set(agents.map((a) => a.id));
const missingFromFiles = [...rosterIds].filter((id) => !fileIds.has(id));
const missingFromRoster = [...fileIds].filter((id) => !rosterIds.has(id));
if (missingFromFiles.length > 0 || missingFromRoster.length > 0) {
  console.warn(
    `WARN build-team-json: agents/*.md and team/ai-architect-team.json role_scope_refs disagree` +
      (missingFromFiles.length ? ` — in roster but no file: ${missingFromFiles.join(', ')}` : '') +
      (missingFromRoster.length ? ` — file but not in roster: ${missingFromRoster.join(', ')}` : '')
  );
}

const output = {
  schema: 'ai-architect.team.v1',
  generated_at: new Date().toISOString().slice(0, 10),
  agents,
};

mkdirSync(path.dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n');

console.log(`build-team-json: wrote ${path.relative(repoRoot, outPath)} (${agents.length} agents)`);
