'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { LocationFix } from '@/lib/recovery-types';
type Session = { reportId: string; liveToken: string; expiresAt: string };
export function useLiveReport(onFix: (fix: LocationFix) => void) {
  const session = useRef<Session | null>(null);
  const watch = useRef<number | null>(null);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);
  const latest = useRef<LocationFix | null>(null);
  const capturedAt = useRef(0);
  const onFixRef = useRef(onFix);
  onFixRef.current = onFix;
  const [active, setActive] = useState(false);
  const [error, setError] = useState('');
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const halt = useCallback(() => {
    if (watch.current !== null) navigator.geolocation.clearWatch(watch.current);
    if (interval.current !== null) clearInterval(interval.current);
    watch.current = null; interval.current = null;
  }, []);
  const stop = useCallback(async () => {
    halt(); setActive(false);
    const current = session.current;
    session.current = null;
    if (!current) return;
    try {
      const res = await fetch(`/api/reports/${current.reportId}/location`, { method: 'DELETE', headers: { Authorization: `Bearer ${current.liveToken}` }, keepalive: true });
      if (!res.ok) throw new Error();
    } catch { setError('GPS sharing has stopped on this device. The server could not confirm the stop; the session will expire automatically.'); }
  }, [halt]);
  const start = useCallback((value: Session, first: LocationFix) => {
    halt(); session.current = value; latest.current = first; capturedAt.current = Date.now();
    setActive(true); setError(''); setSavedAt(new Date().toISOString());
    watch.current = navigator.geolocation.watchPosition(pos => {
      if (!session.current) return;
      const fix = { latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy };
      latest.current = fix; capturedAt.current = Date.now(); onFixRef.current(fix);
    }, err => {
      setError(err.code === 1 ? 'Location permission was removed. Sharing has stopped.' : 'Waiting for GPS. The owner sees the last saved position.');
      if (err.code === 1) void stop();
    }, { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 });
    let sending = false;
    interval.current = setInterval(async () => {
      if (Date.now() >= Date.parse(value.expiresAt)) { void stop(); return; }
      if (sending || session.current !== value || !latest.current) return;
      if (Date.now() - capturedAt.current > 30000) { setError('Waiting for a fresh GPS fix. The owner sees your last saved position.'); return; }
      sending = true;
      try {
        const res = await fetch(`/api/reports/${value.reportId}/location`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${value.liveToken}` }, body: JSON.stringify(latest.current), signal: AbortSignal.timeout(10000),
        });
        if (session.current !== value) return;
        if (res.status === 401 || res.status === 410) { halt(); session.current = null; setActive(false); setError('Live sharing session ended. The last saved pin is still available to the owner.'); return; }
        if (!res.ok) throw new Error();
        setError(''); setSavedAt(new Date().toISOString());
      } catch { if (session.current === value) setError('Location could not sync. Retrying automatically; the owner sees the last saved pin.'); }
      finally { sending = false; }
    }, 5000);
  }, [halt, stop]);
  useEffect(() => {
    const leave = () => { void stop(); };
    window.addEventListener('pagehide', leave);
    return () => { window.removeEventListener('pagehide', leave); void stop(); };
  }, [stop]);
  return { active, start, stop, error, savedAt };
}
