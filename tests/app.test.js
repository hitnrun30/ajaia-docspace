import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,rmSync } from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createApp} from '../src/server.js';
const dir=mkdtempSync(join(tmpdir(),'docspace-test-'));
const {server,db}=createApp({dbPath:join(dir,'test.sqlite'),secret:'testing-key'});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
after(async()=>{await new Promise(resolve=>server.close(resolve));db.close();rmSync(dir,{recursive:true,force:true});});
const req=async(path,{method='GET',body,headers={},cookie}={})=>{
  const res=await fetch(base+path,{method,headers:{...(body&&typeof body==='string'?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{}),...headers},body});
  return {status:res.status,body:await res.json(),cookie:res.headers.get('set-cookie')};
};
let id,rev,sharedCookie;
test('homepage and frontend files are served',async()=>{
  const homepage=await fetch(base+'/');
  assert.equal(homepage.status,200);
  assert.match(homepage.headers.get('content-type'),/text\/html/);
  assert.match(await homepage.text(),/Docspace/i);
  const app=await fetch(base+'/app.js');
  assert.equal(app.status,200);
  assert.match(await app.text(),/document/i);
});
test('health endpoint and seeded accounts',async()=>{
  assert.deepEqual((await req('/api/health')).body,{ok:true});
  const r=await req('/api/me');assert.equal(r.body.users.length,3);assert.equal(r.body.user.name,'Alex Morgan');
});
test('create and persist formatted document',async()=>{
  let r=await req('/api/documents',{method:'POST',body:JSON.stringify({title:'Roadmap'})});assert.equal(r.status,201);id=r.body.document.id;rev=r.body.document.revision;
  r=await req(`/api/documents/${id}`,{method:'PUT',body:JSON.stringify({title:'Q4 Roadmap',html:'<h2>Priorities</h2><ul><li><strong>Ship</strong> prototype</li></ul>',revision:rev})});
  assert.equal(r.status,200);rev=r.body.document.revision;
  r=await req(`/api/documents/${id}`);assert.match(r.body.document.html,/<strong>Ship<\/strong>/);assert.equal(r.body.document.title,'Q4 Roadmap');
});
test('sanitization strips dangerous attributes and script elements',async()=>{
  const r=await req(`/api/documents/${id}`,{method:'PUT',body:JSON.stringify({html:'<p onclick="alert(1)">Safe</p><script>alert(2)</script><img src=x onerror=alert(3)>',revision:rev})});
  assert.equal(r.status,200);assert.equal(r.body.document.html,'<p>Safe</p>');rev=r.body.document.revision;
});
test('share document, edit as editor, viewer blocked',async()=>{
  const share=await req(`/api/documents/${id}/share`,{method:'POST',body:JSON.stringify({userId:2,role:'editor'})});assert.equal(share.status,200);
  let s=await req('/api/switch',{method:'POST',body:JSON.stringify({userId:2})});sharedCookie=s.cookie.split(';')[0];
  let r=await req('/api/documents',{cookie:sharedCookie});assert.equal(r.body.documents[0].role,'editor');
  r=await req(`/api/documents/${id}`,{method:'PUT',cookie:sharedCookie,body:JSON.stringify({html:'<p>Jordan edit</p>',revision:rev})});assert.equal(r.status,200);rev=r.body.document.revision;
  await req(`/api/documents/${id}/share`,{method:'POST',body:JSON.stringify({userId:2,role:'viewer'})});
  r=await req(`/api/documents/${id}`,{method:'PUT',cookie:sharedCookie,body:JSON.stringify({html:'<p>Unauthorized</p>',revision:rev})});assert.equal(r.status,403);
  r=await req(`/api/documents/${id}/share`,{method:'POST',cookie:sharedCookie,body:JSON.stringify({userId:3,role:'editor'})});assert.equal(r.status,403);
});
test('stale write fails instead of silently overwriting content',async()=>{
  const r=await req(`/api/documents/${id}`,{method:'PUT',body:JSON.stringify({html:'<p>Stale</p>',revision:rev-1})});assert.equal(r.status,409);
  assert.equal((await req(`/api/documents/${id}`)).body.document.html,'<p>Jordan edit</p>');
});
test('UTF-8 text and markdown import work; unsupported file rejected',async()=>{
  let r=await req('/api/import',{method:'POST',headers:{'X-Filename':'notes.md','Content-Type':'application/octet-stream'},body:'## Title\n- Item\n- Another'});
  assert.equal(r.status,201);assert.match(r.body.document.html,/<h2>Title<\/h2>/);assert.match(r.body.document.html,/<li>Another<\/li>/);
  r=await req('/api/import',{method:'POST',headers:{'X-Filename':'test.exe','Content-Type':'application/octet-stream'},body:'bad'});assert.equal(r.status,400);
});
test('unshared user cannot access other user documents',async()=>{
  const s=await req('/api/switch',{method:'POST',body:JSON.stringify({userId:3})});
  const r=await req(`/api/documents/${id}`,{cookie:s.cookie.split(';')[0]});assert.equal(r.status,404);
});