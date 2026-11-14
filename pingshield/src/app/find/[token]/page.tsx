'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import LocationShare from '@/components/finder/LocationShare';
import ContactOwner from '@/components/finder/ContactOwner';
import EmergencySection from '@/components/finder/EmergencySection';

const CATEGORY_ICONS: Record<string, string> = {
  bag: '🎒', phone: '📱', laptop: '💻', keys: '🔑', vehicle: '🚗', wallet: '👛', other: '📦'
};

export default function FinderPage() {
  const params = useParams();
  const token = params.token as string;
  const [item, setItem] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [sessionId] = useState(() => {
    if (typeof window !== 'undefined') {
      let sid = sessionStorage.getItem('ps_session');
      if (!sid) { sid = crypto.randomUUID(); sessionStorage.setItem('ps_session', sid); }
      return sid;
    }
    return '';
  });

  useEffect(() => {
    fetch(`/api/scan/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setItem(data.item);
        setLoading(false);
      })
      .catch(() => { setError('Failed to load'); setLoading(false); });
  }, [token]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center"><div className="text-4xl mb-4">🛡️</div><p className="text-slate-500">Loading...</p></div>
    </div>
  );

  if (error || !item) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-6 border shadow-sm max-w-md w-full text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">
          {lang === 'hi' ? 'अमान्य या निरस्त टैग' : 'Invalid or Revoked Tag'}
        </h1>
        <p className="text-slate-600">
          {lang === 'hi' ? 'यह QR कोड अब सक्रिय नहीं है या कभी पंजीकृत नहीं हुआ था।' : 
          'This QR code is no longer active or was never registered. If you believe this is an error, please contact support.'}
        </p>
        <a href="/emergency" className="mt-4 inline-block px-6 py-3 bg-red-600 text-white rounded-lg font-medium">
          {lang === 'hi' ? 'आपातकालीन सहायता' : 'Emergency Help'}
        </a>
      </div>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto p-4 pb-8">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex justify-end mb-2">
          <button onClick={() => setLang(l => l === 'en' ? 'hi' : 'en')}
            className="text-sm px-3 py-1 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200">
            {lang === 'en' ? 'हिन्दी' : 'English'}
          </button>
        </div>
        <h1 className="text-2xl font-bold text-blue-600">🛡️ PingShield</h1>
        <p className="text-sm text-slate-500 mt-1">
          {lang === 'hi' ? 'खोया-पाया · आपातकालीन संपर्क' : 'Lost & Found · Emergency Contact'}
        </p>
      </div>

      {/* Item info */}
      <div className="bg-white rounded-xl p-5 border shadow-sm mb-4">
        <div className="text-center">
          <div className="text-4xl mb-2">{CATEGORY_ICONS[item.category] || '📦'}</div>
          <h2 className="text-xl font-bold text-slate-900">
            {lang === 'hi' ? 'आपको कुछ मिला!' : 'You found something!'}
          </h2>
          <p className="text-slate-600 mt-1">
            {lang === 'hi' ? 'यह सामान PingShield में पंजीकृत है।' : 'This item is registered with PingShield. You can help return it to its owner.'}
          </p>
        </div>
        <div className="mt-4 bg-slate-50 rounded-lg p-3">
          <p className="text-sm text-slate-500">{lang === 'hi' ? 'सामान का प्रकार' : 'Item type'}: <strong className="capitalize">{item.category}</strong></p>
          {item.name && <p className="text-sm text-slate-500 mt-1">{item.name}</p>}
        </div>
        {item.public_message && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-800">{lang === 'hi' ? 'मालिक का संदेश' : "Owner's message"}:</p>
            <p className="text-sm text-blue-700 mt-1">{item.public_message}</p>
          </div>
        )}
      </div>

      {/* Location sharing */}
      <LocationShare token={token} sessionId={sessionId} lang={lang} />

      {/* Contact options */}
      <ContactOwner token={token} sessionId={sessionId} lang={lang} />

      {/* Emergency section */}
      <EmergencySection token={token} sessionId={sessionId} lang={lang} />

      {/* Privacy info */}
      <div className="bg-white rounded-xl p-5 border shadow-sm mb-4">
        <h3 className="font-semibold text-slate-900 mb-2">🔒 {lang === 'hi' ? 'आपकी गोपनीयता' : 'Your Privacy'}</h3>
        <p className="text-sm text-slate-600">
          {lang === 'hi' ? 
            'PingShield आपकी और मालिक दोनों की गोपनीयता की रक्षा करता है। व्यक्तिगत फोन नंबर कभी साझा नहीं किए जाते। संदेश हमारे प्लेटफॉर्म से जाते हैं। हम आपको ट्रैक नहीं करते या खाता बनाने की आवश्यकता नहीं रखते।' :
            "PingShield protects both your privacy and the owner's. Personal phone numbers are never shared between parties. Messages go through our platform. We do not track you or require an account."
          }
        </p>
      </div>

      {/* Report abuse */}
      <ReportAbuse token={token} lang={lang} />
    </div>
  );
}

function ReportAbuse({ token, lang }: { token: string; lang: 'en' | 'hi' }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);

  async function submit() {
    await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetType: 'tag', targetId: token, reason, details }),
    });
    setSubmitted(true);
  }

  if (submitted) return (
    <div className="bg-green-50 rounded-xl p-4 border border-green-200 text-sm text-green-800 text-center">
      {lang === 'hi' ? 'रिपोर्ट जमा हो गई। धन्यवाद।' : 'Report submitted. Thank you.'}
    </div>
  );

  return (
    <div className="bg-white rounded-xl p-5 border shadow-sm">
      <button onClick={() => setOpen(!open)} className="text-sm text-slate-500 hover:text-red-600">
        ⚠️ {lang === 'hi' ? 'इस टैग की रिपोर्ट करें' : 'Report this tag'}
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          <select value={reason} onChange={e => setReason(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm">
            <option value="">{lang === 'hi' ? 'कारण चुनें' : 'Select reason'}</option>
            <option value="spam">Spam</option>
            <option value="inappropriate">Inappropriate content</option>
            <option value="scam">Scam / Fraud</option>
            <option value="other">Other</option>
          </select>
          <textarea value={details} onChange={e => setDetails(e.target.value)} rows={2}
            className="w-full px-3 py-2 border rounded-lg text-sm" placeholder={lang === 'hi' ? 'विवरण...' : 'Details...'} />
          <button onClick={submit} disabled={!reason}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm disabled:opacity-50">
            {lang === 'hi' ? 'रिपोर्ट जमा करें' : 'Submit Report'}
          </button>
        </div>
      )}
    </div>
  );
}
