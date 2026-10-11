import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildBook} from './export-book.mjs';
test('full book export binds every chapter and resolves relative source links',()=>{
 const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),sha='c'.repeat(40),book=buildBook(root,sha);
 assert.equal(book.sourceRevision,sha);assert.ok(book.sections.some(s=>s.file==='19-the-living-architecture-practice.md'));
 for(const chapter of book.sections){assert.ok(book.html.includes('id="'+chapter.id+'"'));assert.ok(book.html.includes('/blob/'+sha+'/guide/manuscript/'+chapter.file));assert.ok(book.markdown.includes(chapter.title));}
 assert.ok(!/href="(?:\.\.\/|manuscript\/|editorial\/|research\/)/.test(book.html));
 assert.ok(!/\]\((?:\.\.\/|manuscript\/|editorial\/|research\/|\d\d-)/.test(book.markdown));
 assert.ok(book.html.includes('Apache License'));assert.ok(book.html.includes('/blob/'+sha+'/guide/research/claims.yaml'));
 assert.throws(()=>buildBook(root,'main'));
});
