'use client';
import { useCallback,useEffect,useState } from 'react';
import type { ContactSession,ContactThread,ContactMessage,EmailDispatch } from '@/lib/contact-types';
import { deliverBrowserEmail } from '@/lib/client-email';
import ChatLog from './ChatLog';
import styles from './contact.module.css';
export default function FinderContact({mode,tagCode}:{mode:'message'|'call';tagCode:string}) {
  const [session,setSession]=useState<ContactSession|null>(null);
  const [thread,setThread]=useState<ContactThread|null>(null);
  const [messages,setMessages]=useState<ContactMessage[]>([]);
  const [draft,setDraft]=useState(''); const [phone,setPhone]=useState(''); const [consent,setConsent]=useState(false);
  const [enabled,setEnabled]=useState<boolean|null>(null); const [busy,setBusy]=useState(false); const [error,setError]=useState('');
  const [emailOn,setEmailOn]=useState(false);
  useEffect(()=>{
    try {const saved=sessionStorage.getItem(`ps_contact_${tagCode}`);if(saved){const value=JSON.parse(saved) as ContactSession;if(Date.parse(value.expiresAt)>Date.now()&&/^[a-f0-9]{64}$/.test(value.token))setSession(value);}}catch{/* Storage can be disabled. */}
    void fetch('/api/contact/config',{cache:'no-store'}).then(r=>r.json()).then(data=>{const config=data as {callingEnabled:boolean;emailEnabled:boolean};setEnabled(config.callingEnabled);setEmailOn(config.emailEnabled);}).catch(()=>setEnabled(false));
  },[tagCode]);
  const refresh=useCallback(async()=>{
    if(!session)return;
    const res=await fetch(`/api/contact/${session.id}`,{headers:{Authorization:`Bearer ${session.token}`},cache:'no-store',signal:AbortSignal.timeout(10000)});
    const data=await res.json() as {thread:ContactThread;messages:ContactMessage[];error?:string};
    if(!res.ok)throw new Error(data.error||'Could not load replies.');
    setThread(data.thread);setMessages(data.messages);setError('');
  },[session]);
  useEffect(()=>{
    if(!session)return;let live=true;let pending=false;
    const poll=async()=>{if(document.hidden||pending)return;pending=true;try{await refresh();}catch(e){if(live)setError(e instanceof Error?e.message:'Could not load replies.');}finally{pending=false;}};
    void poll();const timer=setInterval(()=>void poll(),4000);return()=>{live=false;clearInterval(timer);};
  },[session,refresh]);
  async function send(e:React.FormEvent,requestCall=false){
    e.preventDefault();setError('');setBusy(true);
    try{
      const res=await fetch(session?`/api/contact/${session.id}${requestCall?'/call':''}`:'/api/contact',{
        method:session&&requestCall?'PUT':'POST',headers:{'Content-Type':'application/json',...(session?{Authorization:`Bearer ${session.token}`}:{})},
        body:JSON.stringify(session?(requestCall?{phone:phone.trim(),callbackConsent:consent}:{message:draft}):{tagCode,message:draft.trim()||(requestCall?'Please call me about your tagged item.':''),...(requestCall?{phone:phone.trim(),callbackConsent:consent}:{})}),signal:AbortSignal.timeout(15000),
      });
      const data=await res.json() as ContactSession&{error?:string;emailDispatch?:EmailDispatch};if(!res.ok)throw new Error(data.error||'Could not send.');
      if(!session){const savedSession={id:data.id,token:data.token,expiresAt:data.expiresAt};setSession(savedSession);try{sessionStorage.setItem(`ps_contact_${tagCode}`,JSON.stringify(savedSession));}catch{}}else await refresh();
      if(data.emailDispatch){await deliverBrowserEmail(data.emailDispatch,session?.token||data.token);if(session)await refresh();}
      if(requestCall){setPhone('');setConsent(false);}
      if(!requestCall||!session)setDraft('');
    }catch(e){setError(e instanceof Error?e.message:'Could not send.');}finally{setBusy(false);}
  }
  return <div className={styles.panel}>
    {mode==='call'&&<section className={styles.notice}><strong>{enabled===null?'Checking phone availability…':enabled?'Request a masked phone call':'Phone calling is not activated yet'}</strong><p>{enabled?'The bridge will ring your phone first, then connect the owner. Both phones see the service number. The owner must approve your request.':'Normal phone calls need a calling service and a service number. You can contact the owner using private chat below.'}</p></section>}
    {mode==='call'&&enabled&&(!session||thread?.call_status==='not_requested')&&<form onSubmit={e=>void send(e,true)} className={styles.form}><label>Your phone number<input type="tel" autoComplete="tel" value={phone} onChange={e=>setPhone(e.target.value)} required pattern="\+[1-9][0-9]{7,14}" placeholder="+91…"/><small>Use international format. Your number is kept private from the owner.</small></label><label className={styles.consent}><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} required/>I own this number and agree to receive a callback.</label><button disabled={busy||!consent}>{busy?'Saving request…':'Request masked callback'}</button></form>}
    {session?<><p className={styles.notice}>Private conversation · {session.id.slice(0,8)}<small>Keep this browser tab to receive replies. Finder access lasts 24 hours.</small>{emailOn&&<small>Owner email alerts use FormSubmit. Notifications are limited to one per minute per conversation.</small>}</p>{thread&&thread.call_status!=='not_requested'&&<p className={styles.status}>Callback status: {thread.call_status.replaceAll('_',' ')}</p>}<ChatLog messages={messages} viewer="finder"/><form className={styles.form} onSubmit={e=>void send(e)}><label>Your message<textarea aria-label="Your private reply" value={draft} onChange={e=>setDraft(e.target.value)} required maxLength={1000} rows={2} placeholder="Reply privately to the owner…"/></label><button disabled={busy||!draft.trim()}>{busy?'Sending…':'Send private reply'}</button></form></>:<form className={styles.form} onSubmit={e=>void send(e)}><p className={styles.hint}>Messages go to the protected owner inbox. No phone number or location is required. {emailOn?'The owner also gets an email copy through FormSubmit. Your email address is not required.':'This is website chat, not SMS.'}</p><div className={styles.chips}>{['I found your item and it is safe with me.','Your item is at reception.'].map(text=><button type="button" key={text} onClick={()=>setDraft(text)}>{text}</button>)}</div><label>Your message<textarea value={draft} onChange={e=>setDraft(e.target.value)} required minLength={3} maxLength={1000} rows={3} placeholder="Tell the owner where their item is safe…"/></label><button disabled={busy||draft.trim().length<3}>{busy?'Sending…':emailOn?'Send message + email alert':'Send private message'}</button></form>}
    {error&&<p role="alert" className={styles.error}>{error}</p>}
  </div>;
}
