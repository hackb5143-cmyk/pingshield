'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';
import { t, type Language } from '@/lib/i18n';

interface ContactOwnerProps {
  token: string;
  sessionId: string;
  lang: Language;
}

type CallState = 'idle' | 'phone-input' | 'calling' | 'initiated' | 'error';
type MessageState = 'idle' | 'sending' | 'sent' | 'error';

export default function ContactOwner({ token, sessionId, lang }: ContactOwnerProps) {
  const [messages, setMessages] = useState<{ id: string; content: string; sender_type: string; status: string }[]>([]);
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const res = await fetch(`/api/scan/${token}/message`);
        if (res.ok && active) setMessages((await res.json()).messages);
      } catch { /* Retry on the next poll without clearing existing messages. */ }
    };
    refresh(); const interval = setInterval(refresh, 5000);
    return () => { active = false; clearInterval(interval); };
  }, [token]);
  // Call state
  const [callState, setCallState] = useState<CallState>('idle');
  const [finderPhone, setFinderPhone] = useState('');
  const [callError, setCallError] = useState('');

  // Message state
  const [messageContent, setMessageContent] = useState('');
  const [messageState, setMessageState] = useState<MessageState>('idle');
  const [messageError, setMessageError] = useState('');

  const handleCallClick = useCallback(() => {
    setCallState('phone-input');
  }, []);

  const handleCallSubmit = useCallback(async () => {
    if (!finderPhone.trim()) return;
    setCallState('calling');
    setCallError('');
    try {
      const res = await fetch(`/api/scan/${token}/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, callType: 'owner', finderPhone: finderPhone.trim() }),
      });
      if (res.ok) {
        setCallState('initiated');
      } else {
        const data = await res.json().catch(() => ({}));
        setCallError(data.error || 'Call failed');
        setCallState('error');
      }
    } catch {
      setCallError('Network error');
      setCallState('error');
    }
  }, [token, sessionId, finderPhone]);

  const handleMessageSend = useCallback(async () => {
    if (!messageContent.trim()) return;
    setMessageState('sending');
    setMessageError('');
    try {
      const res = await fetch(`/api/scan/${token}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: messageContent.trim(), sessionId }),
      });
      if (res.ok) {
        setMessageState('sent');
        setMessageContent('');
      } else {
        const data = await res.json().catch(() => ({}));
        setMessageError(data.error || 'Failed to send');
        setMessageState('error');
      }
    } catch {
      setMessageError('Network error');
      setMessageState('error');
    }
  }, [token, sessionId, messageContent]);

  return (
    <Card>
      <h3 className="mb-1 text-lg font-semibold text-slate-900">
        📞 {t('finder.contact.title', lang)}
      </h3>
      <p className="mb-4 text-sm text-slate-500">{t('finder.contact.callDesc', lang)}</p>

      {/* ── Call Owner ── */}
      <div className="mb-5">
        {callState === 'idle' && (
          <Button variant="primary" onClick={handleCallClick} fullWidth icon={<span>📱</span>}>
            {t('finder.contact.call', lang)}
          </Button>
        )}

        {callState === 'phone-input' && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">{t('finder.contact.phoneRequired', lang)}</p>
            <Input
              label={t('auth.phone', lang)}
              value={finderPhone}
              onChange={(e) => setFinderPhone(e.target.value)}
              placeholder={t('finder.contact.phonePlaceholder', lang)}
              type="tel"
              helperText={t('finder.contact.phoneExplain', lang)}
            />
            <div className="flex gap-2">
              <Button variant="primary" onClick={handleCallSubmit} disabled={!finderPhone.trim()} fullWidth>
                {t('finder.contact.call', lang)}
              </Button>
              <Button variant="ghost" onClick={() => setCallState('idle')}>
                {t('common.cancel', lang)}
              </Button>
            </div>
          </div>
        )}

        {callState === 'calling' && (
          <Button variant="primary" loading fullWidth>
            {t('common.loading', lang)}
          </Button>
        )}

        {callState === 'initiated' && (
          <Alert variant="success">
            {t('finder.contact.call', lang)} — {t('common.success', lang)}
          </Alert>
        )}

        {callState === 'error' && (
          <div className="space-y-2">
            <Alert variant="error">{callError}</Alert>
            <Button variant="secondary" onClick={() => setCallState('phone-input')} fullWidth>
              {t('common.retry', lang)}
            </Button>
          </div>
        )}
      </div>

      <div aria-live="polite" className="space-y-2 mb-4">
        {messages.map(message => <div key={message.id} className="rounded-lg bg-slate-50 p-3"><strong>{message.sender_type === 'owner' ? 'Owner' : 'You'}</strong><p>{message.content}</p><small>{message.status}</small></div>)}
      </div>
      {/* ── Send Message ── */}
      <div>
        <h4 className="mb-1 text-base font-medium text-slate-800">
          💬 {t('finder.contact.message', lang)}
        </h4>
        <p className="mb-3 text-sm text-slate-500">{t('finder.contact.messageDesc', lang)}</p>

        {messageState === 'sent' ? (
          <div><Alert variant="success">{t('common.success', lang)}</Alert><Button onClick={() => setMessageState('idle')}>{lang === 'hi' ? 'नया संदेश' : 'Send another message'}</Button></div>
        ) : (
          <div className="space-y-3">
            <textarea
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              placeholder={t('finder.contact.messagePlaceholder', lang)}
              className="block w-full rounded-lg border border-slate-300 px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              rows={3}
            />
            {messageState === 'error' && <Alert variant="error">{messageError}</Alert>}
            <Button
              variant="primary"
              onClick={handleMessageSend}
              loading={messageState === 'sending'}
              disabled={!messageContent.trim()}
              fullWidth
            >
              {t('finder.contact.send', lang)}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
