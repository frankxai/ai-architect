import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {marked,Renderer} from 'marked';
import {parse} from 'yaml';
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const wordCount=text=>text.replace(/```[\s\S]*?```/g,' ').replace(/`[^`]+`/g,' ').replace(/https?:\/\/\S+/g,' ').match(/[\p{L}\p{N}][\p{L}\p{N}'-]*/gu)?.length??0;
export function buildBook(root,sha=null) {
  if(sha!==null&&!/^[a-f0-9]{40}$/.test(sha))throw new Error('Immutable book source revision required');
  const edition=parse(fs.readFileSync(path.join(root,'edition.yaml'),'utf8'));
  const repositoryRoot=path.resolve(root,'..');
  const base='https://github.com/frankxai/ai-architect',revision=sha??'main';
  const sections=fs.readdirSync(path.join(root,'manuscript')).filter(n=>n.endsWith('.md')).sort().map(file=>{
    const text=fs.readFileSync(path.join(root,'manuscript',file),'utf8');
    return {file,id:file.replace(/\.md$/,''),text,title:text.split('\n')[0].replace(/^# /,''),words:wordCount(text)};
  });
  function render(text,relative) {
    const renderer=new Renderer();
    renderer.html=({text})=>escape(text);
    renderer.link=function({href,title,tokens}){
        if(!/^(?:https:|mailto:|#)/.test(href)) {
          const [file,fragment]=href.split('#');
          const resolved=path.resolve(root,path.dirname(relative),file);
          const inRepo=path.relative(repositoryRoot,resolved);
          if(inRepo.startsWith('..')||path.isAbsolute(inRepo)||!fs.existsSync(resolved))throw new Error('Book link escapes or misses source: '+href);
          href=base+'/blob/'+revision+'/'+inRepo.split(path.sep).join('/')+(fragment?'#'+fragment:'');
        }
        if(/^(?:javascript:|data:|http:)/i.test(href))throw new Error('Unsafe book link');
        return `<a href="${escape(href)}"${title?` title="${escape(title)}"`:''}>${this.parser.parseInline(tokens)}</a>`;
      };
    return marked.parse(text,{renderer});
  }
  const intro=`# ${edition.title}\n\n**${edition.edition} / working manuscript**\n\nAccountable author: ${edition.accountable_author.name}. AI-assisted authorship is disclosed in the canonical contribution record. Author, specialist, rights and final-edition gates remain pending.\n\n[Source revision ${revision}](${base}/tree/${revision}/guide). This export contains ${sections.length} manuscript files and ${sections.reduce((n,c)=>n+c.words,0)} counted prose words. Source review is partial and dated. No customer ROI, signed partnership, novelty or production outcome is implied.\n\n`;
  const contribution=fs.readFileSync(path.join(root,'editorial/ai-contribution.md'),'utf8');
  function portableMarkdown(text,relative){return text.replace(/\]\(([^)]+)\)/g,(whole,href)=>{
    if(/^(?:https:|mailto:|#)/.test(href))return whole;
    const [file,fragment]=href.split('#'),resolved=path.resolve(root,path.dirname(relative),file),inRepo=path.relative(repositoryRoot,resolved);
    if(inRepo.startsWith('..')||path.isAbsolute(inRepo)||!fs.existsSync(resolved))throw new Error('Invalid portable markdown source link');
    return ']('+base+'/blob/'+revision+'/'+inRepo.split(path.sep).join('/')+(fragment?'#'+fragment:'')+')';
  });}
  const markdown=intro+sections.map(s=>portableMarkdown(s.text,'manuscript/'+s.file)+'\n').join('\n---\n\n')+'\n## Authorship and review\n\n'+portableMarkdown(contribution,'editorial/ai-contribution.md');
  const license=fs.readFileSync(path.join(repositoryRoot,'LICENSE'),'utf8');
  const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(edition.title+' / '+edition.edition)}</title><style>*{box-sizing:border-box}body{margin:0;background:#f6f3ec;color:#16171d;font:17px/1.7 system-ui,sans-serif}main{max-width:920px;margin:auto;padding:48px 6% 90px}h1,h2,h3{font-family:Georgia,serif;line-height:1.18;font-weight:400}h1{font-size:clamp(34px,5vw,52px)}h2{font-size:30px;margin-top:42px}a{color:#1f3bd6;text-underline-offset:4px}a:focus-visible{outline:3px solid #1f3bd6;outline-offset:3px}section{border-top:1px solid #d6d1c6;margin-top:65px;padding-top:30px;scroll-margin-top:30px}pre{background:#e7ebfc;padding:20px;overflow:auto;font-size:13px;line-height:1.5}code{font-size:.88em}table{display:block;overflow:auto;width:100%;border-collapse:collapse;font-size:14px}th,td{padding:12px;text-align:left;border:1px solid #d6d1c6;min-width:140px}nav{background:white;padding:22px;border:1px solid #d6d1c6}nav li{padding:4px}blockquote{border-left:3px solid #1f3bd6;padding-left:18px;margin-left:0}.meta{font-size:12px;color:#3a3c46}@media print{body{background:white;font-size:11pt}main{max-width:none;padding:0}nav{break-after:page}section{break-before:page;margin:0;border:0}pre,table{font-size:8pt}h1{font-size:28pt}a{color:#16171d}}</style></head><body><main>${render(intro,'README.md')}<nav aria-label="Chapters"><ol>${sections.map(s=>`<li><a href="#${s.id}">${escape(s.title)}</a></li>`).join('')}</ol></nav>${sections.map(s=>`<section id="${s.id}"><p class="meta"><a href="${base}/blob/${revision}/guide/manuscript/${s.file}">Inspect chapter source / ${revision.slice(0,12)}</a></p>${render(s.text,'manuscript/'+s.file)}</section>`).join('')}<section id="provenance">${render('## Authorship and review\n\n'+contribution,'editorial/ai-contribution.md')}<p><a href="${base}/blob/${revision}/guide/research/sources.yaml">Source ledger</a> / <a href="${base}/blob/${revision}/guide/research/claims.yaml">Claim ledger</a> / <a href="${base}/blob/${revision}/guide/edition.yaml">Edition gates</a></p><details><summary>License and rights</summary><p>Original technical reference is Apache-2.0 subject to the canonical LICENSING.md exceptions. Provider marks retain their separate rights.</p><pre>${escape(license)}</pre></details></section></main></body></html>`;
  return {html,markdown,sections:sections.map(({text,...section})=>section),edition:edition.edition,sourceRevision:sha};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const output=process.argv[2];if(!output)throw new Error('Usage: node guide/scripts/export-book.mjs OUTPUT_DIRECTORY [SOURCE_SHA]');
  const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.resolve(output);
  const book=buildBook(root,process.argv[3]??null);
  if(fs.existsSync(out)){if(fs.lstatSync(out).isSymbolicLink())throw new Error('Output symlink rejected');for(const name of fs.readdirSync(out))if(!['guide.html','guide.md'].includes(name)||!fs.lstatSync(path.join(out,name)).isFile()||fs.lstatSync(path.join(out,name)).isSymbolicLink())throw new Error('Use a clean book output directory');}
  fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'guide.html'),book.html);fs.writeFileSync(path.join(out,'guide.md'),book.markdown);console.log(`Exported ${book.sections.length} manuscript files / ${book.edition}`);
}
