'use client';
import { useState, useEffect } from 'react';

export default function EmergencyPage() {
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [location, setLocation] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [locError, setLocError] = useState('');
  const [locLoading, setLocLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const isDev = process.env.NODE_ENV === 'development';

  function shareLocation() {
    if (!navigator.geolocation) { setLocError('Geolocation not supported'); return; }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
        setLocLoading(false);
      },
      () => { setLocError(lang === 'hi' ? 'स्थान उपलब्ध नहीं' : 'Location not available'); setLocLoading(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function copyCoords() {
    if (location) {
      navigator.clipboard.writeText(`${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-lg mx-auto p-4 pb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-red-600">🆘 {lang === 'hi' ? 'आपातकालीन सहायता' : 'Emergency Assistance'}</h1>
          <button onClick={() => setLang(l => l === 'en' ? 'hi' : 'en')}
            className="text-sm px-3 py-1 bg-slate-100 rounded-full">{lang === 'en' ? 'हिन्दी' : 'English'}</button>
        </div>

        <p className="text-slate-600 mb-6">
          {lang === 'hi' ? 'जल्दी से मदद प्राप्त करें। कोई खाता या टैग स्कैन आवश्यक नहीं।' : 
          'Get help quickly. No account or tag scan needed.'}
        </p>

        {/* Location */}
        <div className="bg-white rounded-xl p-5 border shadow-sm mb-4">
          <h2 className="font-semibold text-slate-900 mb-3">📍 {lang === 'hi' ? 'आपका स्थान' : 'Your Location'}</h2>
          {location ? (
            <div className="space-y-2">
              <p className="text-sm text-slate-600">
                Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
              </p>
              <p className="text-xs text-slate-400">Accuracy: ~{Math.round(location.accuracy)}m</p>
              <button onClick={copyCoords}
                className="px-4 py-2 bg-slate-100 rounded-lg text-sm hover:bg-slate-200 min-h-[44px]">
                {copied ? (lang === 'hi' ? '✓ कॉपी हो गया!' : '✓ Copied!') : (lang === 'hi' ? '📋 निर्देशांक कॉपी करें' : '📋 Copy Coordinates')}
              </button>
            </div>
          ) : (
            <div>
              {locError && <p className="text-sm text-red-600 mb-2">{locError}</p>}
              <button onClick={shareLocation} disabled={locLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 min-h-[44px]">
                {locLoading ? '...' : (lang === 'hi' ? '📍 स्थान साझा करें' : '📍 Share Location')}
              </button>
            </div>
          )}
        </div>

        {/* Emergency calls */}
        <div className="space-y-3 mb-6">
          <a href={isDev ? '#' : 'tel:112'} onClick={isDev ? (e) => { e.preventDefault(); alert('DEV MODE: Would dial 112'); } : undefined}
            className="block bg-red-600 text-white rounded-xl p-5 shadow-sm hover:bg-red-700 active:bg-red-800">
            <div className="flex items-center gap-3">
              <span className="text-3xl">📞</span>
              <div>
                <p className="font-bold text-lg">{lang === 'hi' ? '112 — आपातकालीन सेवाएं' : 'Call 112 — Emergency Services'}</p>
                <p className="text-red-100 text-sm">{lang === 'hi' ? 'पुलिस, दमकल, एम्बुलेंस' : 'Police, Fire, Ambulance'}</p>
              </div>
            </div>
          </a>

          <a href={isDev ? '#' : 'tel:1033'} onClick={isDev ? (e) => { e.preventDefault(); alert('DEV MODE: Would dial 1033'); } : undefined}
            className="block bg-orange-500 text-white rounded-xl p-5 shadow-sm hover:bg-orange-600 active:bg-orange-700">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🚗</span>
              <div>
                <p className="font-bold text-lg">{lang === 'hi' ? '1033 — हाईवे सहायता' : 'Call 1033 — Highway Help'}</p>
                <p className="text-orange-100 text-sm">{lang === 'hi' ? 'राष्ट्रीय राजमार्ग प्राधिकरण' : 'National Highway Authority assistance'}</p>
              </div>
            </div>
          </a>
        </div>

        {/* Notes */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 mb-4">
          <p>{lang === 'hi' ? 'ये सार्वजनिक सेवाओं को सीधे कॉल हैं। आपका फोन नंबर सेवा को दिखेगा।' : 
          'These are direct calls to public services. Your phone number will be visible to the service.'}</p>
        </div>

        {isDev && (
          <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4 text-sm text-yellow-800">
            <p className="font-bold">⚠️ DEVELOPMENT MODE</p>
            <p>{lang === 'hi' ? 'टैप करने पर नंबर दिखेगा लेकिन वास्तव में डायल नहीं होगा।' :
            'Tapping will show the number but not actually dial. In production, these connect to real emergency services.'}</p>
          </div>
        )}

        <div className="text-center mt-6">
          <a href="/" className="text-sm text-slate-500 hover:text-slate-700">← {lang === 'hi' ? 'वापस' : 'Back to PingShield'}</a>
        </div>
      </div>
    </div>
  );
}
