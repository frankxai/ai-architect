import { parseDocument } from 'yaml';

export const FINAL_GATES = [
  'source_editor', 'developmental_editor', 'humanizer',
  'technical_security_reviewer', 'rights_and_licensing', 'legal_review',
  'independent_verifier', 'accountable_author',
];

export function parseLedger(text) {
  const doc = parseDocument(text, { uniqueKeys: true, strict: true });
  if (doc.errors.length) throw new Error(doc.errors.map((error) => error.message).join('; '));
  return doc.toJS({ maxAliasCount: 0 });
}

export function isCalendarDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

export function validateLedgers({ sources, claims, edition }, today) {
  const failures = [];
  const fail = (message) => failures.push(message);
  const nonempty = (value) => typeof value === 'string' && value.trim().length > 0;
  const checkDate = (value, label, fresh = false) => {
    if (!isCalendarDate(value)) fail(`${label}: missing or invalid calendar date`);
    else if (fresh && value < today) fail(`${label}: stale evidence (${value})`);
  };
  if (!isCalendarDate(today)) throw new Error('today must be a real calendar date');
  for (const [name, document] of Object.entries({ sources, claims, edition })) {
    if (!document || typeof document !== 'object' || Array.isArray(document)) {
      fail(`${name}: expected a mapping`);
    }
  }
  if (failures.length) return failures;
  if (sources.schema !== 'ai-architect-guide-sources/v1') fail('sources: unknown schema');
  if (claims.schema !== 'ai-architect-guide-claims/v1') fail('claims: unknown schema');
  if (edition.schema !== 'ai-architect-guide-edition/v1') fail('edition: unknown schema');
  checkDate(sources.verified_on, 'sources.verified_on');
  checkDate(claims.verified_on, 'claims.verified_on');
  checkDate(edition.verified_on, 'edition.verified_on');
  checkDate(edition.next_source_review_on, 'edition.next_source_review_on', true);

  const records = (value, label, minimum) => {
    if (!Array.isArray(value)) { fail(`${label}: expected a list`); return []; }
    if (value.length < minimum) fail(`${label}: minimum ${minimum} records`);
    return value;
  };
  const sourceIds = new Set();
  for (const source of records(sources.sources, 'sources', 40)) {
    if (!source || typeof source !== 'object') { fail('invalid source record'); continue; }
    if (!/^S\d{2,}$/.test(source.id ?? '')) fail('source: missing or invalid ID');
    if (sourceIds.has(source.id)) fail(`duplicate source ID: ${source.id}`);
    sourceIds.add(source.id);
    for (const field of ['title', 'publisher', 'kind', 'url', 'supports']) {
      if (!nonempty(source[field])) fail(`${source.id}: missing ${field}`);
    }
    try {
      const url = new URL(source.url);
      if (url.protocol !== 'https:' || url.username || url.password) throw new Error('unsafe URL');
    } catch { fail(`${source.id}: invalid HTTPS source URL`); }
    if (!['low', 'medium', 'high'].includes(source.volatility)) fail(`${source.id}: invalid volatility`);
    const accessed = source.accessed_on ?? sources.verified_on;
    checkDate(accessed, `${source.id}.accessed_on`);
    if (accessed > today) fail(`${source.id}: future access date`);
    checkDate(source.review_by, `${source.id}.review_by`, true);
    if (source.review_by < accessed) fail(`${source.id}: review precedes access`);
  }
  const claimIds = new Set();
  const statusByClass = { fact: 'source-supported', inference: 'reasoned', prescription: 'proposed', example: 'illustrative', experience: 'author-confirmed' };
  for (const claim of records(claims.claims, 'claims', 40)) {
    if (!claim || typeof claim !== 'object') { fail('invalid claim record'); continue; }
    if (!/^C\d{3,}$/.test(claim.id ?? '')) fail('claim: missing or invalid ID');
    if (claimIds.has(claim.id)) fail(`duplicate claim ID: ${claim.id}`);
    claimIds.add(claim.id);
    if (!Object.hasOwn(statusByClass, claim.class)) fail(`${claim.id}: invalid claim class`);
    if (!nonempty(claim.statement)) fail(`${claim.id}: missing statement`);
    if (claim.status !== statusByClass[claim.class]) fail(`${claim.id}: status does not match claim class`);
    if (!Array.isArray(claim.sources) || !claim.sources.length) fail(`${claim.id}: missing sources`);
    else for (const id of claim.sources) if (!sourceIds.has(id)) fail(`${claim.id}: unknown source ${id}`);
    checkDate(claim.review_by, `${claim.id}.review_by`, true);
    if (claim.class === 'experience' && !nonempty(claim.approval_record)) fail(`${claim.id}: missing author approval record`);
  }
  if (!['draft', 'candidate', 'released'].includes(edition.status)) fail('edition: invalid status');
  if (!['private-draft', 'public-working-edition', 'final-edition'].includes(edition.publication_state)) fail('edition: invalid publication state');
  for (const gate of FINAL_GATES) {
    const status = edition.required_gates?.[gate];
    if (!['passed', 'pending', 'failed'].includes(status)) fail(`missing or invalid final gate: ${gate}`);
    if (edition.status === 'released' && status !== 'passed') fail(`released edition requires passed gate: ${gate}`);
    if (status === 'passed' && !nonempty(edition.gate_evidence?.[gate])) fail(`passed gate lacks evidence: ${gate}`);
  }
  if (edition.publication_state === 'final-edition' && edition.status !== 'released') fail('final edition must have released status');
  if (edition.status === 'released' && edition.publication_state !== 'final-edition') fail('released status requires final-edition publication state');
  if (edition.publication_state === 'public-working-edition' && edition.status !== 'draft') fail('public working edition must remain draft');
  return failures;
}
