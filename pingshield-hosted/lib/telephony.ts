import { env } from 'cloudflare:workers';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { contactDb, decryptCallback } from './contact-store';
import { maskedCallRequest, maskedDial, validPhoneConfig, type PhoneConfig } from './telephony-protocol';
export function phoneConfig(): PhoneConfig {
  return {apiBase:env.JAMBONZ_API_BASE||'',accountSid:env.JAMBONZ_ACCOUNT_SID||'',apiKey:env.JAMBONZ_API_KEY||'',proxyNumber:env.MASKED_CALL_NUMBER||'',ownerNumber:env.OWNER_PHONE_NUMBER||''};
}
export function callingReady() { return validPhoneConfig(phoneConfig()); }
function hookPassword(id: string) {
  if(!env.OWNER_SESSION_SECRET)throw new Error('configuration_missing');
  return createHmac('sha256',env.OWNER_SESSION_SECRET).update(`phone-hook:${id}`).digest('hex');
}
export function validHook(id: string,authorization: string|null) {
  if(!authorization||!env.OWNER_SESSION_SECRET)return false;
  const expected=Buffer.from(`Basic ${Buffer.from(`pingshield:${hookPassword(id)}`).toString('base64')}`);
  const actual=Buffer.from(authorization);
  return expected.length===actual.length&&timingSafeEqual(expected,actual);
}
export async function approveMaskedCall(id: string,origin: string) {
  if(!callingReady())throw new Error('calling_unavailable');
  const row=await contactDb().prepare('SELECT callback_ciphertext,expires_at FROM contact_threads WHERE id=?').bind(id)
    .first<{callback_ciphertext:string|null;expires_at:string}>();
  if(!row?.callback_ciphertext||Date.parse(row.expires_at)<=Date.now())throw new Error('invalid_call');
  const caller=decryptCallback(row.callback_ciphertext);
  const request=maskedCallRequest(phoneConfig(),caller,origin,id,hookPassword(id));
  const locked=await contactDb().prepare(`UPDATE contact_threads SET call_status='starting',updated_at=? WHERE id=?
    AND call_status='requested' AND NOT EXISTS(SELECT 1 FROM contact_threads WHERE call_status IN ('starting','queued','ringing','in-progress','dispatch_unknown'))`)
    .bind(new Date().toISOString(),id).run();
  if(!locked.meta.changes)throw new Error('call_busy');
  let response: Response;
  try {
    response=await fetch(request.url,{method:'POST',headers:{Authorization:`Bearer ${phoneConfig().apiKey}`,'Content-Type':'application/json'},body:JSON.stringify(request.payload),signal:AbortSignal.timeout(15000)});
  } catch {
    await contactDb().prepare("UPDATE contact_threads SET call_status='dispatch_unknown' WHERE id=?").bind(id).run();
    throw new Error('call_unknown');
  }
  if(!response.ok) {
    await contactDb().prepare('UPDATE contact_threads SET call_status=? WHERE id=?').bind(response.status>=500?'dispatch_unknown':'failed',id).run();
    throw new Error(response.status>=500?'call_unknown':'call_failed');
  }
  let data:{sid?:string};
  try{data=await response.json() as {sid?:string};}catch{
    await contactDb().prepare("UPDATE contact_threads SET call_status='dispatch_unknown' WHERE id=?").bind(id).run();throw new Error('call_unknown');
  }
  if(!data.sid||!/^[-a-zA-Z0-9]{8,80}$/.test(data.sid)) {
    await contactDb().prepare("UPDATE contact_threads SET call_status='dispatch_unknown' WHERE id=?").bind(id).run();
    throw new Error('call_unknown');
  }
  await contactDb().prepare(`UPDATE contact_threads SET call_sid=?,call_status=CASE WHEN call_status='starting' THEN 'queued' ELSE call_status END WHERE id=?`).bind(data.sid,id).run();
  return {status:'queued'};
}
export async function answerMaskedCall(id: string,sid: string) {
  // Only an authenticated, per-conversation provider hook can claim the first call SID.
  await contactDb().prepare("UPDATE contact_threads SET call_sid=?,call_status='in-progress' WHERE id=? AND call_sid IS NULL AND call_status='starting'").bind(sid,id).run();
  const row=await contactDb().prepare('SELECT call_sid,call_status FROM contact_threads WHERE id=? AND expires_at>?').bind(id,new Date().toISOString()).first<{call_sid:string|null;call_status:string}>();
  if(!row||!callingReady()||row.call_sid!==sid||!['queued','ringing','in-progress'].includes(row.call_status))return [{verb:'hangup'}];
  return maskedDial(phoneConfig());
}
export async function callStatus(id: string,sid: string,status: string) {
  const allowed=['trying','ringing','in-progress','completed','busy','no-answer','failed'];
  if(!allowed.includes(status))return;
  await contactDb().prepare("UPDATE contact_threads SET call_sid=? WHERE id=? AND call_sid IS NULL AND call_status='starting'").bind(sid,id).run();
  await contactDb().prepare(`UPDATE contact_threads SET call_status=?,updated_at=? WHERE id=? AND call_sid=? AND call_status NOT IN ('completed','busy','no-answer','failed')`)
    .bind(status==='trying'?'queued':status,new Date().toISOString(),id,sid).run();
}
