'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { RecoveryReport } from '@/lib/supabase';
import LocationPreview from '@/components/location/LocationPreview';
import OwnerContacts from '@/components/contact/OwnerContacts';

export default function OwnerClient({ initialReports, authorized, loadError }: {
  initialReports: RecoveryReport[] | null; authorized: boolean; loadError: boolean;
}) {
  const [signedIn, setSignedIn] = useState(authorized);
  const [reports, setReports] = useState(initialReports ?? []);
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(loadError ? 'Could not load reports. Please refresh.' : '');
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState('');
  const [now, setNow] = useState(0);
  const refreshing = useRef(false);
  const generation = useRef(0);

  const refresh = useCallback(async () => {
    if (refreshing.current) return;
    refreshing.current = true;
    const current = generation.current;
    try {
      const res = await fetch('/api/reports', { cache: 'no-store', signal: AbortSignal.timeout(10000) });
      const data = await res.json() as { reports: RecoveryReport[]; error?: string };
      if (current !== generation.current) return;
      if (res.status === 401) { setSignedIn(false); setReports([]); }
      if (!res.ok) throw new Error(data.error || 'Could not load reports');
      setReports(data.reports); setError(''); setNow(Date.now());
    } finally { refreshing.current = false; }
  }, []);
  useEffect(() => {
    if (!signedIn) return;
    const poll = () => { if (!document.hidden) void refresh().catch(() => setError('Connection lost. Showing the last received locations; retrying automatically.')); };
    const timer = setInterval(() => { setNow(Date.now()); poll(); }, 5000);
    window.addEventListener('focus', poll);
    return () => { clearInterval(timer); window.removeEventListener('focus', poll); };
  }, [signedIn, refresh]);
  async function login(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const res = await fetch('/api/owner-session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ passcode }) });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Sign in failed');
      await refresh(); setSignedIn(true); setPasscode('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Sign in failed'); }
    finally { setBusy(false); }
  }
  async function logout() { generation.current++; await fetch('/api/owner-session', { method: 'DELETE' }); setSignedIn(false); setReports([]); }
  const located = reports.filter(r => r.latitude != null && r.longitude != null);
  const pin = located.find(r => r.id === selected) || located[0];
  const liveStatus = (r: RecoveryReport) => {
    if (r.sharing_stopped_at) return 'Sharing stopped · saved pin';
    if (!r.live_expires_at) return 'One-time location';
    if ((now || Date.now()) >= Date.parse(r.live_expires_at)) return 'Sharing expired · saved pin';
    return (now || Date.now()) - Date.parse(r.updated_at) < 20000 ? 'Live · receiving updates' : 'Waiting for finder · last received pin';
  };

  return <main className="min-h-screen bg-[#0b101b] text-white px-4 py-8 sm:py-12">
    <div className="max-w-4xl mx-auto">
      <header className="flex items-center justify-between gap-3 mb-8">
        <Link href="/demo" className="font-black tracking-tight text-xl">Ping<span className="text-pink-400">Shield</span></Link>
        {signedIn && <button onClick={logout} className="text-sm text-slate-300 hover:text-white">Sign out</button>}
      </header>
      {!signedIn ? <section className="mx-auto max-w-md rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8 shadow-2xl">
        <p className="text-pink-300 text-xs font-bold uppercase tracking-widest mb-2">Owner access</p>
        <h1 className="text-3xl font-bold mb-2">Your recovery inbox</h1>
        <p className="text-slate-400 text-sm mb-6">Enter the demo owner passcode to view reports for DEMO001.</p>
        <form onSubmit={login} className="space-y-4">
          <label className="block text-sm font-medium">Passcode<input type="password" autoComplete="current-password" required value={passcode} onChange={e => setPasscode(e.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-slate-950 p-3 outline-none focus:border-pink-400" /></label>
          {error && <p role="alert" className="text-rose-300 text-sm">{error}</p>}
          <button disabled={busy} className="w-full rounded-xl bg-pink-500 hover:bg-pink-400 p-3 font-bold text-slate-950 disabled:opacity-50">{busy ? 'Opening…' : 'Open owner inbox'}</button>
        </form>
      </section> : <>
        <div className="flex flex-wrap items-end justify-between gap-4 mb-7"><div><p className="text-pink-300 text-xs font-bold uppercase tracking-widest mb-2">DEMO001 · Alex R.</p><h1 className="text-3xl sm:text-4xl font-bold">Recovery reports</h1><p className="text-slate-400 mt-2">Owner-only locations · refreshes every 5 seconds while visible.</p></div><button onClick={() => { setBusy(true); refresh().catch(e => setError(e.message)).finally(() => setBusy(false)); }} disabled={busy} className="rounded-xl border border-white/20 px-4 py-2 text-sm hover:bg-white/10">Refresh</button></div>
        {error && <p role="alert" className="mb-5 text-rose-300">{error}</p>}
        <OwnerContacts />
        {pin && <section className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3"><h2 className="font-bold">Shared location map</h2><label className="text-xs text-slate-300">Report <select aria-label="Map report" value={pin.id} onChange={e => setSelected(e.target.value)} className="rounded-lg bg-slate-900 border border-white/20 p-2 ml-2">{located.map(r => <option value={r.id} key={r.id}>{r.id.slice(0, 8)} · {new Date(r.created_at).toLocaleTimeString()}</option>)}</select></label></div>
          <div style={{ height: 320, borderRadius: 12, overflow: 'hidden' }}><LocationPreview latitude={pin.latitude!} longitude={pin.longitude!} accuracy={pin.accuracy} label="Finder’s last saved location" /></div>
          <div className="flex flex-wrap justify-between gap-2 mt-3 text-xs text-slate-300"><span>{liveStatus(pin)}</span><span>Last received: {new Date(pin.updated_at || pin.created_at).toLocaleString()}</span></div>
          <p className="mt-2 text-xs text-slate-400">This pin is supplied by the finder’s device. Browser suspension or poor GPS can delay updates.</p>
        </section>}
        {reports.length === 0 ? <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-slate-300">No reports yet. Scan <Link href="/s/DEMO001" className="text-pink-300 underline">DEMO001</Link> to send one.</div> : <div className="grid gap-4">{reports.map(report => <article key={report.id} className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6 shadow-xl">
          <div className="flex flex-wrap justify-between gap-2 mb-4"><span className="text-pink-300 font-mono text-sm">{report.tag_code} · {report.id.slice(0, 8)}</span><time dateTime={report.created_at} className="text-slate-400 text-sm">{new Date(report.created_at).toLocaleString()}</time></div>
          <p className="text-lg leading-relaxed whitespace-pre-wrap break-words">{report.message}</p>
          {report.finder_contact && <p className="text-sm text-slate-300 mt-4 break-all">Finder contact: {report.finder_contact}</p>}
          <div className="mt-5 border-t border-white/10 pt-4 text-sm text-slate-300">
            {report.manual_location && <p className="mb-3">Pickup location: <strong className="text-white">{report.manual_location}</strong></p>}
            {report.latitude != null && report.longitude != null && <div><p>Shared GPS: <span className="font-mono text-white">{report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}</span>{report.accuracy != null && ` · ±${Math.round(report.accuracy)} m`}</p><a className="mt-3 inline-block rounded-lg bg-pink-500 px-4 py-2 font-bold text-slate-950 hover:bg-pink-400" target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps/dir/?api=1&destination=${report.latitude},${report.longitude}`}>Open directions in map ↗</a></div>}
          </div>
        </article>)}</div>}
      </>}
    </div>
  </main>;
}
