// Multi-cloud architecture catalog compiler.
// Reads the logical patterns, provider defaults and service registry in this
// directory, validates every reference, resolves each pattern onto each
// provider, and writes portable views plus a hashed manifest. No network, no
// model calls; output is byte-identical for identical input.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(ROOT, '..');
const GRID = { x: 300, y: 180, pad: 40, w: 252, h: 112 };
const KINDS = ['data', 'control', 'telemetry'];
const SOPH = ['A0', 'A1', 'A2', 'A3', 'A4'];
const ACTORS = ['customer', 'agent', 'system', 'reviewer', 'operator'];
const LANES = ['customer', 'ai', 'system', 'reviewer', 'operator'];
const BLOCKS = ['heading', 'input', 'chips', 'status', 'answer', 'actions', 'meta', 'list', 'message', 'table', 'kpis', 'timeline'];
const VERIFICATION = ['source', 'prior', 'inferred'];
const EXTERNAL_ROLES = new Set(['user', 'system']);
const REPOSITORY = 'https://github.com/frankxai/ai-architect';

const readJson = file => JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
const sha256 = data => crypto.createHash('sha256').update(data).digest('hex');
const isId = v => typeof v === 'string' && /^[a-z][a-z0-9-]{0,63}$/.test(v);
const isText = (v, max = 600) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
const esc = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function load() {
  const roles = readJson('roles.json');
  const providers = readJson('providers.json');
  const services = readJson('services.json').services;
  const sources = readJson('sources.json');
  const templates = readJson('templates.json');
  const icons = JSON.parse(fs.readFileSync(path.join(REPO, 'solution-kit/icons/registry.json'), 'utf8'));
  const patternDir = path.join(ROOT, 'patterns');
  const patterns = fs.readdirSync(patternDir).filter(f => f.endsWith('.json')).sort()
    .map(f => ({ file: f, ...JSON.parse(fs.readFileSync(path.join(patternDir, f), 'utf8')) }));
  return { roles, providers, services, sources, templates, icons, patterns };
}

export function validate(cat, today = new Date().toISOString().slice(0, 10)) {
  const errors = [];
  const need = (ok, msg) => { if (!ok) errors.push(msg); };
  const roleIds = new Set(cat.roles.roles.map(r => r.id));
  const layerIds = new Set(cat.roles.layers.map(l => l.id));
  for (const r of cat.roles.roles) {
    need(isId(r.id) && layerIds.has(r.layer) && isText(r.title, 60), `role ${r.id}: invalid`);
    need(typeof r.glyph === 'string' && /^[MLHVCSQTAZmlhvcsqtaz0-9 .,-]+$/.test(r.glyph), `role ${r.id}: glyph must be plain path data`);
  }

  const sourceIds = new Set();
  for (const s of cat.sources) {
    need(isId(s.id) && !sourceIds.has(s.id), `source ${s.id}: duplicate or invalid id`);
    sourceIds.add(s.id);
    need(/^https:\/\//.test(s.url ?? ''), `source ${s.id}: HTTPS URL required`);
    need(isText(s.title, 160) && isText(s.publisher, 80) && isText(s.scoped_claim, 600), `source ${s.id}: title, publisher and claim required`);
    need(['primary-doc', 'search-index', 'secondary', 'prior'].includes(s.verification), `source ${s.id}: unknown verification`);
    need(/^\d{4}-\d{2}-\d{2}$/.test(s.checked_on) && s.checked_on <= today, `source ${s.id}: checked_on must be a past date`);
    need(/^\d{4}-\d{2}-\d{2}$/.test(s.review_by) && s.review_by >= today, `source ${s.id}: review date passed; re-check the source before compiling`);
  }

  const providerIds = new Set(cat.providers.providers.map(p => p.id));
  const serviceById = new Map();
  for (const s of cat.services) {
    need(/^[a-z]+\.[a-z0-9-]+$/.test(s.id) && !serviceById.has(s.id), `service ${s.id}: duplicate or invalid id`);
    serviceById.set(s.id, s);
    need(providerIds.has(s.provider) || s.provider === 'portable', `service ${s.id}: unknown provider`);
    need(s.id.split('.')[0] === ({ cloudflare: 'cf' }[s.provider] ?? s.provider), `service ${s.id}: id prefix does not match provider`);
    need(isText(s.name, 80) && /^https:\/\//.test(s.docs ?? ''), `service ${s.id}: name and HTTPS docs required`);
    need(s.icon === null || Object.hasOwn(cat.icons, s.icon), `service ${s.id}: unknown official icon`);
    need(s.icon === null || s.provider === 'gcp', `service ${s.id}: official icons are only registered for Google Cloud`);
    need(['ga', 'beta', 'preview'].includes(s.status), `service ${s.id}: unknown status`);
    need(VERIFICATION.includes(s.verification), `service ${s.id}: unknown verification`);
    need(s.verification !== 'source' || (Array.isArray(s.sources) && s.sources.length > 0 && s.sources.every(id => sourceIds.has(id))), `service ${s.id}: source verification needs registered sources`);
  }

  const criteria = cat.providers.criteria.map(c => c.id);
  for (const p of cat.providers.providers) {
    need(isId(p.id) && isText(p.name, 60) && isText(p.stance, 400), `provider ${p.id}: identity incomplete`);
    need(['primary', 'secondary'].includes(p.tier), `provider ${p.id}: tier`);
    need(/^#[0-9A-F]{6}$/i.test(p.accent), `provider ${p.id}: accent colour`);
    need(Array.isArray(p.sources) && p.sources.every(id => sourceIds.has(id)), `provider ${p.id}: unknown source`);
    need(Array.isArray(p.consumption_drivers) && p.consumption_drivers.length > 0, `provider ${p.id}: consumption drivers required`);
    for (const role of roleIds) {
      if (EXTERNAL_ROLES.has(role)) continue;
      const sid = p.defaults?.[role];
      need(serviceById.has(sid), `provider ${p.id}: no default service for role ${role}`);
      need(!sid || [p.id, 'portable'].includes(serviceById.get(sid)?.provider), `provider ${p.id}: default ${sid} belongs to another provider`);
    }
    if (p.deploy?.template) need(cat.templates.some(t => t.id === p.deploy.template && t.provider === p.id), `provider ${p.id}: unknown template`);
  }

  for (const t of cat.templates) {
    need(isId(t.id) && providerIds.has(t.provider) && isText(t.title, 120), `template ${t.id}: identity`);
    need(fs.existsSync(path.join(REPO, t.path, 'package.json')), `template ${t.id}: ${t.path} has no package.json`);
    need(['vercel', 'cloudflare', 'cloud-run'].includes(t.button), `template ${t.id}: unknown button kind`);
  }

  const patternIds = new Set();
  for (const pat of cat.patterns) {
    const where = `pattern ${pat.id ?? pat.file}`;
    need(pat.schema === 'ai-architect-pattern/v1', `${where}: schema`);
    need(isId(pat.id) && !patternIds.has(pat.id) && pat.file === `${pat.id}.json`, `${where}: id must be unique and match the file name`);
    patternIds.add(pat.id);
    for (const k of ['title', 'tagline', 'summary', 'customer_job', 'baseline', 'accepted_result']) need(isText(pat[k]), `${where}: ${k} required`);
    need(SOPH.includes(pat.sophistication), `${where}: sophistication`);
    need(Array.isArray(pat.industries) && pat.industries.length > 0 && pat.industries.every(isId), `${where}: industries`);
    need(isText(pat.primary_metric?.name, 120) && isText(pat.primary_metric?.definition), `${where}: primary metric`);
    const e = pat.economics;
    const bounds = { tasks: [1, 1e7], minutes_saved: [0, 1440], hourly_value: [0, 1e4], run_cost_per_task: [0, 1e4], fixed_monthly: [0, 1e7] };
    need(e && Object.entries(bounds).every(([k, [lo, hi]]) => Number.isFinite(e[k]) && e[k] >= lo && e[k] <= hi), `${where}: economics out of bounds`);
    need(e && ['adoption', 'acceptance'].every(k => Number.isFinite(e[k]) && e[k] > 0 && e[k] <= 1), `${where}: adoption and acceptance must be in (0, 1]`);
    need(e?.currency === 'EUR' && isText(e?.basis), `${where}: economics basis required`);

    const comps = new Map();
    const cells = new Set();
    for (const c of pat.components ?? []) {
      need(isId(c.id) && !comps.has(c.id), `${where}: component ${c.id} duplicate or invalid`);
      comps.set(c.id, c);
      need(roleIds.has(c.role), `${where}/${c.id}: unknown role ${c.role}`);
      need(isText(c.label, 48) && isText(c.detail, 200) && isText(c.data_class, 40), `${where}/${c.id}: label, detail, data class`);
      need(Number.isInteger(c.col) && c.col >= 0 && c.col <= 7 && Number.isInteger(c.row) && c.row >= 0 && c.row <= 4, `${where}/${c.id}: grid position`);
      need(!cells.has(`${c.col},${c.row}`), `${where}/${c.id}: grid cell ${c.col},${c.row} already used`);
      cells.add(`${c.col},${c.row}`);
    }
    need(comps.size >= 6 && comps.size <= 24, `${where}: 6 to 24 components`);
    const flows = new Map();
    for (const f of pat.flows ?? []) {
      need(isId(f.id) && !flows.has(f.id) && !comps.has(f.id), `${where}: flow ${f.id} duplicate or invalid`);
      flows.set(f.id, f);
      need(comps.has(f.from) && comps.has(f.to) && f.from !== f.to, `${where}/${f.id}: dangling or self flow`);
      need(KINDS.includes(f.kind) && isText(f.label, 80) && isText(f.data_class, 40), `${where}/${f.id}: kind, label, data class`);
    }
    for (const c of comps.values()) need([...flows.values()].some(f => f.from === c.id || f.to === c.id), `${where}/${c.id}: component has no flow`);
    const covered = new Set();
    for (const j of pat.journey ?? []) {
      need(isId(j.id) && isText(j.title, 80) && isText(j.narration, 400) && ACTORS.includes(j.actor), `${where}/${j.id}: journey step`);
      need(Array.isArray(j.flows) && j.flows.length > 0 && j.flows.every(id => flows.has(id)), `${where}/${j.id}: journey flows must exist`);
      for (const id of j.flows ?? []) covered.add(id);
    }
    need(covered.size === flows.size, `${where}: journey must cover every flow (${flows.size - covered.size} uncovered)`);
    need(Array.isArray(pat.team) && LANES.every(l => pat.team.some(t => t.lane === l)), `${where}: team needs every lane`);
    for (const t of pat.team ?? []) need(LANES.includes(t.lane) && isText(t.step, 160) && isText(t.evidence, 120), `${where}: team step`);
    need(Array.isArray(pat.screens) && pat.screens.length >= 3 && pat.screens.some(s => s.device === 'mobile'), `${where}: at least three screens including mobile`);
    for (const s of pat.screens ?? []) {
      need(isId(s.id) && ['desktop', 'mobile'].includes(s.device) && isText(s.title, 60) && isText(s.state, 30), `${where}/${s.id}: screen`);
      need(Array.isArray(s.blocks) && s.blocks.length > 0 && s.blocks.every(b => BLOCKS.includes(b.type)), `${where}/${s.id}: unknown block`);
      need(!JSON.stringify(s.blocks).match(/\b\d{1,3}(\.\d+)? ?%/), `${where}/${s.id}: use 'percent' in fixture text, not a percent sign that reads as a measured figure`);
    }
    need(Array.isArray(pat.evals) && pat.evals.length >= 3, `${where}: three or more evals`);
    for (const ev of pat.evals ?? []) need(isId(ev.id) && isText(ev.name, 60) && isText(ev.threshold, 160) && isText(ev.method, 200), `${where}/${ev.id}: eval`);
    need(Array.isArray(pat.risks) && pat.risks.length >= 2 && pat.risks.every(r => isId(r.id) && isText(r.risk) && isText(r.control)), `${where}: risks`);

    for (const pid of providerIds) {
      const r = pat.realizations?.[pid];
      need(r, `${where}: missing realization for ${pid}`);
      if (!r) continue;
      need(isText(r.headline, 120) && isText(r.notes) && isText(r.rationale, 300), `${where}/${pid}: copy`);
      need(criteria.every(k => Number.isInteger(r.scores?.[k]) && r.scores[k] >= 1 && r.scores[k] <= 5) && Object.keys(r.scores ?? {}).length === criteria.length, `${where}/${pid}: scores`);
      need(r.template === null || cat.templates.some(t => t.id === r.template && t.provider === pid), `${where}/${pid}: template must exist for this provider`);
      for (const [cid, sid] of Object.entries(r.map ?? {})) {
        need(comps.has(cid), `${where}/${pid}: map names unknown component ${cid}`);
        need(!EXTERNAL_ROLES.has(comps.get(cid)?.role), `${where}/${pid}: ${cid} is external and cannot map to a service`);
        need([pid, 'portable'].includes(serviceById.get(sid)?.provider), `${where}/${pid}: ${cid} maps to ${sid}, which is not a ${pid} service`);
      }
    }
    need(Object.keys(pat.realizations ?? {}).every(k => providerIds.has(k)), `${where}: realization for unknown provider`);
  }
  if (errors.length) throw new Error(errors.join('\n'));
  return cat;
}

export function economics(e) {
  const attempts = e.tasks * e.adoption;
  const accepted = attempts * e.acceptance;
  const value = accepted * (e.minutes_saved / 60) * e.hourly_value;
  const runCost = attempts * e.run_cost_per_task;
  const cost = runCost + e.fixed_monthly;
  const round = v => Math.round(v * 100) / 100;
  return { attempts: round(attempts), accepted: round(accepted), monthly_value: round(value), run_cost: round(runCost), monthly_cost: round(cost), net: round(value - cost), cost_per_accepted: accepted ? round(cost / accepted) : null };
}

export function resolve(cat) {
  const roles = new Map(cat.roles.roles.map(r => [r.id, r]));
  const layers = new Map(cat.roles.layers.map(l => [l.id, l]));
  const services = new Map(cat.services.map(s => [s.id, s]));
  const criteria = cat.providers.criteria.map(c => c.id);
  const templates = new Map(cat.templates.map(t => [t.id, t]));
  return cat.patterns.map(pat => {
    const components = pat.components.map(c => ({
      ...c,
      layer: roles.get(c.role).layer,
      x: GRID.pad + c.col * GRID.x,
      y: GRID.pad + c.row * GRID.y,
    }));
    const realizations = Object.fromEntries(cat.providers.providers.map(p => {
      const r = pat.realizations[p.id];
      const bindings = Object.fromEntries(components.map(c => {
        if (EXTERNAL_ROLES.has(c.role)) return [c.id, null];
        const s = services.get(r.map?.[c.id] ?? p.defaults[c.role]);
        return [c.id, { id: s.id, name: s.name, docs: s.docs, status: s.status, verification: s.verification, icon: s.icon, note: s.note ?? null, provider: s.provider }];
      }));
      const total = criteria.reduce((sum, k) => sum + r.scores[k], 0);
      const template = r.template ? templates.get(r.template) : null;
      return [p.id, {
        provider: p.id, headline: r.headline, notes: r.notes, rationale: r.rationale, scores: r.scores,
        mean_score: Math.round((total / criteria.length) * 100) / 100,
        template: template ? template.id : null,
        consumption_drivers: p.consumption_drivers,
        bindings,
        overrides: Object.keys(r.map ?? {}).sort(),
        caution: [...new Set(Object.values(bindings).filter(b => b && (b.status !== 'ga' || b.verification === 'inferred')).map(b => b.id))].sort(),
      }];
    }));
    return {
      id: pat.id, title: pat.title, tagline: pat.tagline, summary: pat.summary,
      customer_job: pat.customer_job, baseline: pat.baseline, accepted_result: pat.accepted_result,
      industries: pat.industries, sophistication: pat.sophistication, primary_metric: pat.primary_metric,
      economics: { ...pat.economics, computed: economics(pat.economics) },
      components, flows: pat.flows, journey: pat.journey, team: pat.team, screens: pat.screens,
      evals: pat.evals, risks: pat.risks, realizations,
      layers_used: [...new Set(components.map(c => c.layer))].filter(l => layers.has(l)),
      image_recipes: imageRecipes(pat),
    };
  });
}

function imageRecipes(pat) {
  const people = pat.team.map(t => t.lane).join(', ');
  const rule = 'Concept art only. Do not render product logos, cloud icons, UI text or architecture labels; compose exact labels from the specification in code.';
  return [
    {
      id: 'hero', kind: 'generated', model_hint: 'gpt-image-2 or a current Gemini image model', aspect: '16:9',
      purpose: 'Customer moment for a proposal cover or portal hero.',
      prompt: `Cinematic editorial photograph, late afternoon light, shallow depth of field. ${pat.customer_job} The moment just after the accepted result: ${pat.accepted_result} Real workplace, restrained palette of deep navy, warm paper and one cobalt accent. Natural expressions, no screens facing the camera. ${rule}`,
    },
    {
      id: 'storyboard', kind: 'generated', model_hint: 'gpt-image-2 (consistent characters across panels)', aspect: '3:2',
      purpose: 'Team workflow storyboard for a workshop or executive briefing.',
      prompt: `Five-panel storyboard, clean ink line with flat colour, consistent characters across panels. Panels follow the lanes ${people}: ${pat.team.map((t, i) => `(${i + 1}) ${t.step}`).join(' ')} Each panel shows hands and decisions, not screens. ${rule}`,
    },
    {
      id: 'exact-diagram', kind: 'compiled', model_hint: 'none: use the SVG, diagrams.net, React Flow or Structurizr export', aspect: 'any',
      purpose: 'Any image a customer will read for component names, data classes or provider services.',
      prompt: 'Do not generate. Export the compiled view for the chosen provider. A generated architecture image can invent services, misspell names and draw icons the vendor never published.',
    },
  ];
}

function iconData(cat, key) {
  const item = cat.icons[key];
  const bytes = fs.readFileSync(path.join(REPO, 'solution-kit', item.path));
  if (sha256(bytes) !== item.sha256) throw new Error(`icon ${key}: hash mismatch`);
  return 'data:image/svg+xml;base64,' + bytes.toString('base64');
}

// Greedy word wrap into at most two lines; the second line is cut with an ellipsis.
export function wrap(text, width) {
  const words = String(text).split(' ');
  const lines = [''];
  for (const w of words) {
    const cur = lines[lines.length - 1];
    if (!cur) lines[lines.length - 1] = w;
    else if ((cur + ' ' + w).length <= width) lines[lines.length - 1] = cur + ' ' + w;
    else lines.push(w);
  }
  if (lines.length <= 2) return lines;
  const second = lines.slice(1).join(' ');
  return [lines[0], second.length > width ? second.slice(0, width - 1).trimEnd() + '…' : second];
}

function layerColor(cat, layer) { return cat.roles.layers.find(l => l.id === layer).color; }
function glyph(cat, role) { return cat.roles.roles.find(r => r.id === role).glyph; }

function nodeLabel(c, binding) { return binding ? binding.name : (c.role === 'user' ? 'Person' : 'External system'); }

export function reactFlow(pat, providerId) {
  const r = pat.realizations[providerId];
  return {
    schema: 'ai-architect-reactflow/v1',
    pattern: pat.id, provider: providerId,
    nodes: pat.components.map(c => ({
      id: c.id, type: 'architecture', position: { x: c.x, y: c.y },
      data: { label: c.label, role: c.role, layer: c.layer, detail: c.detail, dataClass: c.data_class, service: nodeLabel(c, r.bindings[c.id]), serviceId: r.bindings[c.id]?.id ?? null, docs: r.bindings[c.id]?.docs ?? null, officialIcon: r.bindings[c.id]?.icon ?? null },
    })),
    edges: pat.flows.map(f => ({ id: f.id, source: f.from, target: f.to, label: f.label, type: 'smoothstep', animated: f.kind === 'data', data: { kind: f.kind, dataClass: f.data_class } })),
    viewport: { x: 0, y: 0, zoom: 1 },
  };
}

const mid = id => 'n_' + id.replaceAll('-', '_');
const mlabel = v => String(v).replace(/["&<>#|`\r\n]/g, c => `#${c.charCodeAt(0)};`);

export function mermaidFlow(cat, pat, providerId) {
  const r = pat.realizations[providerId];
  const lines = [`%% ${pat.title} on ${providerId}. Generated; edit the catalog, not this file.`, 'flowchart LR'];
  for (const layer of cat.roles.layers) {
    const members = pat.components.filter(c => c.layer === layer.id);
    if (!members.length) continue;
    lines.push(`  subgraph ${layer.id}["${mlabel(layer.title)}"]`);
    for (const c of members) lines.push(`    ${mid(c.id)}["${mlabel(c.label)}<br/><small>${mlabel(nodeLabel(c, r.bindings[c.id]))}</small>"]:::${layer.id}`);
    lines.push('  end');
  }
  for (const f of pat.flows) {
    const arrow = f.kind === 'data' ? '-->' : f.kind === 'control' ? '-.->' : '-.-o';
    lines.push(`  %% flow ${f.id} (${f.kind}, ${f.data_class})`, `  ${mid(f.from)} ${arrow}|"${mlabel(f.label)}"| ${mid(f.to)}`);
  }
  for (const layer of cat.roles.layers) lines.push(`  classDef ${layer.id} fill:${layer.color}22,stroke:${layer.color},color:#0f1017`);
  return lines.join('\n') + '\n';
}

export function mermaidSequence(pat) {
  const flows = new Map(pat.flows.map(f => [f.id, f]));
  const used = [];
  for (const j of pat.journey) for (const id of j.flows) for (const end of [flows.get(id).from, flows.get(id).to]) if (!used.includes(end)) used.push(end);
  const comp = new Map(pat.components.map(c => [c.id, c]));
  const lines = [`%% ${pat.title}: request journey and team handoffs. Generated.`, 'sequenceDiagram', '  autonumber'];
  for (const id of used) lines.push(`  ${comp.get(id).role === 'user' ? 'actor' : 'participant'} ${mid(id)} as ${mlabel(comp.get(id).label)}`);
  for (const j of pat.journey) {
    lines.push(`  Note over ${mid(flows.get(j.flows[0]).from)}: ${mlabel(j.title)}`);
    for (const id of j.flows) {
      const f = flows.get(id);
      lines.push(`  ${mid(f.from)}${f.kind === 'data' ? '->>' : '-->>'}${mid(f.to)}: ${mlabel(f.label)}`);
    }
  }
  return lines.join('\n') + '\n';
}

export function drawio(cat, pat, providerId) {
  const r = pat.realizations[providerId];
  const cells = pat.components.map(c => {
    const color = layerColor(cat, c.layer);
    const value = `${c.label}\n${nodeLabel(c, r.bindings[c.id])}`;
    return `<mxCell id="${esc(c.id)}" value="${esc(value)}" data-role="${esc(c.role)}" data-service="${esc(r.bindings[c.id]?.id ?? 'external')}" data-class="${esc(c.data_class)}" style="rounded=1;whiteSpace=wrap;html=0;arcSize=10;fillColor=${color}33;strokeColor=${color};fontColor=#0f1017;fontSize=12;" vertex="1" parent="1"><mxGeometry x="${c.x}" y="${c.y}" width="${GRID.w}" height="${GRID.h}" as="geometry"/></mxCell>`;
  }).join('');
  const edges = pat.flows.map(f => `<mxCell id="${esc(f.id)}" value="${esc(f.label)}" data-kind="${f.kind}" data-class="${esc(f.data_class)}" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=0;fontSize=10;${f.kind === 'control' ? 'dashed=1;' : ''}${f.kind === 'telemetry' ? 'dashed=1;dashPattern=1 3;' : ''}" edge="1" source="${esc(f.from)}" target="${esc(f.to)}" parent="1"><mxGeometry relative="1" as="geometry"/></mxCell>`).join('');
  return `<mxfile host="ai-architect-catalog"><diagram id="${esc(pat.id)}-${esc(providerId)}" name="${esc(pat.title)} / ${esc(providerId)}"><mxGraphModel grid="1" gridSize="10"><root><mxCell id="0"/><mxCell id="1" parent="0"/>${cells}${edges}</root></mxGraphModel></diagram></mxfile>\n`;
}

const sid = id => id.replaceAll('-', '_');
const q = v => `"${String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

export function structurizr(cat, pat) {
  const L = [`workspace ${q(pat.title)} ${q(pat.summary)} {`, '  !identifiers hierarchical', '  model {'];
  const internal = pat.components.filter(c => !EXTERNAL_ROLES.has(c.role));
  for (const c of pat.components.filter(c => c.role === 'user')) L.push(`    ${sid(c.id)} = person ${q(c.label)} ${q(c.detail)}`);
  for (const c of pat.components.filter(c => c.role === 'system')) L.push(`    ${sid(c.id)} = softwareSystem ${q(c.label)} ${q(c.detail)} "External"`);
  L.push(`    workload = softwareSystem ${q(pat.title)} ${q(pat.tagline)} {`);
  for (const c of internal) L.push(`      ${sid(c.id)} = container ${q(c.label)} ${q(c.detail)} ${q(c.role)} ${q(c.layer)}`);
  L.push('    }');
  const ref = id => EXTERNAL_ROLES.has(pat.components.find(c => c.id === id).role) ? sid(id) : `workload.${sid(id)}`;
  for (const f of pat.flows) L.push(`    ${ref(f.from)} -> ${ref(f.to)} ${q(f.label)} ${q(f.kind + ', ' + f.data_class)}`);
  for (const p of cat.providers.providers) {
    const r = pat.realizations[p.id];
    L.push(`    ${sid(p.id)} = deploymentEnvironment ${q(p.name)} {`, `      deploymentNode ${q(p.name)} {`);
    const groups = new Map();
    for (const c of internal) {
      const name = r.bindings[c.id].name;
      if (!groups.has(name)) groups.set(name, []);
      groups.get(name).push(c);
    }
    let n = 0;
    for (const [name, members] of groups) {
      L.push(`        node${n++} = deploymentNode ${q(name)} {`);
      for (const c of members) L.push(`          containerInstance workload.${sid(c.id)}`);
      L.push('        }');
    }
    L.push('      }', '    }');
  }
  L.push('  }', '  views {', `    container workload ${q('containers')} {`, '      include *', '      autolayout lr', '    }');
  for (const p of cat.providers.providers) L.push(`    deployment workload ${sid(p.id)} ${q('deploy-' + p.id)} {`, '      include *', '      autolayout lr', '    }');
  const style = (tag, ...props) => [`      element ${q(tag)} {`, ...props.map(x => `        ${x}`), '      }'];
  L.push('    styles {', ...style('Person', 'shape person'), ...style('External', 'background #6b6e7a', 'color #ffffff'));
  for (const layer of cat.roles.layers) L.push(...style(layer.id, `background ${layer.color}`, 'color #0f1017'));
  L.push('    }', '  }', '}');
  return L.join('\n') + '\n';
}

export function svg(cat, pat, providerId) {
  const r = pat.realizations[providerId];
  const provider = cat.providers.providers.find(p => p.id === providerId);
  const width = Math.max(...pat.components.map(c => c.x)) + GRID.w + GRID.pad;
  const height = Math.max(...pat.components.map(c => c.y)) + GRID.h + GRID.pad + 40;
  const center = c => ({ x: c.x + GRID.w / 2, y: c.y + GRID.h / 2 });
  const byId = new Map(pat.components.map(c => [c.id, c]));
  const edges = pat.flows.map(f => {
    const a = byId.get(f.from), b = byId.get(f.to);
    const p1 = center(a), p2 = center(b);
    const horizontal = Math.abs(p2.x - p1.x) >= Math.abs(p2.y - p1.y);
    const s = horizontal ? { x: p1.x + Math.sign(p2.x - p1.x) * GRID.w / 2, y: p1.y } : { x: p1.x, y: p1.y + Math.sign(p2.y - p1.y) * GRID.h / 2 };
    const t = horizontal ? { x: p2.x - Math.sign(p2.x - p1.x) * GRID.w / 2, y: p2.y } : { x: p2.x, y: p2.y - Math.sign(p2.y - p1.y) * GRID.h / 2 };
    const d = horizontal ? `M${s.x} ${s.y}C${(s.x + t.x) / 2} ${s.y} ${(s.x + t.x) / 2} ${t.y} ${t.x} ${t.y}` : `M${s.x} ${s.y}C${s.x} ${(s.y + t.y) / 2} ${t.x} ${(s.y + t.y) / 2} ${t.x} ${t.y}`;
    const dash = f.kind === 'control' ? ' stroke-dasharray="6 5"' : f.kind === 'telemetry' ? ' stroke-dasharray="1 5" stroke-linecap="round"' : '';
    return `<path data-flow="${esc(f.id)}" d="${d}" fill="none" stroke="#9aa3b5" stroke-width="1.5"${dash} marker-end="url(#arrow)"><title>${esc(f.label)} (${f.kind}, ${esc(f.data_class)})</title></path>`;
  }).join('');
  const nodes = pat.components.map(c => {
    const color = layerColor(cat, c.layer);
    const b = r.bindings[c.id];
    const icon = b?.icon
      ? `<image x="${c.x + 16}" y="${c.y + 18}" width="34" height="34" href="${iconData(cat, b.icon)}"/>`
      : `<g transform="translate(${c.x + 20} ${c.y + 22}) scale(1.1)" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="${glyph(cat, c.role)}"/></g>`;
    const service = wrap(nodeLabel(c, b), 30).map((line, i) => `<tspan x="${c.x + 62}" dy="${i ? 14 : 0}">${esc(line)}</tspan>`).join('');
    return `<g data-component="${esc(c.id)}"><rect x="${c.x}" y="${c.y}" width="${GRID.w}" height="${GRID.h}" rx="14" fill="#151824" stroke="${color}" stroke-opacity="0.55"/>${icon}<text x="${c.x + 62}" y="${c.y + 34}" font-size="14" font-weight="600" fill="#f2f1ec">${esc(c.label)}</text><text x="${c.x + 62}" y="${c.y + 54}" font-size="11" fill="${color}">${service}</text><text x="${c.x + 16}" y="${c.y + 96}" font-size="10" fill="#8b90a0">${esc(c.id)} · ${esc(c.data_class)}</text><title>${esc(c.detail)}</title></g>`;
  }).join('');
  const usesOfficialIcons = pat.components.some(c => r.bindings[c.id]?.icon);
  const footnote = `${provider.name} realization · generated from the ai-architect catalog${usesOfficialIcons ? ' · Google Cloud icons are Google trademarks; other nodes use role glyphs' : ' · role glyphs, no vendor icons'}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(pat.title)} on ${esc(provider.name)}" viewBox="0 0 ${width} ${height}" style="font-family:Inter,system-ui,sans-serif"><title>${esc(pat.title)} on ${esc(provider.name)}: designed architecture, not a deployed system</title><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#9aa3b5"/></marker></defs><rect width="100%" height="100%" fill="#0f1017"/>${edges}${nodes}<text x="${GRID.pad}" y="${height - 18}" font-size="11" fill="#8b90a0">${esc(footnote)}</text></svg>\n`;
}

export function deployUrl(t, ref = 'main') {
  const tree = `${REPOSITORY}/tree/${ref}/${t.path}`;
  if (t.button === 'vercel') return `https://vercel.com/new/clone?repository-url=${encodeURIComponent(tree)}&project-name=${t.id}&repository-name=${t.id}`;
  if (t.button === 'cloudflare') return `https://deploy.workers.cloudflare.com/?url=${encodeURIComponent(tree)}`;
  return `https://deploy.cloud.run/?git_repo=${encodeURIComponent(REPOSITORY + '.git')}&dir=${encodeURIComponent(t.path)}&revision=${encodeURIComponent(ref)}`;
}

export function compile(out, { revision = null, ref = 'main', today } = {}) {
  const cat = validate(load(), today);
  const patterns = resolve(cat);
  if (fs.existsSync(out) && fs.lstatSync(out).isSymbolicLink()) throw new Error('output must not be a symlink');
  if (fs.existsSync(out) && fs.readdirSync(out).length && !fs.existsSync(path.join(out, 'manifest.json'))) throw new Error('output directory has unrelated files; choose an empty directory');
  fs.rmSync(path.join(out, 'exports'), { recursive: true, force: true });
  fs.mkdirSync(path.join(out, 'exports'), { recursive: true });
  const written = new Map();
  const write = (rel, data) => {
    const file = path.join(out, rel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, data);
    written.set(rel, sha256(data));
  };
  for (const pat of patterns) {
    write(`exports/${pat.id}/workspace.dsl`, structurizr(cat, pat));
    write(`exports/${pat.id}/journey.sequence.mmd`, mermaidSequence(pat));
    for (const p of cat.providers.providers) {
      write(`exports/${pat.id}/${p.id}.reactflow.json`, JSON.stringify(reactFlow(pat, p.id), null, 2) + '\n');
      write(`exports/${pat.id}/${p.id}.mmd`, mermaidFlow(cat, pat, p.id));
      write(`exports/${pat.id}/${p.id}.drawio`, drawio(cat, pat, p.id));
      write(`exports/${pat.id}/${p.id}.svg`, svg(cat, pat, p.id));
    }
  }
  const templates = cat.templates.map(t => ({ ...t, deploy_url: deployUrl(t, ref), source_url: `${REPOSITORY}/tree/${ref}/${t.path}` }));
  const usedServices = new Set(patterns.flatMap(p => Object.values(p.realizations).flatMap(r => Object.values(r.bindings).filter(Boolean).map(b => b.id))));
  const bundle = {
    schema: 'ai-architect-catalog/v1',
    source_repository: REPOSITORY,
    source_revision: revision,
    deploy_ref: ref,
    state: 'designed architectures; templates are local-tested only; no provider deployment receipts',
    counts: { patterns: patterns.length, providers: cat.providers.providers.length, services: usedServices.size, sources: cat.sources.length, realizations: patterns.length * cat.providers.providers.length, templates: templates.length },
    layers: cat.roles.layers, roles: cat.roles.roles,
    criteria: cat.providers.criteria, scoring_note: cat.providers.scoring_note,
    providers: cat.providers.providers.map(({ defaults, ...p }) => p),
    sources: cat.sources, templates, patterns,
  };
  write('catalog.json', JSON.stringify(bundle, null, 2) + '\n');
  write('llms.txt', llms(bundle));
  const manifest = { schema: 'ai-architect-catalog-export/v1', source_revision: revision, compiler_sha256: sha256(fs.readFileSync(fileURLToPath(import.meta.url))), files: [...written].sort(([a], [b]) => a.localeCompare(b)).map(([p, h]) => ({ path: p, sha256: h })) };
  fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return { manifest, bundle };
}

function llms(bundle) {
  const L = ['# AI Architect multi-cloud catalog', '', `> ${bundle.counts.patterns} workload patterns realized on ${bundle.counts.providers} providers. ${bundle.state}.`, ''];
  for (const p of bundle.patterns) {
    L.push(`## ${p.title} (${p.sophistication})`, '', p.summary, '', `Accepted result: ${p.accepted_result}`, '');
    for (const [id, r] of Object.entries(p.realizations)) L.push(`- ${id}: ${r.headline} (mean judgement ${r.mean_score}/5)`);
    L.push('');
  }
  return L.join('\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [out, ...rest] = process.argv.slice(2);
  if (!out) { console.error('Usage: node catalog/compile.mjs OUTPUT_DIR [--revision SHA] [--ref BRANCH]'); process.exit(2); }
  const opt = name => { const i = rest.indexOf(name); return i >= 0 ? rest[i + 1] : undefined; };
  try {
    const { bundle, manifest } = compile(path.resolve(out), { revision: opt('--revision') ?? null, ref: opt('--ref') ?? 'main' });
    console.log(`Compiled ${bundle.counts.patterns} patterns x ${bundle.counts.providers} providers (${bundle.counts.services} services) into ${manifest.files.length + 1} files.`);
  } catch (e) { console.error(e.message); process.exit(1); }
}
