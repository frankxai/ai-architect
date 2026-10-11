import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validate, compile } from './compile.mjs';
const ROOT=path.dirname(fileURLToPath(import.meta.url));
const example=()=>JSON.parse(fs.readFileSync(path.join(ROOT,'example.json'),'utf8'));
const sources=()=>JSON.parse(fs.readFileSync(path.join(ROOT,'sources.json'),'utf8'));
test('rejects deployment claims and imported runtime receipts on fixture views',()=>{
  for(const maturity of ['local-tested','provider-tested','production-verified']) {const s=example();s.profiles[0].maturity=maturity;assert.throws(()=>validate(s,sources()),/authority/);}
  const s=example();s.profiles[0].receipts=[{status:'passed'}];assert.throws(()=>validate(s,sources()),/receipts/);
});
test('rejects private data posture, dangling edges, unknown icons and untyped flows',()=>{
  for(const mutate of [s=>s.fixture=false,s=>s.visibility='private',s=>s.profiles[0].edges[0].to='missing',s=>s.profiles[0].nodes[0].icon='../secret',s=>s.profiles[0].edges[0].kind='unknown']){const s=example();mutate(s);assert.throws(()=>validate(s,sources()));}
});
test('rejects unsafe sources, calendar mistakes, non-finite coordinates and invalid economic denominators',()=>{
  for(const mutate of [ss=>ss[0].url='javascript:alert(1)',ss=>ss[0].checked_on='2026-02-30',ss=>ss[0].id=ss[1].id,ss=>{ss[0].checked_on='2099-01-01';ss[0].review_by='2099-01-02'},ss=>{ss[0].checked_on='2020-01-01';ss[0].review_by='2020-01-02'}]){const ss=sources();mutate(ss);assert.throws(()=>validate(example(),ss));}
  const s=example();s.profiles[0].nodes[0].x=NaN;assert.throws(()=>validate(s,sources()));
  const e=example();e.economics.acceptance=1.1;assert.throws(()=>validate(e,sources()));
  e.economics.acceptance=.8;e.economics.tasks=1e308;assert.throws(()=>validate(e,sources()));
});
test('concept labels, Unicode and reserved source IDs survive export without conferring runtime proof',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'solution-concept-'));
  try{
    const s=example();s.profiles.forEach(p=>p.maturity='concept');
    const p=s.profiles[0],old=p.nodes[0].id;p.nodes[0].id='end';p.nodes[0].label='研究 "desk"';p.edges.forEach(e=>{if(e.from===old)e.from='end';if(e.to===old)e.to='end'});
    const file=path.join(root,'input.json');fs.writeFileSync(file,JSON.stringify(s));
    const manifest=compile(file,path.join(root,'out'));assert.equal(manifest.workload_state,'concept');
    assert.ok(fs.readFileSync(path.join(root,'out/gcp.svg'),'utf8').includes(p.provider+' / concept'));
    const mmd=fs.readFileSync(path.join(root,'out/gcp.mmd'),'utf8');assert.ok(mmd.includes('n_end['));assert.ok(mmd.includes('研究 #34;desk#34;'));
    const flow=JSON.parse(fs.readFileSync(path.join(root,'out/gcp.reactflow.json')));assert.equal(flow.nodes[0].data.data_class,p.nodes[0].data_class);
    const control=flow.edges.find(e=>e.data.kind==='control');assert.ok(control.style.strokeDasharray);
    const xml=fs.readFileSync(path.join(root,'out/gcp.drawio'),'utf8');assert.ok(xml.includes('data-owner="'+p.nodes[0].owner+'"'));assert.ok(xml.includes('data-boundary="'+p.nodes[0].boundary+'"'));
    assert.ok(fs.existsSync(path.join(root,'out/icon-registry.json')));
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('exports stable topology IDs and deterministic file hashes',()=>{
  const out=fs.mkdtempSync(path.join(os.tmpdir(),'solution-test-'));
  try {
    const first=compile(path.join(ROOT,'example.json'),out),second=compile(path.join(ROOT,'example.json'),out);
    assert.deepEqual(first,second);
    for(const p of example().profiles){const flow=JSON.parse(fs.readFileSync(path.join(out,p.id+'.reactflow.json')));assert.deepEqual(flow.nodes.map(n=>n.id),p.nodes.map(n=>n.id));assert.deepEqual(flow.edges.map(e=>[e.id,e.source,e.target]),p.edges.map(e=>[e.id,e.from,e.to]));const svg=fs.readFileSync(path.join(out,p.id+'.svg'),'utf8');for(const n of p.nodes)assert.ok(svg.includes(`data-node="${n.id}"`));assert.ok(fs.readFileSync(path.join(out,p.id+'.drawio'),'utf8').includes('<mxfile>'));}
    assert.equal(first.provider_deployment,null);assert.equal(first.model_run,null);
    assert.ok(fs.readFileSync(path.join(out,'index.html'),'utf8').includes('data:image/svg+xml;base64,'));
  } finally{fs.rmSync(out,{recursive:true,force:true});}
});
test('escapes hostile labels from both embedded script and SVG',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'solution-xss-'));
  try{const s=example();s.title='</script><script>alert(1)</script>';s.profiles[0].nodes[0].label='<img src=x onerror=alert(1)>';const file=path.join(root,'input.json');fs.writeFileSync(file,JSON.stringify(s));compile(file,path.join(root,'out'));const html=fs.readFileSync(path.join(root,'out/index.html'),'utf8');assert.ok(!html.includes(s.title));assert.ok(!html.includes(s.profiles[0].nodes[0].label));const svg=fs.readFileSync(path.join(root,'out/gcp.svg'),'utf8');assert.ok(svg.includes('&lt;img'));assert.ok(!svg.includes('<img'));}finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('does not overwrite unrelated output or follow output symlinks',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'solution-out-'));
  try{fs.writeFileSync(path.join(root,'secret.txt'),'private');assert.throws(()=>compile(path.join(ROOT,'example.json'),root),/unrelated/);assert.equal(fs.readFileSync(path.join(root,'secret.txt'),'utf8'),'private');const link=root+'-link';fs.symlinkSync(root,link);assert.throws(()=>compile(path.join(ROOT,'example.json'),link),/symlink/);fs.unlinkSync(link);}finally{fs.rmSync(root,{recursive:true,force:true});}
});
