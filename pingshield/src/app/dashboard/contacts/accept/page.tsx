'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function AcceptContactPage() {
  const params = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState<'loading' | 'ready' | 'accepted' | 'declined' | 'withdrawn' | 'error'>('loading');
  const [contact, setContact] = useState<any>(null);

  useEffect(() => {
    if (!token) { setStatus('error'); return; }
    setStatus('ready');
  }, [token]);

  async function accept() {
    const res = await fetch('/api/contacts/accept', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    if (res.ok) { setContact(data.contact); setStatus('accepted'); }
    else setStatus('error');
  }

  async function withdraw(action = 'withdraw') {
    const res = await fetch('/api/contacts/withdraw', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, action }),
    });
    setStatus(res.ok ? (action === 'decline' ? 'declined' : 'withdrawn') : 'error');
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl p-6 border shadow-sm">
        <h1 className="text-xl font-bold text-blue-600 text-center mb-2">🛡️ PingShield</h1>
        <h2 className="text-lg font-semibold text-center mb-4">Emergency Contact Invitation</h2>

        {status === 'error' && (
          <div className="text-center py-4">
            <p className="text-red-600">Invalid or expired invitation link.</p>
          </div>
        )}

        {status === 'ready' && (
          <>
            <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800 mb-4">
              <p>You have been invited to be an emergency contact on PingShield.</p>
              <p className="mt-2">If the owner&apos;s belongings are found and they cannot be reached after 2 call attempts, 
              you may receive a call from PingShield&apos;s relay service. Your phone number will remain private.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={accept}
                className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 min-h-[48px]">
                Accept
              </button>
              <button onClick={() => withdraw('decline')}
                className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 min-h-[48px]">
                Decline
              </button>
            </div>
          </>
        )}

        {status === 'accepted' && (
          <div className="text-center py-4">
            <p className="text-green-600 text-lg font-medium mb-3">✓ You are now an emergency contact</p>
            <p className="text-sm text-slate-600 mb-4">You may receive emergency calls through PingShield&apos;s relay. Your number stays private.</p>
            <button onClick={() => withdraw()}
              className="text-sm text-red-600 hover:underline">Withdraw consent</button>
          </div>
        )}

        {status === 'declined' && (
          <div className="text-center py-4">
            <p className="text-slate-600">Invitation declined. You will not receive emergency calls.</p>
          </div>
        )}

        {status === 'withdrawn' && (
          <div className="text-center py-4">
            <p className="text-slate-600">Consent withdrawn. You will no longer receive emergency calls.</p>
          </div>
        )}

        <div className="mt-6 pt-4 border-t">
          <a href="/api/reports" className="text-sm text-slate-400 hover:text-red-600">Report misuse</a>
        </div>
      </div>
    </div>
  );
}
