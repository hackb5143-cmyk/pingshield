import type { EmailDispatch,EmailStatus } from './contact-types';
export async function deliverBrowserEmail(dispatch:EmailDispatch,token?:string):Promise<EmailStatus>{
  if(!/^https:\/\/formsubmit\.co\/ajax\/[a-f0-9]{32}$/.test(dispatch.endpoint))return 'failed';
  let status:Exclude<EmailStatus,'browser_accepted'|'not_requested'|'disabled'|'sending'>='unknown';
  try{
    const response=await fetch(dispatch.endpoint,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(dispatch.payload),signal:AbortSignal.timeout(10000)});
    if(response.status===429)status='rate_limited';
    else{const result=await response.json() as {success?:unknown;message?:unknown};status=response.ok&&(result.success===true||result.success==='true')?'accepted':typeof result.message==='string'&&/activat/i.test(result.message)?'activation_required':response.status>=500?'unknown':'failed';}
  }catch{/* A timeout can occur after acceptance, so no blind retry is attempted. */}
  try{await fetch(`/api/contact/${dispatch.threadId}/email-result`,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify({messageId:dispatch.messageId,status}),signal:AbortSignal.timeout(5000)});}catch{/* Chat remains saved even if the best-effort receipt cannot sync. */}
  return status==='accepted'?'browser_accepted':status;
}
