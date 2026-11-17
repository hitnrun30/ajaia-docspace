import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes,createHmac,timingSafeEqual } from 'node:crypto';
import { initStore,listDocs,getDoc,createDoc,updateDoc,shareDoc,listShares } from './store.js';
import { sanitizeHtml, importFile } from './sanitize.js';

const root=resolve(fileURLToPath(new URL('../public/',import.meta.url)));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'};
// Deliberate allowlist: this small application serves only its three frontend assets.
const staticFiles=new Map([['/','index.html'],['/index.html','index.html'],['/app.js','app.js'],['/styles.css','styles.css']]);
function json(res,code,obj){res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(obj));}
function error(res,code,message){json(res,code,{error:message});}
async function body(req,limit=600000){let chunks=[],length=0;for await(const chunk of req){length+=chunk.length;if(length>limit){const e=new Error('Request too large');e.code=413;throw e;}chunks.push(chunk);}return Buffer.concat(chunks);}
function parsedJson(bytes){try{return JSON.parse(bytes.toString('utf-8'));}catch{throw Object.assign(new Error('Invalid JSON'),{code:400});}}
const readCookie=req=>Object.fromEntries((req.headers.cookie||'').split(';').map(x=>x.trim().split('=').slice(0,2)).filter(x=>x.length===2));
const sign=(userId,key)=>createHmac('sha256',key).update(String(userId)).digest('hex');
function currentUser(req,key){const c=readCookie(req).demo_user;if(!c)return 1;const [id,sig]=c.split('.');if(!/^[1-3]$/.test(id)||!/^[a-f0-9]{64}$/.test(sig||''))return 1;return timingSafeEqual(Buffer.from(sig),Buffer.from(sign(id,key)))?Number(id):1;}
function normalizeTitle(s){if(typeof s!=='string'||!s.trim()||s.trim().length>120)throw Object.assign(new Error('Title must be 1–120 characters'),{code:400});return s.trim();}
export function createApp({dbPath=process.env.DB_PATH||'./data/docspace.sqlite',secret=process.env.SESSION_SECRET||randomBytes(32).toString('hex')}={}){
  const db=initStore(dbPath);
  const listener=async(req,res)=>{
    try{
      const url=new URL(req.url,'http://localhost'); const path=url.pathname;
      res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');
      const user=currentUser(req,secret);
      if(path==='/api/health'&&req.method==='GET')return json(res,200,{ok:true});
      if(path==='/api/me'&&req.method==='GET')return json(res,200,{user:db.prepare('SELECT * FROM users WHERE id=?').get(user),users:db.prepare('SELECT * FROM users ORDER BY id').all()});
      if(path==='/api/switch'&&req.method==='POST'){
        const b=parsedJson(await body(req));const id=Number(b.userId);
        if(!db.prepare('SELECT 1 FROM users WHERE id=?').get(id))return error(res,400,'Unknown demo user');
        res.setHeader('Set-Cookie',`demo_user=${id}.${sign(id,secret)}; Path=/; SameSite=Lax; HttpOnly`);
        return json(res,200,{userId:id});
      }
      if(path==='/api/documents'&&req.method==='GET')return json(res,200,{documents:listDocs(db,user)});
      if(path==='/api/documents'&&req.method==='POST'){
        const b=parsedJson(await body(req));return json(res,201,{document:createDoc(db,user,normalizeTitle(b.title||'Untitled document'))});
      }
      if(path==='/api/import'&&req.method==='POST'){
        const filename=decodeURIComponent(String(req.headers['x-filename']||''));
        if(filename.length>200)return error(res,400,'Invalid filename');
        const html=importFile(filename,await body(req,512*1024));
        const title=normalizeTitle(filename.replace(/\.(txt|md)$/i,'')||'Imported document');
        return json(res,201,{document:createDoc(db,user,title,html)});
      }
      const docmatch=path.match(/^\/api\/documents\/(\d+)(?:\/(share|shares))?$/);
      if(docmatch){
        const id=Number(docmatch[1]), sub=docmatch[2];
        if(!sub&&req.method==='GET'){
          const doc=getDoc(db,id,user);return doc?json(res,200,{document:doc}):error(res,404,'Document not found');
        }
        if(!sub&&req.method==='PUT'){
          const b=parsedJson(await body(req));if(!Number.isSafeInteger(b.revision))return error(res,400,'Revision required');
          const changes={revision:b.revision};if(b.title!==undefined)changes.title=normalizeTitle(b.title);
          if(b.html!==undefined)changes.html=sanitizeHtml(b.html);
          const result=updateDoc(db,id,user,changes);
          return result.error==='conflict'?json(res,409,{error:'Document changed in another session. Copy your draft before reloading.',serverRevision:result.doc.revision}):result.error==='forbidden'?error(res,403,'Read-only access'):result.error==='not_found'?error(res,404,'Document not found'):json(res,200,{document:result.doc});
        }
        if(sub==='share'&&req.method==='POST'){
          const b=parsedJson(await body(req));
          if(!['editor','viewer'].includes(b.role))return error(res,400,'Choose editor or viewer');
          const result=shareDoc(db,id,user,Number(b.userId),b.role);
          return result.error?error(res,result.error==='not_found'?403:400,result.error):json(res,200,result);
        }
        if(sub==='shares'&&req.method==='GET'){
          const shares=listShares(db,id,user);return shares===null?error(res,403,'Only the owner can view sharing settings'):json(res,200,{shares});
        }
      }
      if(req.method==='GET'&&!path.startsWith('/api/')){
        const asset=staticFiles.get(path);
        if(!asset)return error(res,404,'Not found');
        const filePath=resolve(root,asset);
        try {const data=await readFile(filePath);res.writeHead(200,{'Content-Type':mime[extname(filePath)]||'application/octet-stream','Cache-Control':asset==='index.html'?'no-cache':'public,max-age=300'});return res.end(data);}catch {return error(res,404,'Not found');}
      }
      error(res,404,'Route not found');
    }catch(e){const code=e.code===413?413:(e.code===400?400: e.message?.includes('File')||e.message?.includes('Only .txt')||e.message?.includes('Document content')||e.message?.includes('UTF')?400:500);if(code===500)console.error(e);error(res,code,code===500?'Server error':e.message);}
  };
  return {db,server:createServer(listener)};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const port=Number(process.env.PORT||3000);const {server}=createApp();server.listen(port,'0.0.0.0',()=>console.log(`Docspace listening on http://localhost:${port}`));
}