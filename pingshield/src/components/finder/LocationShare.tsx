'use client';

import React, { useState, useCallback } from 'react';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { t, type Language } from '@/lib/i18n';

interface LocationShareProps {
  token: string;
  sessionId: string;
  lang: Language;
}

type LocationState =
  | 'idle'
  | 'requesting'
  | 'sharing'
  | 'shared'
  | 'denied'
  | 'error'
  | 'manual-input'
  | 'manual-shared';

export default function LocationShare({ token, sessionId, lang }: LocationShareProps) {
  const [state, setState] = useState<LocationState>('idle');
  const [manualText, setManualText] = useState('');
  const [submittingManual, setSubmittingManual] = useState(false);

  const handleShare = useCallback(async () => {
    setState('requesting');

    if (!navigator.geolocation) {
      setState('error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setState('sharing');
        try {
          const res = await fetch(`/api/scan/${token}/location`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId,
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              source: 'browser',
            }),
          });
          if (res.ok) {
            setState('shared');
          } else {
            setState('error');
          }
        } catch {
          setState('error');
        }
      },
      () => {
        setState('denied');
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }, [token, sessionId]);

  const handleDecline = useCallback(() => {
    setState('denied');
  }, []);

  const handleManualSubmit = useCallback(async () => {
    if (!manualText.trim()) return;
    setSubmittingManual(true);
    try {
      const res = await fetch(`/api/scan/${token}/location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
              sessionId,
          
          source: 'manually provided',
          landmark: manualText.trim(),
        }),
      });
      if (res.ok) {
        setState('manual-shared');
      }
    } catch {
      setState('error');
    } finally {
      setSubmittingManual(false);
    }
  }, [token, sessionId, manualText]);

  return (
    <Card>
      <h3 className="mb-1 text-lg font-semibold text-slate-900">
        📍 {t('finder.locationShare.title', lang)}
      </h3>

      {/* Idle — ask question */}
      {state === 'idle' && (
        <>
          <p className="mb-3 text-sm text-slate-600">
            {t('finder.locationShare.question', lang)}
          </p>
          <p className="mb-4 text-xs text-slate-500">
            {t('finder.locationShare.explanation', lang)}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="primary" onClick={handleShare} fullWidth>
              {t('finder.locationShare.yes', lang)}
            </Button>
            <Button variant="secondary" onClick={handleDecline} fullWidth>
              {t('finder.locationShare.no', lang)}
            </Button>
          </div>
        </>
      )}

      {/* Requesting / sharing */}
      {(state === 'requesting' || state === 'sharing') && (
        <div className="flex items-center gap-3 py-4">
          <svg className="h-5 w-5 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm text-slate-600">{t('common.loading', lang)}</span>
        </div>
      )}

      {/* Success */}
      {state === 'shared' && (
        <Alert variant="success">{t('finder.locationShare.success', lang)}</Alert>
      )}

      {/* Manual shared */}
      {state === 'manual-shared' && (
        <Alert variant="success">{t('finder.locationShare.success', lang)}</Alert>
      )}

      {/* Denied / error — show message + manual fallback */}
      {(state === 'denied' || state === 'error') && (
        <>
          <Alert variant="info" className="mb-3">
            {t('finder.locationShare.denied', lang)}
          </Alert>

          <p className="mb-2 text-sm font-medium text-slate-700">
            {t('finder.locationShare.manual', lang)}
          </p>
          <div className="flex gap-2">
            <Input
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder={t('finder.locationShare.manualLabel', lang)}
              className="flex-1"
            />
            <Button
              variant="secondary"
              onClick={handleManualSubmit}
              loading={submittingManual}
              disabled={!manualText.trim()}
            >
              {t('finder.contact.send', lang)}
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
