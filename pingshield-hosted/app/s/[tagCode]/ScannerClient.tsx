'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, MapPin, Navigation, MessageCircle, Phone, Info, LockKeyhole, Smartphone, TriangleAlert, Check, ArrowUpRight, Radio, X } from 'lucide-react';
import type { TagPublicInfo, LocationFix } from '@/lib/recovery-types';
import LocationPreview from '@/components/location/LocationPreview';
import { useLiveReport } from '@/components/location/useLiveReport';
import styles from './scanner.module.css';
import FinderContact from '@/components/contact/FinderContact';

type Saved = { reportId: string; timestamp: string; expiresAt: string | null };
export default function ScannerClient({ tag }: { tag: TagPublicInfo }) {
  const [gps, setGps] = useState<LocationFix | null>(null);
  const [locating, setLocating] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [locationOpen, setLocationOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [live, setLive] = useState(false);
  const [message, setMessage] = useState('');
  const [manual, setManual] = useState('');
  const [contact, setContact] = useState('');
  const [disposition, setDisposition] = useState('Found here with me');
  const [website, setWebsite] = useState('');
  const [sheet, setSheet] = useState<'message' | 'call' | 'info' | 'emergency' | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState<Saved | null>(null);
  const tracker = useLiveReport(setGps);
  const gpsRequest = useRef(0);
  function openSheet(value: typeof sheet) { setSheet(value); dialog.current?.showModal(); }
  function closeSheet() { dialog.current?.close(); setSheet(null); }
  function locate() {
    setLocationOpen(true); setDismissed(false); setGpsError('');
    if (!window.isSecureContext) { setGpsError('GPS needs HTTPS or localhost. You can enter a pickup landmark instead.'); return; }
    if (!navigator.geolocation) { setGpsError('This browser has no GPS support. Enter a pickup landmark instead.'); return; }
    setLocating(true);
    const request = ++gpsRequest.current;
    navigator.geolocation.getCurrentPosition(pos => {
      if (request !== gpsRequest.current) return;
      setLocating(false); setGps({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy });
    }, err => {
      if (request !== gpsRequest.current) return;
      setLocating(false);
      setGpsError(err.code === 1 ? 'Location permission denied. Allow location in browser settings, or enter a pickup landmark.' : err.code === 3 ? 'GPS timed out. Try again or enter a pickup landmark.' : 'Location is unavailable. Try again or enter a pickup landmark.');
    }, { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 });
  }
  function removeGPS() { gpsRequest.current++; setLocating(false); setGps(null); setLive(false); }
  async function submit(e: React.FormEvent, messageOnly = false) {
    e.preventDefault(); setError('');
    if (tracker.active) { setError('Stop the current live sharing session before sending another recovery report.'); return; }
    if (!gps && !manual.trim()) { setError('Share a GPS pin or enter a pickup landmark before sending.'); setLocationOpen(true); return; }
    if (messageOnly && message.trim().length < 3) { setError('Please enter a short message.'); return; }
    setBusy(true);
    try {
      const text = message.trim() || `${disposition}. Please check the shared pickup location.`;
      const res = await fetch('/api/reports', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagCode: tag.tag_code, message: `${disposition}: ${text}`.slice(0, 1000), finderContact: contact.trim() || null,
          latitude: gps?.latitude ?? null, longitude: gps?.longitude ?? null, accuracy: gps?.accuracy ?? null, manualLocation: manual.trim() || null, live: live && !!gps, website }), signal: AbortSignal.timeout(20000) });
      const data = await res.json() as Saved & { error?: string; liveToken?: string };
      if (!res.ok) throw new Error(data.error || 'Could not save your report.');
      setSaved(data); closeSheet();
      if (data.liveToken && data.expiresAt && gps) tracker.start({ reportId: data.reportId, liveToken: data.liveToken, expiresAt: data.expiresAt }, gps);
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not send. Please retry.'); }
    finally { setBusy(false); }
  }
  const initials = tag.owner_alias.split(' ').map(n => n[0]).join('').slice(0, 2);
  const fields = <>
    <label>Pickup landmark <span>(required if GPS is off)</span><input value={manual} onChange={e => setManual(e.target.value)} maxLength={300} placeholder="e.g. Metro station, security desk" /></label>
    <label>Message to the owner <span>(optional)</span><textarea value={message} onChange={e => setMessage(e.target.value)} maxLength={900} rows={3} placeholder="Tell the owner where their item is safe…" /></label>
    <label>Your contact <span>(optional, shared with owner)</span><input value={contact} onChange={e => setContact(e.target.value)} maxLength={120} placeholder="Phone or email, if you want a reply" /></label>
    <div className={styles.trap} aria-hidden="true"><label>Website<input value={website} onChange={e => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" /></label></div>
  </>;
  return <main className={styles.page}><div className={styles.shell}>
    <div className={styles.accent} />
    <header className={styles.header}><Link href="/demo" className={styles.brand}><span className={styles.brandIcon}><ShieldCheck size={23} /></span><span><strong>Ping<span>Shield</span></strong><small>QR Contact Beacon</small></span></Link><button className={styles.iconButton} aria-label="Privacy and safety information" onClick={() => openSheet('info')}><Info size={19} /></button></header>
    <div className={styles.content}>
      <section className={styles.profile}><div className={styles.profileRow}><div className={styles.avatar}>{initials}<span><Check size={12} /></span></div><div><p className={styles.eyebrow}>PROTECTED ITEM · DEMO</p><h1>{tag.owner_alias}</h1><p className={styles.itemName}>{tag.item_name}</p><div className={styles.tagLine}><span><LockKeyhole size={11} /> Phone private</span><code>{tag.tag_code}</code></div></div></div><div className={styles.profileFoot}><i /> Active tag · Ready for your recovery report</div></section>
      <div className={styles.actions}><button onClick={() => openSheet('call')}><span className={styles.pinkIcon}><Phone size={22} /></span><strong>Call Owner</strong><small>Connection options</small></button><button onClick={() => { setError(''); openSheet('message'); }}><span className={styles.blueIcon}><MessageCircle size={22} /></span><strong>Send Message</strong><small>A private note to owner</small></button></div>
      {saved ? <section className={styles.card} aria-live="polite"><div className={styles.sectionHeading}><span className={styles.greenIcon}><Check size={21} /></span><div><h2>Location report saved</h2><p>Available in the owner’s protected inbox.</p></div></div>
        {gps && <div className={styles.map}><LocationPreview {...gps} label="Finder’s shared location" /></div>}
        <dl className={styles.receipt}><div><dt>Report</dt><dd>{saved.reportId.slice(0, 8)}</dd></div><div><dt>Saved</dt><dd>{new Date(tracker.savedAt || saved.timestamp).toLocaleTimeString()}</dd></div></dl>
        {tracker.active ? <><p className={styles.liveStatus}><Radio size={14} /> Live sharing on · syncs every 5 seconds</p><p className={styles.hint}>Keep this page open. Ends after 30 minutes. The owner sees your last received GPS pin.</p><button className={styles.stopButton} onClick={() => void tracker.stop()}>Stop live sharing</button></> : <p className={styles.hint}>Sharing is off. The owner retains the saved pickup location.</p>}
        {tracker.error && <p role="alert" className={styles.error}>{tracker.error}</p>}
        {!tracker.active && <button className={styles.secondary} onClick={() => { setSaved(null); removeGPS(); setMessage(''); setManual(''); }}>Send another update</button>}
      </section> : <section className={styles.card}>
        <div className={styles.sectionHeading}><span className={styles.purpleIcon}><MapPin size={22} /></span><div><h2>Help Locate This Item</h2><p>Share a pin to help bring it home.</p></div></div>
        {!locationOpen ? <>{dismissed ? <div className={styles.notice}>Location is optional. <button className={styles.textButton} onClick={() => setLocationOpen(true)}>Add a pickup location</button></div> : <><p className={styles.notice}><ShieldCheck size={20} /><span>Only shared with the owner, with your consent. Preview your location before sending.</span></p><div className={styles.buttonRow}><button className={styles.primary} onClick={locate}><Navigation size={16} /> Yes, Share Location</button><button className={styles.secondary} onClick={() => setDismissed(true)}>Not Now</button></div><button className={styles.textButton} onClick={() => setLocationOpen(true)}>Enter a landmark instead</button></>}</> : <form onSubmit={e => void submit(e)} className={styles.form}>
          {gps ? <><div className={styles.map}><LocationPreview {...gps} label="Your GPS preview · not sent yet" /></div><div className={styles.coords}><span>{gps.latitude.toFixed(6)}, {gps.longitude.toFixed(6)}<small>Accuracy ±{Math.round(gps.accuracy ?? 0)} m · Preview only</small></span><button type="button" onClick={removeGPS}>Remove</button></div></> : <button type="button" className={styles.secondary} disabled={locating} onClick={locate}><Navigation size={16} /> {locating ? 'Finding your GPS position…' : 'Use my current GPS location'}</button>}
          {gpsError && <p role="alert" className={styles.error}>{gpsError}</p>}
          <fieldset><legend>Where is the item?</legend><div className={styles.buttonRow}>{['Found here with me', 'Left at a safe spot'].map(value => <button type="button" key={value} aria-pressed={disposition === value} className={disposition === value ? styles.selected : styles.secondary} onClick={() => { setDisposition(value); if (value === 'Left at a safe spot') setLive(false); }}>{value}</button>)}</div></fieldset>
          {fields}
          {gps && disposition === 'Found here with me' && <label className={styles.checkbox}><input type="checkbox" checked={live} onChange={e => setLive(e.target.checked)} /><span>Share live location for up to 30 minutes<small>Updates while this page is open. Stop at any time.</small></span></label>}
          {error && <p role="alert" className={styles.error}>{error}</p>}
          <button className={styles.primary} disabled={busy || locating}>{busy ? 'Saving your report…' : live ? 'Confirm & Start Live Sharing' : 'Confirm & Share Location'}</button>
          <button type="button" className={styles.textButton} disabled={busy} onClick={() => { removeGPS(); setLocationOpen(false); setGpsError(''); }}>Cancel</button>
        </form>}
      </section>}
      <button className={styles.emergency} onClick={() => openSheet('emergency')}><span><TriangleAlert size={23} /></span><div><strong>Emergency Situation?</strong><small>Official safety & roadside helplines</small></div><ArrowUpRight size={20} /></button>
      <footer className={styles.footer}><div className={styles.trust}><div><ShieldCheck /><strong>Phone Protected</strong><span>No public number</span></div><div><LockKeyhole /><strong>Opt-in Location</strong><span>You’re in control</span></div><div><Smartphone /><strong>No App Needed</strong><span>Use your browser</span></div></div><p>Protected by <strong>PingShield</strong> · <Link href="/owner">Owner inbox ↗</Link></p></footer>
    </div>
    <dialog ref={dialog} className={styles.dialog} onCancel={() => setSheet(null)} onClick={e => { if (e.target === dialog.current) closeSheet(); }}>
      <div className={styles.dialogHead}><h2>{sheet === 'message' ? 'Message Owner' : sheet === 'call' ? 'Call Owner' : sheet === 'emergency' ? 'Emergency Assistance' : 'Your privacy comes first'}</h2><button className={styles.iconButton} onClick={closeSheet} aria-label="Close dialog"><X size={18} /></button></div>
      {(sheet === 'message' || sheet === 'call') && <FinderContact key={sheet} mode={sheet} tagCode={tag.tag_code} />}
      {sheet === 'info' && <div className={styles.dialogBody}><p><strong>You choose what to share.</strong> GPS starts only after you tap the location button. Nothing is sent until you confirm.</p><p>Live sharing sends your browser’s GPS position every 5 seconds while this page is open, for up to 30 minutes. It can stop updating if your browser suspends the page.</p><p>Only the signed-in demo owner can view reports. The owner keeps the last saved pin after sharing stops. OpenStreetMap receives map tile requests when a map is displayed.</p></div>}
      {sheet === 'emergency' && <div className={styles.dialogBody}><p>If you need urgent help, contact the appropriate service using your device’s dialer.</p><a className={styles.emergencyLink} href="tel:112"><strong>112 · Emergency services</strong><Phone size={18} /></a><a className={styles.emergencyLink} href="tel:1033"><strong>1033 · Highway assistance</strong><Phone size={18} /></a><p className={styles.hint}>Calls use your phone’s native dialer.</p></div>}
    </dialog>
  </div></main>;
}
