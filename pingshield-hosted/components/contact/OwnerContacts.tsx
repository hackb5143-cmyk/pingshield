'use client';
import { useCallback,useEffect,useRef,useState } from 'react';
import type { ContactThread,ContactMessage,EmailDispatch } from '@/lib/contact-types';
import { deliverBrowserEmail } from '@/lib/client-email';
import ChatLog from './ChatLog';
import styles from './contact.module.css';
export default function OwnerContacts(){
  const [threads,setThreads]=useState<ContactThread[]>([]);const [selected,setSelected]=useState('');
  const [messages,setMessages]=useState<ContactMessage[]>([]);const [draft,setDraft]=useState('');
  const [enabled,setEnabled]=useState(false);const [error,setError]=useState('');const [busy,setBusy]=useState(false);
  const [emailOn,setEmailOn]=useState(false);
  const current=threads.find(t=>t.id===selected)||threads[0];
  const currentId=useRef(current?.id);currentId.current=current?.id;
  const load=useCallback(async()=>{
    const res=await fetch('/api/contact',{cache:'no-store',signal:AbortSignal.timeout(10000)});const data=await res.json() as {threads:ContactThread[];callingEnabled:boolean;emailEnabled:boolean;error?:string};
    if(!res.ok)throw new Error(data.error||'Could not load conversations.');setThreads(data.threads);setEnabled(data.callingEnabled);setEmailOn(data.emailEnabled);
  },[]);
  const loadMessages=useCallback(async()=>{
    if(!current)return;const res=await fetch(`/api/contact/${current.id}`,{cache:'no-store',signal:AbortSignal.timeout(10000)});
    const data=await res.json() as {messages:ContactMessage[];error?:string};if(!res.ok)throw new Error(data.error||'Could not load messages.');if(currentId.current===current.id)setMessages(data.messages);
  },[current?.id]);
  useEffect(()=>{let pending=false;const poll=async()=>{if(pending||document.hidden)return;pending=true;try{await load();}catch(e){setError(e instanceof Error?e.message:'Connection lost.');}finally{pending=false;}};void poll();const timer=setInterval(()=>void poll(),4000);return()=>clearInterval(timer);},[load]);
  useEffect(()=>{setMessages([]);let pending=false;const poll=async()=>{if(pending||document.hidden)return;pending=true;try{await loadMessages();}catch(e){setError(e instanceof Error?e.message:'Connection lost.');}finally{pending=false;}};void poll();const timer=setInterval(()=>void poll(),4000);return()=>clearInterval(timer);},[loadMessages]);
  async function send(e:React.FormEvent){e.preventDefault();if(!current)return;setBusy(true);setError('');try{const res=await fetch(`/api/contact/${current.id}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:draft})});const data=await res.json() as {error?:string};if(!res.ok)throw new Error(data.error||'Could not send reply.');setDraft('');await loadMessages();}catch(e){setError(e instanceof Error?e.message:'Could not send.');}finally{setBusy(false);}}
  async function call(){if(!current)return;setBusy(true);setError('');try{const res=await fetch(`/api/contact/${current.id}/call`,{method:'POST'});const data=await res.json() as {error?:string};if(!res.ok)throw new Error(data.error||'Could not start call.');await load();}catch(e){setError(e instanceof Error?e.message:'Could not start call.');}finally{setBusy(false);}}
  async function remove(){if(!current||!window.confirm('Delete this private conversation and all its messages?'))return;setBusy(true);try{const res=await fetch(`/api/contact/${current.id}`,{method:'DELETE'});if(!res.ok)throw new Error('Could not delete conversation.');setSelected('');setMessages([]);await load();}catch(e){setError(e instanceof Error?e.message:'Could not delete.');}finally{setBusy(false);}}
  const lastFinder=messages.filter(m=>m.sender==='finder').at(-1);
  async function retryEmail(){if(!current||!lastFinder)return;setBusy(true);setError('');try{const res=await fetch(`/api/contact/${current.id}/email`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messageId:lastFinder.id})});const data=await res.json() as {emailStatus?:string;emailDispatch?:EmailDispatch;error?:string};if(!res.ok)throw new Error(data.error||(res.status===429?'Wait one minute before retrying the email alert.':'Could not retry the email alert.'));if(data.emailDispatch)await deliverBrowserEmail(data.emailDispatch);await loadMessages();}catch(e){setError(e instanceof Error?e.message:'Could not retry email.');}finally{setBusy(false);}}
  return <section className={`${styles.owner} ${styles.panel}`}><div className={styles.heading}><div><h2>Private messages & calls</h2><p>Replies refresh every 4 seconds while this inbox is open.</p></div><span>{threads.length} conversations</span></div>{!enabled&&<p className={styles.notice}>Phone calling is not activated. Private website messages work now; SMS delivery is not enabled.</p>}
    {emailOn&&<p className={styles.notice}>Owner email alerts are enabled through FormSubmit. Check the status below each finder message. Reply here to keep your email address private.</p>}
    {emailOn&&lastFinder&&['activation_required','failed','rate_limited','disabled'].includes(lastFinder.email_status||'')&&<button disabled={busy} onClick={()=>void retryEmail()}>Retry last email alert</button>}
    {threads.length>0?<><label>Conversation<select value={current?.id||''} onChange={e=>{setSelected(e.target.value);setDraft('');}}>{threads.map(t=><option key={t.id} value={t.id}>{t.id.slice(0,8)} · {new Date(t.created_at).toLocaleString()}</option>)}</select></label>{current?.callback_hint&&<div className={styles.callback}><p>Callback number: {current.callback_hint} · {current.call_status.replaceAll('_',' ')}</p>{enabled&&current.call_status==='requested'&&<button disabled={busy} onClick={()=>void call()}>Approve & call through bridge</button>}</div>}<ChatLog messages={messages} viewer="owner"/><form className={styles.form} onSubmit={e=>void send(e)}><label>Private reply<textarea aria-label="Owner private reply" value={draft} onChange={e=>setDraft(e.target.value)} required maxLength={1000} rows={2} placeholder="Reply without sharing your phone number…"/></label><button disabled={busy||!draft.trim()}>{busy?'Sending…':'Send reply to finder'}</button></form><button className={styles.delete} disabled={busy} onClick={()=>void remove()}>Delete conversation</button></>:<p className={styles.hint}>No private conversations yet. Finders can send a message from the scanner without sharing GPS or a phone number.</p>}
    {error&&<p role="alert" className={styles.error}>{error}</p>}
  </section>;
}
