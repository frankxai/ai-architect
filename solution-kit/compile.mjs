import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { validatePractice } from './practice.mjs';
import { buildBook } from '../guide/scripts/export-book.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const MATURITY = ['concept', 'visualized', 'local-tested', 'provider-tested', 'production-verified'];
const esc = v => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hash = v => crypto.createHash('sha256').update(v).digest('hex');
const id = v => typeof v === 'string' && /^[a-z][a-z0-9-]{0,63}$/.test(v);
const text = v => typeof v === 'string' && v.length > 0 && v.length <= 1500;

export function validate(spec, sources) {
  const errors = [];
  const today = new Date().toISOString().slice(0,10);
  const need = (ok, msg) => { if (!ok) errors.push(msg); };
  need(spec?.schema === 'ai-architect-solution/v1', 'unknown schema');
  need(id(spec?.id), 'invalid solution id');
  need(text(spec?.title) && text(spec?.subtitle) && text(spec?.owner), 'missing solution copy/owner');
  need(spec?.fixture === true && spec?.visibility === 'public', 'compiler only permits public synthetic fixtures');
  need(spec?.sources === 'sources.json', 'source register path must be fixed');
  need(Array.isArray(sources) && sources.length > 0, 'source register required');
  const sourceIds = new Set();
  for (const s of sources ?? []) {
    need(id(s.id) && !sourceIds.has(s.id), 'duplicate/invalid source id'); sourceIds.add(s.id);
    for (const field of ['url','resolved_url']) {
      try { need(new URL(s[field]).protocol === 'https:', `source ${s.id}: HTTPS required`); } catch { need(false, `source ${s.id}: invalid URL`); }
    }
    need(text(s.title) && text(s.scoped_claim), `source ${s.id}: missing claim`);
    for (const field of ['checked_on','review_by']) {
      const date = s[field];
      need(typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date)) && new Date(date).toISOString().slice(0,10) === date, `source ${s.id}: invalid ${field}`);
    }
    need(s.review_by >= s.checked_on, `source ${s.id}: review precedes check`);
    need(s.checked_on <= today, `source ${s.id}: future check`);
    need(s.review_by >= today, `source ${s.id}: expired source review`);
  }
  need(Array.isArray(spec?.profiles) && spec.profiles.length > 0, 'profiles required');
  const profiles = new Set();
  const icons = JSON.parse(fs.readFileSync(path.join(ROOT, 'icons/registry.json'), 'utf8'));
  for (const p of spec?.profiles ?? []) {
    need(id(p.id) && !profiles.has(p.id), 'duplicate/invalid profile id'); profiles.add(p.id);
    need(text(p.title) && text(p.provider) && text(p.decision), `${p.id}: missing decision`);
    need(MATURITY.includes(p.maturity), `${p.id}: invalid maturity`);
    // This public fixture compiler cannot confer runtime evidence or production status.
    need(['concept','visualized'].includes(p.maturity), `${p.id}: runtime maturity is outside this compiler authority`);
    need(['A0','A1','A2','A3','A4'].includes(p.sophistication), `${p.id}: invalid sophistication`);
    need(Array.isArray(p.sources) && p.sources.length > 0 && p.sources.every(s=>sourceIds.has(s)), `${p.id}: source references required`);
    need(Array.isArray(p.receipts) && p.receipts.length === 0, `${p.id}: fixtures cannot import runtime receipts`);
    need(Array.isArray(p.production_blockers) && p.production_blockers.length > 0 && p.production_blockers.every(text), `${p.id}: blockers required`);
    const nodes = new Set();
    need(Array.isArray(p.nodes) && p.nodes.length >= 1 && p.nodes.length <= 30, `${p.id}: node count outside bounds`);
    for (const n of p.nodes ?? []) {
      need(id(n.id) && !nodes.has(n.id), `${p.id}: invalid/duplicate node`); nodes.add(n.id);
      need([n.label,n.service,n.owner,n.boundary,n.data_class].every(text), `${p.id}/${n.id}: node contract incomplete`);
      need(n.icon === null || Object.hasOwn(icons,n.icon), `${p.id}/${n.id}: unknown official icon`);
      need(Number.isFinite(n.x) && n.x>=0 && n.x<=1000 && Number.isFinite(n.y) && n.y>=0 && n.y<=1000, `${p.id}/${n.id}: invalid coordinates`);
    }
    const edges = new Set();
    need(Array.isArray(p.edges) && p.edges.length <= 100, `${p.id}: invalid edges`);
    for (const e of p.edges ?? []) {
      need(id(e.id) && !edges.has(e.id) && !nodes.has(e.id), `${p.id}: invalid/duplicate edge`); edges.add(e.id);
      need(nodes.has(e.from) && nodes.has(e.to), `${p.id}/${e.id}: dangling edge`);
      need(['data','control','telemetry'].includes(e.kind), `${p.id}/${e.id}: untyped edge`);
      need([e.label,e.data_class,e.encryption].every(text), `${p.id}/${e.id}: data contract incomplete`);
    }
  }
  need(spec?.brief && ['customer_job','baseline','acceptance'].every(k=>text(spec.brief[k])), 'brief incomplete');
  need(Array.isArray(spec?.stages) && spec.stages.length===9 && spec.stages.every(s=>id(s.id)&&text(s.title)&&text(s.owner)&&text(s.proof)&&['concept','visualized'].includes(s.state)) && new Set(spec.stages.map(s=>s.id)).size===9, 'nine unique stage references required');
  need(Array.isArray(spec?.use_cases) && spec.use_cases.every(c=>text(c.title)&&text(c.hypothesis)&&text(c.metric)&&c.state==='hypothesis'), 'use-case hypotheses required');
  const e=spec?.economics;
  const limits={tasks:1e6,minutes_saved:1440,hourly_value:1e4,monthly_cost:1e7};
  need(e && Object.entries(limits).every(([k,max])=>Number.isFinite(e[k])&&e[k]>=0&&e[k]<=max) && ['adoption','acceptance'].every(k=>Number.isFinite(e[k])&&e[k]>=0&&e[k]<=1) && Number.isFinite(e.tasks*e.adoption*e.acceptance*e.minutes_saved/60*e.hourly_value-e.monthly_cost) && e.provider_consumption===null && e.currency==='EUR', 'invalid assumed economics');
  if (errors.length) throw new Error(errors.join('\n'));
  return spec;
}

function iconData(key) {
  const registry = JSON.parse(fs.readFileSync(path.join(ROOT, 'icons/registry.json'), 'utf8'));
  const item = registry[key];
  if (!item) throw new Error('unknown icon');
  const bytes = fs.readFileSync(path.join(ROOT,item.path));
  if (hash(bytes) !== item.sha256) throw new Error('icon hash mismatch');
  return 'data:image/svg+xml;base64,' + bytes.toString('base64');
}

export function svg(p) {
  const height=Math.max(...p.nodes.map(n=>n.y))+160;
  const width=Math.max(...p.nodes.map(n=>n.x))+290;
  const arrow='<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#5a6680"/></marker></defs>';
  const edges=p.edges.map(e=>{
    const a=p.nodes.find(n=>n.id===e.from),b=p.nodes.find(n=>n.id===e.to);
    const x1=a.x+120,y1=a.y+100,x2=b.x+120,y2=b.y;
    // Sideways links stay outside node interiors, parallel return edges use a separate lane.
    const sameRow=a.y===b.y;
    const sameColumn=a.x===b.x;
    let d;
    if(a.id===b.id){d=`M${a.x+240} ${a.y+30}C${a.x+285} ${a.y+30} ${a.x+285} ${a.y+75} ${a.x+240} ${a.y+75}`;}
    else if(sameRow){const right=b.x>a.x; const sx=right?a.x+240:a.x, tx=right?b.x:b.x+240; const cy=a.y+(right?44:72);d=`M${sx} ${cy}L${tx} ${cy}`;}
    else if(sameColumn && b.y<a.y){const lane=a.x+270;d=`M${a.x+240} ${a.y+60}L${lane} ${a.y+60}L${lane} ${b.y+60}L${b.x+240} ${b.y+60}`;}
    else if(sameColumn){d=`M${x1} ${y1}L${x2} ${y2}`;}
    else { const sy=b.y>a.y?a.y+100:a.y;const ty=b.y>a.y?b.y:b.y+100;const bend=(sy+ty)/2;d=`M${x1} ${sy}C${x1} ${bend} ${x2} ${bend} ${x2} ${ty}`; }
    return `<path data-edge="${esc(e.id)}" d="${d}" fill="none" stroke="${e.kind==='control'?'#294ccf':'#5a6680'}" stroke-width="1.6" ${e.kind==='control'?'stroke-dasharray="6 4"':''} marker-end="url(#arrow)"><title>${esc(e.label)}; ${esc(e.data_class)}; ${esc(e.encryption)}</title></path>`;
  }).join('');
  const nodes=p.nodes.map(n=>`<g data-node="${esc(n.id)}"><rect x="${n.x}" y="${n.y}" width="240" height="100" rx="12" fill="#fff" stroke="#d5dbe6"/>${n.icon?`<image x="${n.x+16}" y="${n.y+20}" width="38" height="38" href="${iconData(n.icon)}"/>`:`<rect x="${n.x+16}" y="${n.y+20}" width="34" height="34" rx="8" fill="#edf1fc"/><text x="${n.x+33}" y="${n.y+42}" text-anchor="middle" font-size="15" fill="#294ccf">${esc(n.id[0].toUpperCase())}</text>`}<text x="${n.x+67}" y="${n.y+36}" font-size="15" font-weight="600" fill="#182338">${esc(n.label)}</text><text x="${n.x+67}" y="${n.y+58}" font-size="11" fill="#46556f">${esc(n.service)}</text><text x="${n.x+16}" y="${n.y+84}" font-size="10" fill="#46556f">${esc(n.id)} · ${esc(n.boundary)}</text><title>${esc(n.owner)}; ${esc(n.data_class)}</title></g>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(p.title)} proposed component view" viewBox="0 0 ${width} ${height}" style="font-family:system-ui,sans-serif"><title>${esc(p.title)}: ${esc(p.maturity)}, no deployed workload</title><rect width="100%" height="100%" fill="#f3f5f9"/><text x="50" y="42" font-size="20" fill="#182338">${esc(p.provider)} / ${esc(p.maturity)}</text>${arrow}${edges}${nodes}</svg>`;
}

function mermaid(p) {
  const label=v=>String(v).replace(/["&<>#|`\r\n]/g,c=>`#${c.charCodeAt(0)};`);
  // Prefix renderer IDs so source IDs such as Mermaid's reserved 'end' remain valid.
  const mid=v=>'n_'+v.replaceAll('-','_');
  return 'flowchart TB\n'+p.nodes.map(n=>`  %% component-id: ${n.id}\n  ${mid(n.id)}["${label(n.label)}: ${label(n.service)}"]`).join('\n')+'\n'+p.edges.map(e=>`  %% relationship-id: ${e.id}; kind: ${e.kind}\n  ${mid(e.from)} ${e.kind==='control'?'-.->':'-->'}|"${label(e.label)}"| ${mid(e.to)}`).join('\n')+'\n';
}

function drawio(p) {
  const nodes=p.nodes.map(n=>`<mxCell id="${esc(n.id)}" value="${esc(n.label+' / '+n.service)}" data-service="${esc(n.service)}" data-owner="${esc(n.owner)}" data-boundary="${esc(n.boundary)}" data-class="${esc(n.data_class)}" style="rounded=1;whiteSpace=wrap;html=0;" vertex="1" parent="1"><mxGeometry x="${n.x}" y="${n.y}" width="240" height="100" as="geometry"/></mxCell>`).join('');
  const edges=p.edges.map(e=>`<mxCell id="${esc(e.id)}" value="${esc(e.label)}" data-kind="${esc(e.kind)}" data-class="${esc(e.data_class)}" data-encryption="${esc(e.encryption)}" style="edgeStyle=orthogonalEdgeStyle;html=0;${e.kind==='control'?'dashed=1;':''}" edge="1" source="${esc(e.from)}" target="${esc(e.to)}" parent="1"><mxGeometry relative="1" as="geometry"/></mxCell>`).join('');
  return `<mxfile><diagram name="${esc(p.provider)}"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>${nodes}${edges}</root></mxGraphModel></diagram></mxfile>`;
}

export function compile(specPath, out) {
  const spec=JSON.parse(fs.readFileSync(specPath,'utf8'));
  const sources=JSON.parse(fs.readFileSync(path.join(ROOT,'sources.json'),'utf8'));
  validate(spec,sources);
  const practice=validatePractice(JSON.parse(fs.readFileSync(path.join(ROOT,'practice.json'),'utf8')),sources);
  const expected=new Set(['index.html','practice.html','practice.json','practice.mjs','design.tokens.json','living-design.md','guide.html','guide.md','solution.json','sources.json','icon-registry.json','LICENSE','README.md','method.md','encyclopedia.md','encyclopedia.json','ecosystem.md','visual-recipes.md','execution-plan.md','vercel.json','Dockerfile','nginx.conf','railway.json','manifest.json',...spec.profiles.flatMap(p=>[`${p.id}.svg`,`${p.id}.mmd`,`${p.id}.drawio`,`${p.id}.reactflow.json`])]);
  if(fs.existsSync(out)) {
    if(fs.lstatSync(out).isSymbolicLink()) throw new Error('Output directory must not be a symlink');
    for(const name of fs.readdirSync(out)) if(!expected.has(name)||!fs.lstatSync(path.join(out,name)).isFile()||fs.lstatSync(path.join(out,name)).isSymbolicLink()) throw new Error('Output directory contains unrelated or unsafe files; use a clean directory');
  }
  fs.mkdirSync(out,{recursive:true});
  const write=(name,data)=>fs.writeFileSync(path.join(out,name),data);
  const flow=p=>JSON.stringify({nodes:p.nodes.map(n=>({id:n.id,type:'default',position:{x:n.x,y:n.y},data:{label:n.label,service:n.service,owner:n.owner,boundary:n.boundary,data_class:n.data_class,icon:n.icon}})),edges:p.edges.map(e=>({id:e.id,source:e.from,target:e.to,label:e.label,...(e.kind==='control'?{style:{strokeDasharray:'6 4'}}:{}),data:{kind:e.kind,data_class:e.data_class,encryption:e.encryption}})),viewport:{x:0,y:0,zoom:1}},null,2)+'\n';
  const models=spec.profiles.map(p=>({...p,svg:svg(p),exports:{svg:svg(p),mmd:mermaid(p),drawio:drawio(p),'reactflow.json':flow(p)}}));
  const documents=Object.fromEntries(['README.md','method.md','encyclopedia.md','encyclopedia.json','ecosystem.md','visual-recipes.md','execution-plan.md','sources.json'].map(n=>[n,fs.readFileSync(path.join(ROOT,n),'utf8')]));
  const encoded=JSON.stringify({...spec,profiles:models,sources,documents}).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
  const html=fs.readFileSync(path.join(ROOT,'portal.html'),'utf8').replace('/*__SOLUTION__*/',()=>encoded);
  write('index.html',html);
  const sha=spec.source_revision??'main';
  const exportedBook=buildBook(path.join(ROOT,'../guide'),spec.source_revision);
  const book=exportedBook.sections.map(c=>({title:c.title,href:`https://github.com/frankxai/ai-architect/blob/${sha}/guide/manuscript/${c.file}`,words:c.words}));
  write('guide.html',exportedBook.html);write('guide.md',exportedBook.markdown);
  const tokens=JSON.parse(fs.readFileSync(path.join(ROOT,'design.tokens.json'),'utf8'));
  const practiceData=JSON.stringify({practice,profiles:models,sources,source_revision:spec.source_revision,book,tokens,design:fs.readFileSync(path.join(ROOT,'living-design.md'),'utf8'),license:fs.readFileSync(path.join(ROOT,'../LICENSE'),'utf8')}).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
  const domain=fs.readFileSync(path.join(ROOT,'practice.mjs'),'utf8').replace(/^export /gm,'');
  write('practice.html',fs.readFileSync(path.join(ROOT,'practice.html'),'utf8').replace('/*__PRACTICE__*/',()=>practiceData).replace('/*__DOMAIN__*/',()=>domain));
  for(const name of ['practice.json','practice.mjs','design.tokens.json','living-design.md'])write(name,fs.readFileSync(path.join(ROOT,name)));
  write('solution.json',JSON.stringify(spec,null,2)+'\n');
  write('sources.json',JSON.stringify(sources,null,2)+'\n');
  write('icon-registry.json',fs.readFileSync(path.join(ROOT,'icons/registry.json')));
  write('LICENSE',fs.readFileSync(path.join(ROOT,'..','LICENSE')));
  for(const p of spec.profiles) {
    write(`${p.id}.svg`,svg(p)); write(`${p.id}.mmd`,mermaid(p)); write(`${p.id}.drawio`,drawio(p));
    write(`${p.id}.reactflow.json`,flow(p));
  }
  for(const name of ['README.md','method.md','encyclopedia.md','encyclopedia.json','ecosystem.md','visual-recipes.md','execution-plan.md']) write(name,fs.readFileSync(path.join(ROOT,name)));
  write('README.md',documents['README.md'].replace('`icons/registry.json`','`icon-registry.json`'));
  write('vercel.json',JSON.stringify({$schema:'https://openapi.vercel.sh/vercel.json',version:2,framework:null,buildCommand:null,outputDirectory:'.',headers:[{source:'/(.*)',headers:[{key:'X-Content-Type-Options',value:'nosniff'},{key:'Referrer-Policy',value:'strict-origin-when-cross-origin'}]}]},null,2));
  write('Dockerfile','FROM nginx:1.28-alpine\nCOPY . /usr/share/nginx/html\nCOPY nginx.conf /etc/nginx/templates/default.conf.template\n');
  write('nginx.conf','server {\n listen ${PORT};\n server_name _;\n root /usr/share/nginx/html;\n location = /health { return 200 "ok"; }\n location / { try_files $uri $uri/ =404; }\n}\n');
  write('railway.json',JSON.stringify({$schema:'https://railway.com/railway.schema.json',build:{builder:'DOCKERFILE',dockerfilePath:'Dockerfile'},deploy:{healthcheckPath:'/health',restartPolicyType:'ON_FAILURE',restartPolicyMaxRetries:3}},null,2));
  const files=fs.readdirSync(out).filter(n=>n!=='manifest.json').sort().map(n=>({path:n,sha256:hash(fs.readFileSync(path.join(out,n)))}));
  const manifest={schema:'ai-architect-export/v1',solution_id:spec.id,spec_sha256:hash(fs.readFileSync(specPath)),compiler_sha256:hash(fs.readFileSync(path.join(ROOT,'compile.mjs'))),portal_template_sha256:hash(fs.readFileSync(path.join(ROOT,'portal.html'))),practice_template_sha256:hash(fs.readFileSync(path.join(ROOT,'practice.html'))),practice_domain_sha256:hash(fs.readFileSync(path.join(ROOT,'practice.mjs'))),practice_contract_sha256:hash(fs.readFileSync(path.join(ROOT,'practice.json'))),source_revision:spec.source_revision,fixture:true,portal_state:'compiled',workload_state:new Set(spec.profiles.map(p=>p.maturity)).size===1?spec.profiles[0].maturity:'mixed-design',workload_states:Object.fromEntries(spec.profiles.map(p=>[p.id,p.maturity])),provider_deployment:null,model_run:null,files};
  write('manifest.json',JSON.stringify(manifest,null,2)+'\n');
  return manifest;
}

if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  if(process.argv.length!==4) { console.error('Usage: node compile.mjs SPEC.json OUTPUT'); process.exit(2); }
  try { const m=compile(path.resolve(process.argv[2]),path.resolve(process.argv[3])); console.log(`Compiled ${m.solution_id}: ${m.files.length} files. Workload state: ${m.workload_state}.`); }
  catch(e) { console.error(e.message); process.exit(1); }
}
