import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export function initStore(dbPath) {
  mkdirSync(dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec(`PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE, email TEXT NOT NULL UNIQUE
    );
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL, html TEXT NOT NULL DEFAULT '<p></p>',
      owner_id INTEGER NOT NULL REFERENCES users(id),
      revision INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS document_versions (
      document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      revision INTEGER NOT NULL, title TEXT NOT NULL, html TEXT NOT NULL,
      edited_by INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      PRIMARY KEY(document_id,revision)
    );
    CREATE TABLE IF NOT EXISTS document_shares (
      document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id),
      role TEXT NOT NULL CHECK(role IN ('editor','viewer')),
      PRIMARY KEY(document_id,user_id)
    );
  `);
  db.prepare('INSERT OR IGNORE INTO users (id,name,email) VALUES (?,?,?)').run(1,'Alex Morgan','alex@example.test');
  db.prepare('INSERT OR IGNORE INTO users (id,name,email) VALUES (?,?,?)').run(2,'Jordan Lee','jordan@example.test');
  db.prepare('INSERT OR IGNORE INTO users (id,name,email) VALUES (?,?,?)').run(3,'Sam Rivera','sam@example.test');
  // Existing databases get a baseline snapshot without rewriting current documents.
  db.exec(`INSERT OR IGNORE INTO document_versions(document_id,revision,title,html,edited_by)
    SELECT id,revision,title,html,owner_id FROM documents;`);
  return db;
}
export function listDocs(db, userId) {
  return db.prepare(`SELECT d.id,d.title,d.owner_id,d.revision,d.updated_at,u.name AS owner_name,
     CASE WHEN d.owner_id=? THEN 'owner' ELSE s.role END AS role
     FROM documents d JOIN users u ON u.id=d.owner_id
     LEFT JOIN document_shares s ON d.id=s.document_id AND s.user_id=?
     WHERE d.owner_id=? OR s.user_id=?
     ORDER BY d.updated_at DESC,d.id DESC`).all(userId,userId,userId,userId);
}
export function getDoc(db,id,userId){
  return db.prepare(`SELECT d.*, u.name owner_name,
  CASE WHEN d.owner_id=? THEN 'owner' ELSE s.role END role
  FROM documents d JOIN users u ON u.id=d.owner_id
  LEFT JOIN document_shares s ON d.id=s.document_id AND s.user_id=?
  WHERE d.id=? AND (d.owner_id=? OR s.user_id=?)`).get(userId,userId,id,userId,userId);
}
export function createDoc(db,userId,title,html='<p></p>') {
  const id=db.prepare('INSERT INTO documents(title,html,owner_id) VALUES(?,?,?)').run(title,html,userId).lastInsertRowid;
  const doc=getDoc(db,Number(id),userId);
  recordVersion(db,doc,userId);
  return doc;
}
export function updateDoc(db,id,userId,{title,html,revision}){
  const doc=getDoc(db,id,userId);
  if(!doc) return {error:'not_found'};
  if(doc.role==='viewer') return {error:'forbidden'};
  if(revision!==doc.revision) return {error:'conflict',doc};
  if(title===undefined && html===undefined) return {doc};
  db.prepare(`UPDATE documents SET title=?, html=?, revision=revision+1,updated_at=datetime('now') WHERE id=?`).run(title??doc.title,html??doc.html,id);
  const updated=getDoc(db,id,userId);
  recordVersion(db,updated,userId);
  return {doc:updated};
}
export function shareDoc(db,id,ownerId,targetId,role){
  const doc=db.prepare('SELECT * FROM documents WHERE id=? AND owner_id=?').get(id,ownerId);
  if(!doc) return {error:'not_found'};
  if(ownerId===targetId) return {error:'self_share'};
  if(!db.prepare('SELECT id FROM users WHERE id=?').get(targetId)) return {error:'unknown_user'};
  db.prepare(`INSERT INTO document_shares(document_id,user_id,role) VALUES(?,?,?)
  ON CONFLICT(document_id,user_id) DO UPDATE SET role=excluded.role`).run(id,targetId,role);
  return {ok:true};
}
export function listShares(db,id,ownerId) {
  if(!db.prepare('SELECT 1 FROM documents WHERE id=? AND owner_id=?').get(id,ownerId)) return null;
  return db.prepare(`SELECT u.id,u.name,u.email,s.role FROM document_shares s JOIN users u ON u.id=s.user_id WHERE s.document_id=?`).all(id);
}

function recordVersion(db,doc,userId){
  db.prepare(`INSERT INTO document_versions(document_id,revision,title,html,edited_by)
     VALUES(?,?,?,?,?)`).run(doc.id,doc.revision,doc.title,doc.html,userId);
}
export function listVersions(db,id,userId){
  if(!getDoc(db,id,userId)) return null;
  return db.prepare(`SELECT v.revision,v.title,v.created_at,u.name AS edited_by
    FROM document_versions v JOIN users u ON u.id=v.edited_by
    WHERE v.document_id=? ORDER BY v.revision DESC LIMIT 100`).all(id);
}
export function getVersion(db,id,version,userId){
  if(!getDoc(db,id,userId)) return null;
  return db.prepare(`SELECT v.revision,v.title,v.html,v.created_at,u.name AS edited_by
    FROM document_versions v JOIN users u ON u.id=v.edited_by
    WHERE v.document_id=? AND v.revision=?`).get(id,version);
}
export function restoreVersion(db,id,version,userId,currentRevision){
  const doc=getDoc(db,id,userId);
  if(!doc) return {error:'not_found'};
  if(doc.role==='viewer') return {error:'forbidden'};
  if(doc.revision!==currentRevision) return {error:'conflict'};
  const old=getVersion(db,id,version,userId);
  if(!old) return {error:'version_not_found'};
  // Restores create a new revision: the previous current version remains recoverable.
  return updateDoc(db,id,userId,{title:old.title,html:old.html,revision:currentRevision});
}