'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import { t, type Language } from '@/lib/i18n';

interface EmergencySectionProps {
  token: string;
  sessionId: string;
  lang: Language;
}

type OwnerCallState = 'idle' | 'phone-input' | 'calling' | 'initiated' | 'error';

export default function EmergencySection({ token, sessionId, lang }: EmergencySectionProps) {
  const [ownerCallState, setOwnerCallState] = useState<OwnerCallState>('idle');
  const [finderPhone, setFinderPhone] = useState('');
  const [callError, setCallError] = useState('');

  // Incident / family unlock state
  const [ownerAttempts, setOwnerAttempts] = useState(0);
  const [familyUnlocked, setFamilyUnlocked] = useState(false);
  const [familyCalling, setFamilyCalling] = useState(false);
  const [familyCallResult, setFamilyCallResult] = useState<'idle' | 'initiated' | 'error'>('idle');
  const requiredAttempts = 2;

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isDev = process.env.NODE_ENV === 'development';

  // Poll incident state
  const pollIncident = useCallback(async () => {
    try {
      const res = await fetch(`/api/scan/${token}/incident?sessionId=${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setOwnerAttempts(data.ownerCallAttempts ?? 0);
        setFamilyUnlocked(data.familyContactUnlocked ?? false);
      }
    } catch {
      /* silent */
    }
  }, [token, sessionId]);

  useEffect(() => {
    pollIncident();
    pollRef.current = setInterval(pollIncident, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [pollIncident]);

  // Owner call in emergency context
  const handleOwnerCallClick = useCallback(() => {
    setOwnerCallState('phone-input');
  }, []);

  const handleOwnerCallSubmit = useCallback(async () => {
    if (!finderPhone.trim()) return;
    setOwnerCallState('calling');
    setCallError('');
    try {
      const res = await fetch(`/api/scan/${token}/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, callType: 'owner', finderPhone: finderPhone.trim() }),
      });
      if (res.ok) {
        setOwnerCallState('initiated');
        // Re-poll to update attempt count
        setTimeout(pollIncident, 1500);
      } else {
        const data = await res.json().catch(() => ({}));
        setCallError(data.error || 'Call failed');
        setOwnerCallState('error');
      }
    } catch {
      setCallError('Network error');
      setOwnerCallState('error');
    }
  }, [token, sessionId, finderPhone, pollIncident]);

  // Family call
  const handleFamilyCall = useCallback(async () => {
    setFamilyCalling(true);
    try {
      const res = await fetch(`/api/scan/${token}/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, callType: 'family', finderPhone: finderPhone.trim() || undefined }),
      });
      if (res.ok) {
        setFamilyCallResult('initiated');
      } else {
        setFamilyCallResult('error');
      }
    } catch {
      setFamilyCallResult('error');
    } finally {
      setFamilyCalling(false);
    }
  }, [token, sessionId, finderPhone]);

  return (
    <Card className="border-red-200 bg-red-50/30">
      <h3 className="mb-1 text-lg font-semibold text-red-800">
        🚨 {t('finder.emergency.title', lang)}
      </h3>
      <p className="mb-4 text-sm text-red-600/80">{t('finder.emergency.subtitle', lang)}</p>

      {/* ── Try calling owner ── */}
      <div className="mb-4 space-y-2">
        {ownerCallState === 'idle' && (
          <Button variant="danger" onClick={handleOwnerCallClick} fullWidth>
            {t('finder.emergency.callOwner', lang)}
          </Button>
        )}

        {ownerCallState === 'phone-input' && (
          <div className="space-y-3">
            <Input
              label={t('auth.phone', lang)}
              value={finderPhone}
              onChange={(e) => setFinderPhone(e.target.value)}
              placeholder={t('finder.contact.phonePlaceholder', lang)}
              type="tel"
              helperText={t('finder.contact.phoneExplain', lang)}
            />
            <div className="flex gap-2">
              <Button variant="danger" onClick={handleOwnerCallSubmit} disabled={!finderPhone.trim()} fullWidth>
                {t('finder.emergency.callOwner', lang)}
              </Button>
              <Button variant="ghost" onClick={() => setOwnerCallState('idle')}>
                {t('common.cancel', lang)}
              </Button>
            </div>
          </div>
        )}

        {ownerCallState === 'calling' && (
          <Button variant="danger" loading fullWidth>
            {t('common.loading', lang)}
          </Button>
        )}

        {ownerCallState === 'initiated' && (
          <div className="space-y-2">
            <Alert variant="success">
              {t('finder.emergency.callOwner', lang)} — {t('common.success', lang)}
            </Alert>
            <Button variant="danger" onClick={() => setOwnerCallState('phone-input')} fullWidth>
              {t('common.retry', lang)}
            </Button>
          </div>
        )}

        {ownerCallState === 'error' && (
          <div className="space-y-2">
            <Alert variant="error">{callError}</Alert>
            <Button variant="danger" onClick={() => setOwnerCallState('phone-input')} fullWidth>
              {t('common.retry', lang)}
            </Button>
          </div>
        )}
      </div>

      {/* ── Family contact ── */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">
            {t('finder.emergency.callFamily', lang)}
          </span>
          {familyUnlocked ? (
            <Badge variant="success">{t('finder.emergency.familyUnlocked', lang)}</Badge>
          ) : (
            <Badge variant="warning">
              {t('finder.emergency.familyLocked', lang, { count: String(requiredAttempts - ownerAttempts) })}
            </Badge>
          )}
        </div>

        {!familyUnlocked && (
          <p className="text-xs text-slate-500">
            {t('finder.emergency.attemptCount', lang, {
              count: String(ownerAttempts),
              required: String(requiredAttempts),
            })}
          </p>
        )}

        {familyUnlocked && familyCallResult === 'idle' && (
          <Button variant="emergency" onClick={handleFamilyCall} loading={familyCalling} fullWidth>
            {t('finder.emergency.callFamily', lang)}
          </Button>
        )}

        {familyCallResult === 'initiated' && (
          <Alert variant="success">
            {t('finder.emergency.callFamily', lang)} — {t('common.success', lang)}
          </Alert>
        )}

        {familyCallResult === 'error' && (
          <div className="space-y-2">
            <Alert variant="error">{t('common.error', lang)}</Alert>
            <Button variant="emergency" onClick={() => setFamilyCallResult('idle')} fullWidth>
              {t('common.retry', lang)}
            </Button>
          </div>
        )}
      </div>

      {/* ── Public emergency calls ── */}
      <div className="space-y-2 border-t border-red-200 pt-4">
        {isDev && <Alert variant="warning">{t('emergency.devWarning', lang)}</Alert>}

        <a
          href={isDev ? '#' : 'tel:112'}
          onClick={isDev ? (e) => { e.preventDefault(); alert('DEV: Would dial 112'); } : undefined}
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-3 text-base font-bold text-white transition-colors hover:bg-red-700 active:bg-red-800"
        >
          🆘 {t('finder.emergency.112', lang)}
        </a>
        <a
          href={isDev ? '#' : 'tel:1033'}
          onClick={isDev ? (e) => { e.preventDefault(); alert('DEV: Would dial 1033'); } : undefined}
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg border border-red-300 bg-white px-5 py-3 text-base font-medium text-red-700 transition-colors hover:bg-red-50 active:bg-red-100"
        >
          🛣️ {t('finder.emergency.1033', lang)}
        </a>

        <p className="text-xs text-slate-500">{t('finder.emergency.publicCallNote', lang)}</p>
      </div>
    </Card>
  );
}
