// Intentionally constrained rich-text allowlist. No tag attributes survive.
const ALLOWED = new Set(['p','div','br','strong','b','em','i','u','h1','h2','h3','ul','ol','li','blockquote']);
const VOID = new Set(['br']);
const escapeText = value => value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
export function sanitizeHtml(raw) {
  if(typeof raw!=='string' || raw.length>200000) throw new Error('Document content must be text under 200 KB');
  const pieces = raw.match(/<[^>]*>|[^<]+|</g) ?? [];
  let out=''; const stack=[]; let blocked=0;
  for(const piece of pieces){
    if(piece.startsWith('<') && piece.endsWith('>')){
      const match=piece.match(/^<\s*(\/?)\s*([a-z][a-z0-9-]*)\b[^>]*>$/i);
      if(!match) continue;
      const [,closing,rawTag]=match; const tag=rawTag.toLowerCase();
      if(['script','style','iframe','svg','math','object','template'].includes(tag)){
        if(!closing) blocked++; else blocked=Math.max(0,blocked-1);
        continue;
      }
      if(blocked || !ALLOWED.has(tag)) continue;
      if(closing){
        const at=stack.lastIndexOf(tag);
        if(at>=0){while(stack.length>at){out+=`</${stack.pop()}>`;}}
      } else if(VOID.has(tag)) out+='<br>';
      else {out+=`<${tag}>`;stack.push(tag);}
    } else if(!blocked) out+=escapeText(piece).replace(/&amp;((?:amp|lt|gt|quot|apos|nbsp|#\d+|#x[0-9a-f]+));/gi,'&$1;');
  }
  while(stack.length) out+=`</${stack.pop()}>`;
  return out || '<p></p>';
}
export function importFile(name,bytes){
  const ext=name.toLowerCase().split('.').pop();
  if(!['txt','md'].includes(ext)) throw new Error('Only .txt and .md files are supported');
  if(bytes.length>512*1024) throw new Error('File is too large (maximum 512 KB)');
  const body=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
  if(ext==='txt') return sanitizeHtml(body.split(/\r?\n/).map(line=>`<p>${escapeText(line) || '<br>'}</p>`).join(''));
  // Limited, safe Markdown importer: headings, lists, paragraphs and emphasis.
  const lines=body.split(/\r?\n/); let out='',mode='';
  const inline = s=>escapeText(s).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\*(.+?)\*/g,'<em>$1</em>');
  const close=()=>{if(mode){out+=`</${mode}>`;mode='';}};
  for(const line of lines){
    const h=line.match(/^(#{1,3})\s+(.+)$/), bullet=line.match(/^\s*[-*]\s+(.+)$/), num=line.match(/^\s*\d+\.\s+(.+)$/);
    if(h){close();const t='h'+h[1].length;out+=`<${t}>${inline(h[2])}</${t}>`;}
    else if(bullet||num){const t=bullet?'ul':'ol';if(mode!==t){close();mode=t;out+=`<${t}>`;}out+=`<li>${inline((bullet||num)[1])}</li>`;}
    else {close();out+=line.trim()?`<p>${inline(line)}</p>`:'<p><br></p>';}
  }
  close();return sanitizeHtml(out);
}