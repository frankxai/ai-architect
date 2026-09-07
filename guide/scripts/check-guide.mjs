import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { parseLedger, validateLedgers } from './validate-ledgers.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const guideRoot = path.resolve(here, '..');
const manuscriptRoot = path.join(guideRoot, 'manuscript');
const failures = [];
const notes = [];

const requiredChapters = [
  '00-reading-contract.md',
  '01-the-architects-job.md',
  '02-four-decisions.md',
  '03-seven-planes.md',
  '04-model-plane.md',
  '05-context-plane.md',
  '06-tool-plane.md',
  '07-orchestration-plane.md',
  '08-evaluation-plane.md',
  '09-observability-plane.md',
  '10-experience-plane.md',
  '11-economics.md',
  '12-reference-architecture.md',
  '13-ninety-day-adoption.md',
  'appendix-a-model-snapshot.md',
  'appendix-b-decision-records.md',
];

const bannedWords = [
  'delve', 'tapestry', 'leverage', 'utilize', 'robust', 'seamless', 'realm',
  'testament', 'beacon', 'underscore', 'showcase', 'pivotal', 'crucial',
  'foster', 'elevate', 'embark', 'unleash', 'navigate', 'landscape', 'boast',
  'myriad', 'plethora', 'intricate', 'vibrant', 'enhance', 'streamline',
  'optimize', 'comprehensive', 'empower', 'holistic', 'cultivate', 'resonate',
  'align', 'nestled',
];

const bannedPhrases = [
  "in today's fast-paced world",
  'when it comes to',
  "it's important to note",
  'plays a crucial role in',
  'at the end of the day',
  'the world of',
  'more than just',
  'unlock the power of',
  'elevate your',
  'take it to the next level',
  'supercharge',
  'move the needle',
  'deep dive',
  'low-hanging fruit',
  'circle back',
  'best-in-class',
  'in conclusion',
  'a journey',
  'treasure trove',
  'the possibilities are endless',
  'imagine a world where',
  'have you ever wondered',
  'picture this',
  'so there you have it',
  "let's dive in",
  "here's the thing",
  "here's the kicker",
  "but here's where it gets interesting",
  'let that sink in',
  'plot twist',
  'trust me',
];

function read(relativePath) {
  return fs.readFileSync(path.join(guideRoot, relativePath), 'utf8');
}

function words(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]+`/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .match(/[\p{L}\p{N}][\p{L}\p{N}'-]*/gu)?.length ?? 0;
}

function lineOf(text, index) {
  return text.slice(0, index).split('\n').length;
}

for (const chapter of requiredChapters) {
  const fullPath = path.join(manuscriptRoot, chapter);
  if (!fs.existsSync(fullPath)) {
    failures.push(`missing chapter: ${chapter}`);
    continue;
  }

  const text = fs.readFileSync(fullPath, 'utf8');
  const count = words(text);
  if (count < 400) failures.push(`${chapter}: ${count} words, minimum is 400`);
  notes.push(`${chapter}: ${count} words`);

  if (text.includes('—')) failures.push(`${chapter}: contains an em dash`);
  if (/\b(?:TODO|TBD|FIXME|XXX)\b/i.test(text)) failures.push(`${chapter}: contains a placeholder token`);

  for (const word of bannedWords) {
    const match = new RegExp(`\\b${word}\\b`, 'i').exec(text);
    if (match) failures.push(`${chapter}:${lineOf(text, match.index)} banned word: ${word}`);
  }

  const lower = text.toLowerCase();
  for (const phrase of bannedPhrases) {
    const index = lower.indexOf(phrase);
    if (index >= 0) failures.push(`${chapter}:${lineOf(text, index)} banned phrase: ${phrase}`);
  }
}

function markdownFiles(root) {
  const files = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...markdownFiles(fullPath));
    if (entry.isFile() && entry.name.endsWith('.md')) files.push(fullPath);
  }
  return files;
}

for (const file of markdownFiles(guideRoot)) {
  const text = fs.readFileSync(file, 'utf8');
  const relative = path.relative(guideRoot, file);

  if (text.includes('—')) failures.push(`${relative}: contains an em dash`);

  for (const word of bannedWords) {
    const match = new RegExp(`\\b${word}\\b`, 'i').exec(text);
    if (match) failures.push(`${relative}:${lineOf(text, match.index)} banned word: ${word}`);
  }

  const lower = text.toLowerCase();
  for (const phrase of bannedPhrases) {
    const index = lower.indexOf(phrase);
    if (index >= 0) failures.push(`${relative}:${lineOf(text, index)} banned phrase: ${phrase}`);
  }

  for (const match of text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const target = match[1].trim();
    if (/^(?:https?:|mailto:|#)/.test(target)) continue;
    const fileTarget = target.split('#')[0];
    if (!fileTarget) continue;
    const resolved = path.resolve(path.dirname(file), fileTarget);
    if (!fs.existsSync(resolved)) {
      failures.push(`${path.relative(guideRoot, file)}:${lineOf(text, match.index)} broken local link: ${target}`);
    } else {
      const repositoryRoot = fs.realpathSync(path.resolve(guideRoot, '..'));
      const actual = fs.realpathSync(resolved);
      const relativeActual = path.relative(repositoryRoot, actual);
      if (relativeActual === '..' || relativeActual.startsWith(`..${path.sep}`) || path.isAbsolute(relativeActual)) {
        failures.push(`${relative}: local link escapes repository: ${target}`);
      }
      if (actual !== resolved) failures.push(`${relative}: local link traverses a symlink: ${target}`);
    }
  }
}

const sourcesText = read('research/sources.yaml');
const claimsText = read('research/claims.yaml');
const editionText = read('edition.yaml');
let ledgers;
try {
  ledgers = { sources: parseLedger(sourcesText), claims: parseLedger(claimsText), edition: parseLedger(editionText) };
} catch (error) {
  console.error(`AI Architect Guide quality gate: FAIL\nInvalid YAML: ${error.message}`);
  process.exit(1);
}
failures.push(...validateLedgers(ledgers, new Date().toISOString().slice(0, 10)));
const sourceIds = new Set((ledgers.sources?.sources ?? []).map((source) => source?.id));
const claimIds = (ledgers.claims?.claims ?? []).map((claim) => claim?.id);

for (const file of markdownFiles(guideRoot)) {
  const text = fs.readFileSync(file, 'utf8');
  for (const match of text.matchAll(/\bC\d{3,}\b/g)) {
    if (!claimIds.includes(match[0])) failures.push(`${path.relative(guideRoot, file)}: unknown claim marker ${match[0]}`);
  }
}

for (const chapter of requiredChapters) {
  const fullPath = path.join(manuscriptRoot, chapter);
  if (!fs.existsSync(fullPath)) continue;
  const text = fs.readFileSync(fullPath, 'utf8');
  for (const match of text.matchAll(/\bS\d{2}\b/g)) {
    if (!sourceIds.has(match[0])) failures.push(`${chapter}: unknown source marker ${match[0]}`);
  }
}

for (const file of [
  'editorial/constitution.md',
  'editorial/review-gates.md',
  'editorial/ai-contribution.md',
  'publishing/README.md',
  'publishing/channel-map.yaml',
  'publishing/content-graph.yaml',
  'publishing/monthly-brief-template.md',
  'publishing/annual-ultimate-template.md',
  'strategy/coverage-gap-audit.md',
  'strategy/authority-system.md',
  'strategy/personal-book-brief.md',
  'releases/2026-0-1-draft.md',
]) {
  if (!fs.existsSync(path.join(guideRoot, file))) failures.push(`missing publishing-system file: ${file}`);
}

if (failures.length) {
  console.error('AI Architect Guide quality gate: FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('AI Architect Guide quality gate: PASS');
console.log(`- ${requiredChapters.length} manuscript files`);
console.log(`- ${sourceIds.size} sources`);
console.log(`- ${claimIds.length} claims`);
console.log('- Mechanical checks only: no assertion of complete claim coverage, source truth, or human approval');
for (const note of notes) console.log(`- ${note}`);
