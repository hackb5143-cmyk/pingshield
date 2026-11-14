import { env } from 'cloudflare:workers';
import { createHash, randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';
import type { ContactThread, ContactMessage } from './contact-types';
export function contactDb() { if (!env.DB) throw new Error('database_unavailable'); return env.DB; }
export function tokenDigest(token: string) { return createHash('sha256').update(token).digest('hex'); }
export function sourceDigest(ip: string) {
  if (!env.REPORT_HASH_SECRET) throw new Error('configuration_missing');
  return tokenDigest(`${env.REPORT_HASH_SECRET}:chat:${ip}`);
}
function cipherKey() {
  if (!env.OWNER_SESSION_SECRET || env.OWNER_SESSION_SECRET.length<32) throw new Error('configuration_missing');
  return createHash('sha256').update(`callback:${env.OWNER_SESSION_SECRET}`).digest();
}
export function encryptCallback(number: string) {
  const nonce=randomBytes(12); const cipher=createCipheriv('aes-256-gcm',cipherKey(),nonce);
  const encrypted=Buffer.concat([cipher.update(number,'utf8'),cipher.final()]);
  return [nonce,cipher.getAuthTag(),encrypted].map(v=>v.toString('base64url')).join('.');
}
export function decryptCallback(value: string) {
  const [nonce,tag,data]=value.split('.').map(v=>Buffer.from(v,'base64url'));
  const decipher=createDecipheriv('aes-256-gcm',cipherKey(),nonce); decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data),decipher.final()]).toString('utf8');
}
const projection='id,tag_code,created_at,updated_at,expires_at,callback_hint,call_status';
export async function createContact(message: string, requesterHash: string, phone?: string) {
  const id=crypto.randomUUID(); const token=randomBytes(32).toString('hex'); const now=new Date().toISOString();
  const expiresAt=new Date(Date.now()+86400000).toISOString();
  const messageId=crypto.randomUUID();
  const insertion=contactDb().prepare(`INSERT INTO contact_threads
    (id,tag_code,token_hash,requester_hash,created_at,updated_at,expires_at,callback_ciphertext,callback_hint,call_status)
    SELECT ?,'DEMO001',?,?,?,?,?,?,?,? WHERE
    (SELECT count(*) FROM contact_threads WHERE requester_hash=? AND created_at>?)<6`)
    .bind(id,tokenDigest(token),requesterHash,now,now,expiresAt,phone?encryptCallback(phone):null,phone?`•••• ${phone.slice(-4)}`:null,phone?'requested':'not_requested',requesterHash,new Date(Date.now()-600000).toISOString());
  const first=contactDb().prepare(`INSERT INTO contact_messages (id,thread_id,sender,content,created_at,sequence)
    SELECT ?,?,'finder',?,?,1 WHERE EXISTS(SELECT 1 FROM contact_threads WHERE id=?)`)
    .bind(messageId,id,message,now,id);
  const [result]=await contactDb().batch([insertion,first]);
  if (!result.meta.changes) throw new Error('rate_limit');
  return { id,token,expiresAt,messageId };
}
export async function listContacts() {
  const {results}=await contactDb().prepare(`SELECT ${projection} FROM contact_threads ORDER BY updated_at DESC LIMIT 100`).all<ContactThread>();
  return results;
}
export async function getContact(id: string, token?: string, owner=false) {
  const row=await contactDb().prepare(`SELECT ${projection} FROM contact_threads WHERE id=?${owner?'':' AND token_hash=?'}`)
    .bind(...(owner?[id]:[id,tokenDigest(token||'')])).first<ContactThread>();
  if (!row) throw new Error('unauthorized');
  if (!owner && Date.parse(row.expires_at)<=Date.now()) throw new Error('expired');
  return row;
}
export async function contactMessagesFor(id: string) {
  const {results}=await contactDb().prepare(`SELECT * FROM (SELECT id,sender,content,created_at,sequence,email_status,email_attempted_at FROM contact_messages
    WHERE thread_id=? ORDER BY sequence DESC LIMIT 100) ORDER BY sequence ASC`).bind(id).all<ContactMessage>();
  return results;
}
export async function appendContactMessage(id: string, sender: 'finder'|'owner', content: string) {
  const now=new Date().toISOString(); const cutoff=new Date(Date.now()-2000).toISOString();
  const messageId=crypto.randomUUID();
  const result=await contactDb().prepare(`INSERT INTO contact_messages (id,thread_id,sender,content,created_at,sequence)
    SELECT ?,?,?,?,?,coalesce((SELECT max(sequence) FROM contact_messages WHERE thread_id=?),0)+1
    WHERE EXISTS(SELECT 1 FROM contact_threads WHERE id=? AND expires_at>?)
    AND (SELECT count(*) FROM contact_messages WHERE thread_id=?)<200
    AND NOT EXISTS(SELECT 1 FROM contact_messages WHERE thread_id=? AND sender=? AND created_at>?)`)
    .bind(messageId,id,sender,content,now,id,id,now,id,id,sender,cutoff).run();
  if (!result.meta.changes) throw new Error('message_limit');
  await contactDb().prepare('UPDATE contact_threads SET updated_at=? WHERE id=?').bind(now,id).run();
  return {messageId};
}
