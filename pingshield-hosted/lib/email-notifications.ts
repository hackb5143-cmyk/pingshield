import { env } from 'cloudflare:workers';
import { contactDb } from './contact-store';
import { buildOwnerEmailPayload,submitOwnerEmail,validRecipient } from './email-protocol';
import type { EmailStatus,EmailDispatch } from './contact-types';
export function browserEmailEnabled(){return env.EMAIL_PROVIDER==='formsubmit-browser'&&/^[a-f0-9]{32}$/.test(env.FORM_SUBMIT_FORM_ID||'');}
export function emailEnabled() { return browserEmailEnabled()||(env.EMAIL_PROVIDER==='formsubmit'&&validRecipient(env.OWNER_NOTIFICATION_EMAIL||'')); }
export type EmailNotification={status:EmailStatus;emailDispatch?:EmailDispatch};
export async function prepareOwnerEmail(threadId:string,messageId:string,retry=false):Promise<EmailNotification> {
  try {
    const row=await contactDb().prepare('SELECT content,sender,email_status FROM contact_messages WHERE id=? AND thread_id=?')
      .bind(messageId,threadId).first<{content:string;sender:string;email_status:EmailStatus}>();
    if(!row||row.sender!=='finder')return {status:'not_requested'};
    const eligible=retry?['not_requested','disabled','activation_required','failed','rate_limited']:['not_requested'];
    if(!eligible.includes(row.email_status))return {status:row.email_status};
    if(!emailEnabled()) {
      await contactDb().prepare("UPDATE contact_messages SET email_status='disabled' WHERE id=? AND email_status='not_requested'").bind(messageId).run();
      return {status:'disabled'};
    }
    const now=new Date().toISOString();const cutoff=new Date(Date.now()-60000).toISOString();
    // Limits apply atomically across all Worker instances; retries never happen automatically.
    const locked=await contactDb().prepare(`UPDATE contact_messages SET email_status='sending',email_attempted_at=? WHERE id=? AND thread_id=?
      AND email_status IN ('not_requested','disabled','activation_required','failed','rate_limited')
      AND (email_attempted_at IS NULL OR email_attempted_at<=?)
      AND NOT EXISTS(SELECT 1 FROM contact_messages AS other WHERE other.thread_id=? AND other.id!=? AND other.email_attempted_at>?)
      AND (SELECT count(*) FROM contact_messages WHERE email_attempted_at>?)<20`)
      .bind(now,messageId,threadId,cutoff,threadId,messageId,cutoff,new Date(Date.now()-600000).toISOString()).run();
    if(!locked.meta.changes) {
      const current=await contactDb().prepare('SELECT email_status FROM contact_messages WHERE id=?').bind(messageId).first<{email_status:EmailStatus}>();
      if(current&&['sending','accepted','browser_accepted','unknown'].includes(current.email_status))return {status:current.email_status};
      await contactDb().prepare("UPDATE contact_messages SET email_status='rate_limited' WHERE id=? AND email_status IN ('not_requested','disabled','failed','activation_required','rate_limited')").bind(messageId).run();
      return {status:'rate_limited'};
    }
    if(browserEmailEnabled())return {status:'sending',emailDispatch:{threadId,messageId,endpoint:`https://formsubmit.co/ajax/${env.FORM_SUBMIT_FORM_ID}`,payload:buildOwnerEmailPayload(threadId,row.content)}};
    const status=await submitOwnerEmail(env.OWNER_NOTIFICATION_EMAIL!,threadId,row.content);
    await contactDb().prepare("UPDATE contact_messages SET email_status=? WHERE id=? AND email_status='sending' AND email_attempted_at=?").bind(status,messageId,now).run();
    return {status};
  }catch{
    // Notification failures must not turn a committed chat message into a false save failure.
    return {status:'unknown'};
  }
}
export async function notifyOwner(threadId:string,messageId:string,retry=false):Promise<EmailStatus>{return (await prepareOwnerEmail(threadId,messageId,retry)).status;}
