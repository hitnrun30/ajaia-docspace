const $ = id=>document.getElementById(id);
const state={user:null,users:[],documents:[],doc:null,filter:'all',timer:null,dirty:false,saving:false,historyVersion:null};
const api=async(path,opts={})=>{
 const res=await fetch(path,{...opts,headers:{...(opts.body && !(opts.body instanceof Uint8Array)?{'Content-Type':'application/json'}:{}),...opts.headers}});
 const data=await res.json();if(!res.ok){const e=new Error(data.error||'Request failed');e.status=res.status;throw e;}return data;
};
const toast=(msg)=>{const t=$('toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),3600);};
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const dates=s=>new Date(s?.replace(' ','T')+'Z').toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});
async function refresh(){const [me,list]=await Promise.all([api('/api/me'),api('/api/documents')]);state.user=me.user;state.users=me.users;state.documents=list.documents;$('allCount').textContent=list.documents.length;
 $('userSelect').innerHTML=state.users.map(u=>`<option value="${u.id}" ${u.id===state.user.id?'selected':''}>${esc(u.name)}</option>`).join('');renderList();}
function renderList(){const term=$('searchInput').value.trim().toLowerCase();const docs=state.documents.filter(d=>(state.filter==='all'||(state.filter==='owner'?d.role==='owner':d.role!=='owner'))&&d.title.toLowerCase().includes(term));
 $('docGrid').innerHTML=docs.map(d=>`<button class="doc-card" data-id="${d.id}"><span class="doc-icon">▤</span><div class="doc-title">${esc(d.title)}</div><div class="doc-meta">${d.role==='owner'?'You own this':`Shared by ${esc(d.owner_name)}`} · ${dates(d.updated_at)}</div><div class="role-pill ${d.role!=='owner'?'shared':''}">${d.role==='owner'?'Owned':d.role==='viewer'?'View only':'Can edit'}</div></button>`).join('');$('emptyState').classList.toggle('hidden',docs.length>0);$('listSubtitle').textContent=state.filter==='all'?'Everything you’re working on':state.filter==='owner'?'Documents you created':'Documents teammates shared with you';
 document.querySelectorAll('.doc-card').forEach(el=>el.addEventListener('click',()=>openDoc(Number(el.dataset.id))));}
async function create(){try{const {document:d}=await api('/api/documents',{method:'POST',body:JSON.stringify({title:'Untitled document'})});await openDoc(d.id);}catch(e){toast(e.message);}}
async function openDoc(id){try{await flush();const {document:d}=await api('/api/documents/'+id);state.doc=d;state.dirty=false;$('titleInput').value=d.title;$('editor').innerHTML=d.html;$('permissionLabel').textContent=d.role==='owner'?'Owned by you':`Shared by ${d.owner_name} · ${d.role}`;$('saveStatus').textContent='All changes saved';
 const readonly=d.role==='viewer';$('titleInput').readOnly=readonly;$('editor').contentEditable=String(!readonly);$('toolbar').querySelectorAll('button,select').forEach(b=>b.disabled=readonly);$('shareBtn').classList.toggle('hidden',d.role!=='owner');$('readOnlyBanner').classList.toggle('hidden',!readonly);$('historyModal').classList.add('hidden');$('homeView').classList.add('hidden');$('editorView').classList.remove('hidden');wordCount();if(!readonly)$('editor').focus();}catch(e){toast(e.message);}}
function wordCount(){const words=$('editor').innerText.trim().split(/\s+/).filter(Boolean).length;$('wordCount').textContent=`${words} word${words===1?'':'s'}`;}
function markDirty(){if(!state.doc||state.doc.role==='viewer')return;state.dirty=true;$('saveStatus').textContent='Unsaved changes';wordCount();clearTimeout(state.timer);state.timer=setTimeout(()=>flush(),750);}
async function flush(){clearTimeout(state.timer);if(!state.doc||!state.dirty||state.saving)return;state.saving=true;const id=state.doc.id,revision=state.doc.revision,title=$('titleInput').value,html=$('editor').innerHTML;state.dirty=false;$('saveStatus').textContent='Saving…';
 try{const {document:d}=await api(`/api/documents/${id}`,{method:'PUT',body:JSON.stringify({title,html,revision})});if(state.doc?.id===id){state.doc=d;if(!state.dirty){$('saveStatus').textContent='All changes saved';}}}catch(e){state.dirty=true;$('saveStatus').textContent=e.status===409?'Conflict — copy your text before reloading':'Save failed — retry';toast(e.message);}finally{state.saving=false;if(state.dirty&&state.doc?.id===id&&$(`saveStatus`).textContent==='Unsaved changes')state.timer=setTimeout(flush,900);}}
async function back(){$('historyModal').classList.add('hidden');await flush();if(state.dirty){toast('Changes not saved. Please retry before leaving.');return;}state.doc=null;$('editorView').classList.add('hidden');$('homeView').classList.remove('hidden');await refresh();}
async function showShare(){if(state.doc?.role!=='owner')return;await flush();$('shareUser').innerHTML=state.users.filter(u=>u.id!==state.user.id).map(u=>`<option value="${u.id}">${esc(u.name)} (${esc(u.email)})</option>`).join('');await loadShares();$('modal').classList.remove('hidden');}
async function loadShares(){const {shares}=await api(`/api/documents/${state.doc.id}/shares`);$('shareList').innerHTML=`<div class="person"><b>${esc(state.user.name)} (you)</b><span>Owner</span></div>`+shares.map(s=>`<div class="person"><b>${esc(s.name)}</b><span>${s.role==='editor'?'Can edit':'Can view'}</span></div>`).join('');}
async function showHistory(){
 if(!state.doc)return;
 if(state.saving){toast('Wait for the current save to finish.');return;}
 await flush();
 if(state.dirty){toast('Save your changes before viewing history.');return;}
 const id=state.doc.id;
 try{
  const {versions}=await api(`/api/documents/${id}/versions`);
  if(state.doc?.id!==id)return;
  state.historyVersion=null;
  $('historyList').innerHTML=versions.map(v=>`<button type="button" class="history-version" data-revision="${v.revision}"><b>Version ${v.revision}${v.revision===state.doc.revision?' · Current':''}</b><small>${esc(v.title)}<br>${esc(v.edited_by)} · ${new Date(v.created_at).toLocaleString()}</small></button>`).join('')||'<p class="modal-sub">No saved versions yet.</p>';
  $('historyMeta').textContent='Select a version to preview';
  $('historyPreview').textContent='';
  $('restoreVersionBtn').disabled=true;
  $('historyModal').classList.remove('hidden');
  $('historyList').querySelectorAll('[data-revision]').forEach(btn=>btn.addEventListener('click',()=>previewVersion(Number(btn.dataset.revision))));
  if(versions.length)await previewVersion(versions[0].revision);
 }catch(e){toast(e.message);}
}
async function previewVersion(revision){
 if(!state.doc)return;
 try{
  const id=state.doc.id;
  const {version:v}=await api(`/api/documents/${id}/versions/${revision}`);
  if(state.doc?.id!==id||$('historyModal').classList.contains('hidden'))return;
  state.historyVersion=v.revision;
  $('historyList').querySelectorAll('[data-revision]').forEach(el=>el.classList.toggle('active',Number(el.dataset.revision)===revision));
  $('historyMeta').textContent=`${v.title} · Saved by ${v.edited_by} · ${new Date(v.created_at).toLocaleString()}`;
  $('historyPreview').innerHTML=v.html;
  $('restoreVersionBtn').disabled=state.doc.role==='viewer'||revision===state.doc.revision;
 }catch(e){toast(e.message);}
}
async function restoreSelectedVersion(){
 if(!state.doc||state.doc.role==='viewer'||state.historyVersion===null||state.saving||state.dirty)return;
 try{
  const id=state.doc.id,revision=state.doc.revision,version=state.historyVersion;
  const {document:d}=await api(`/api/documents/${id}/versions/${version}/restore`,{method:'POST',body:JSON.stringify({revision})});
  if(state.doc?.id!==id)return;
  state.doc=d;$('titleInput').value=d.title;$('editor').innerHTML=d.html;
  $('saveStatus').textContent='All changes saved';wordCount();
  $('historyModal').classList.add('hidden');toast(`Restored version ${version} as version ${d.revision}`);
 }catch(e){toast(e.message);}
}
$('historyBtn').addEventListener('click',showHistory);
$('closeHistory').addEventListener('click',()=>$('historyModal').classList.add('hidden'));
$('historyModal').addEventListener('click',e=>{if(e.target===$('historyModal'))$('historyModal').classList.add('hidden');});
$('restoreVersionBtn').addEventListener('click',restoreSelectedVersion);
async function exportCurrent(){
 if(!state.doc)return;
 if(state.saving){toast('Wait for the current save to finish.');return;}
 await flush();
 if(state.dirty){toast('Please save changes before exporting.');return;}
 const format=$('exportFormat').value;
 const res=await fetch(`/api/documents/${state.doc.id}/export?format=${encodeURIComponent(format)}`);
 if(!res.ok){const response=await res.json();throw new Error(response.error||'Export failed');}
 const blob=await res.blob(),disposition=res.headers.get('Content-Disposition')||'';
 const name=disposition.match(/filename="([^"]+)"/)?.[1]||`document.${format}`;
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
$('exportBtn').addEventListener('click',()=>exportCurrent().catch(e=>toast(e.message)));
$('newBtn').addEventListener('click',create);$('heroNew').addEventListener('click',create);$('backBtn').addEventListener('click',back);$('searchInput').addEventListener('input',renderList);
document.querySelectorAll('[data-filter]').forEach(el=>el.addEventListener('click',async()=>{
 if(!$('editorView').classList.contains('hidden')){
  await back();
  if(state.doc)return; // Stay in the editor if saving failed.
 }
 state.filter=el.dataset.filter;
 document.querySelectorAll('[data-filter]').forEach(n=>n.classList.toggle('active',n===el));
 renderList();
}));
$('editor').addEventListener('input',markDirty);$('titleInput').addEventListener('input',markDirty);$('shareBtn').addEventListener('click',showShare);$('closeModal').addEventListener('click',()=>$('modal').classList.add('hidden'));
$('modal').addEventListener('click',e=>{if(e.target===$('modal'))$('modal').classList.add('hidden');});
$('shareForm').addEventListener('submit',async e=>{e.preventDefault();try{await api(`/api/documents/${state.doc.id}/share`,{method:'POST',body:JSON.stringify({userId:Number($('shareUser').value),role:$('shareRole').value})});await loadShares();toast('Sharing updated');}catch(err){toast(err.message);}});
$('userSelect').addEventListener('change',async e=>{try{await flush();if(state.dirty){toast('Save before switching users');return;}await api('/api/switch',{method:'POST',body:JSON.stringify({userId:Number(e.target.value)})});state.doc=null;$('editorView').classList.add('hidden');$('homeView').classList.remove('hidden');await refresh();toast(`Switched to ${state.user.name}`);}catch(err){toast(err.message);}});
$('importFile').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{if(!/\.(txt|md)$/i.test(file.name))throw new Error('Choose a .txt or .md file');if(file.size>512*1024)throw new Error('Maximum file size is 512 KB');const bytes=new Uint8Array(await file.arrayBuffer());const {document:d}=await api('/api/import',{method:'POST',headers:{'Content-Type':'application/octet-stream','X-Filename':encodeURIComponent(file.name)},body:bytes});await openDoc(d.id);toast('File imported as an editable document');}catch(err){toast(err.message);}finally{e.target.value='';}});
$('toolbar').querySelectorAll('[data-command]').forEach(btn=>btn.addEventListener('click',()=>{if(state.doc?.role==='viewer')return;$('editor').focus();document.execCommand(btn.dataset.command,false,null);markDirty();}));
$('blockSelect').addEventListener('change',e=>{if(state.doc?.role==='viewer')return;$('editor').focus();document.execCommand('formatBlock',false,e.target.value);markDirty();});
window.addEventListener('beforeunload',e=>{if(state.dirty){e.preventDefault();e.returnValue='';}});
refresh().catch(e=>toast('Could not load workspace: '+e.message));