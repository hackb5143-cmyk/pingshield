import type { EmailStatus } from './contact-types';
export const publicSiteOrigin='https://pingshield-location-beacon.sunlitbeech14.chatgpt.site';
export function validRecipient(value: string) { return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value)&&value.length<=254; }
export function buildOwnerEmailPayload(threadId:string,message:string):Record<string,string>{
  return {name:'PingShield finder',message,conversation:threadId.slice(0,8),owner_inbox:`${publicSiteOrigin}/owner`,reply_instructions:'Open the protected owner inbox to reply privately. Email replies do not reach the finder.',_subject:'PingShield: new recovery message · DEMO001',_url:`${publicSiteOrigin}/s/DEMO001`,_captcha:'false',_template:'table'};
}
function providerDiagnostic(message: unknown) {
  return typeof message==='string'?message.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,'[redacted email]').slice(0,180):'No provider message';
}
export type EmailAttempt={status:EmailStatus;httpStatus?:number;detail?:string};
export async function submitOwnerEmailAttempt(recipient: string,threadId: string,message: string,transport: typeof fetch=fetch):Promise<EmailAttempt> {
  if(!validRecipient(recipient))return {status:'disabled'};
  try {
    const response=await transport(`https://formsubmit.co/ajax/${encodeURIComponent(recipient)}`,{
      method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json',Referer:`${publicSiteOrigin}/s/DEMO001`,Origin:publicSiteOrigin,'User-Agent':`PingShield/1.0 (+${publicSiteOrigin})`},
      body:JSON.stringify(buildOwnerEmailPayload(threadId,message)),
      signal:AbortSignal.timeout(8000),
    });
    let result:{success?:unknown;message?:unknown;error?:unknown};
    const raw=await response.text();
    try {result=JSON.parse(raw) as typeof result;}catch{console.warn('Owner email provider returned a non-JSON response',{httpStatus:response.status,contentType:response.headers.get('content-type')});return {status:'failed',httpStatus:response.status,detail:providerDiagnostic(raw.replace(/<[^>]*>/g,' ').replace(/\s+/g,' '))};}
    if(response.ok&&(result.success===true||result.success==='true'))return {status:'accepted',httpStatus:response.status};
    if(typeof result.message==='string'&&/activat/i.test(result.message))return {status:'activation_required',httpStatus:response.status};
    console.warn('Owner email provider rejected notification',{httpStatus:response.status,reason:providerDiagnostic(result.message)});
    return {status:response.status>=500?'unknown':'failed',httpStatus:response.status,detail:providerDiagnostic(result.message||result.error)};
  }catch{return {status:'unknown',detail:'Network request could not be confirmed'};}
}
export async function submitOwnerEmail(recipient:string,threadId:string,message:string,transport:typeof fetch=fetch):Promise<EmailStatus>{return (await submitOwnerEmailAttempt(recipient,threadId,message,transport)).status;}
