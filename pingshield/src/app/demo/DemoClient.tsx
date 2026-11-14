'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import QRCode from 'qrcode';

export default function DemoClient() {
  const [url, setUrl] = useState('');
  const [qr, setQr] = useState('');
  useEffect(() => {
    const scannerUrl = `${window.location.origin}/s/DEMO001`;
    QRCode.toDataURL(scannerUrl, { width: 340, margin: 2, errorCorrectionLevel: 'H' })
      .then(image => { setUrl(scannerUrl); setQr(image); });
  }, []);
  return <main className="min-h-screen bg-[#0b101b] text-white px-4 py-10 flex items-center justify-center">
    <div className="w-full max-w-lg text-center">
      <p className="text-pink-300 text-xs font-bold tracking-widest uppercase mb-2">Scan to recover · Live demo</p>
      <h1 className="text-4xl font-black tracking-tight mb-3">Ping<span className="text-pink-400">Shield</span></h1>
      <p className="text-slate-300 mb-8">Scan this code with a phone camera to report the fictional demo item.</p>
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8 shadow-2xl">
        <p className="font-mono text-pink-300 text-sm mb-1">DEMO001</p>
        <h2 className="text-xl font-bold mb-5">MacBook Pro 16 (Space Black)</h2>
        <div className="inline-block bg-white rounded-2xl p-4 min-h-64 min-w-64">{qr && <Image unoptimized src={qr} alt="QR code to PingShield demo scanner" width={256} height={256} />}</div>
        <p className="font-mono text-xs text-slate-400 break-all mt-5">{url}</p>
        <div className="grid sm:grid-cols-2 gap-3 mt-6"><Link href="/s/DEMO001" className="rounded-xl bg-pink-500 p-3 text-slate-950 font-bold hover:bg-pink-400">Open scanner</Link><Link href="/owner" className="rounded-xl border border-white/20 p-3 font-bold hover:bg-white/10">Owner inbox</Link></div>
      </section>
    </div>
  </main>;
}
