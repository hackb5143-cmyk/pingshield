'use client';
import { useEffect,useRef } from 'react';
import type { ContactMessage } from '@/lib/contact-types';
import styles from './contact.module.css';
import { emailStatusText } from '@/lib/email-status';
export default function ChatLog({messages,viewer}:{messages:ContactMessage[];viewer:'finder'|'owner'}) {
  const end=useRef<HTMLDivElement>(null);
  useEffect(()=>{end.current?.scrollIntoView({block:'nearest'});},[messages.length]);
  return <div className={styles.log} role="log" aria-label="Private conversation" aria-live="polite" aria-relevant="additions">{messages.map(message=><div key={message.id} className={message.sender===viewer?styles.mine:styles.theirs}><strong>{message.sender===viewer?'You':message.sender==='owner'?'Owner':'Finder'}</strong><p>{message.content}</p><time dateTime={message.created_at}>{new Date(message.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</time>{message.sender==='finder'&&emailStatusText(message.email_status)&&<small className={styles.emailState}>{emailStatusText(message.email_status)}</small>}</div>)}<div ref={end}/></div>;
}
