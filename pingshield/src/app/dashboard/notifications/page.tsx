'use client';
import { useEffect, useState } from 'react';

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/notifications').then(r => r.json()).then(d => { setNotifs(d.notifications || []); setLoading(false); });
  }, []);

  async function markRead(id: string) {
    await fetch('/api/notifications', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }),
    });
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
  }

  if (loading) return <p className="text-slate-500">Loading...</p>;

  const ICONS: Record<string, string> = { scan: '📍', location_report: '🗺️', message: '💬', call_attempt: '📞', family_unlocked: '🔓', incident_update: '🔔', abuse_report: '⚠️' };

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Notifications</h1>
      {notifs.length === 0 && (
        <div className="bg-white rounded-xl p-8 border shadow-sm text-center">
          <p className="text-4xl mb-3">📬</p>
          <p className="text-slate-600">No notifications yet.</p>
        </div>
      )}
      <div className="space-y-2">
        {notifs.map(n => (
          <button key={n.id} onClick={() => !n.is_read && markRead(n.id)}
            className={`w-full text-left p-4 rounded-xl border shadow-sm transition-colors ${
              n.is_read ? 'bg-white' : 'bg-blue-50 border-blue-200'
            }`}>
            <div className="flex items-start gap-3">
              <span className="text-xl">{ICONS[n.type] || '🔔'}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${n.is_read ? 'text-slate-700' : 'font-medium text-slate-900'}`}>{n.title}</p>
                {n.body && <p className="text-xs text-slate-500 mt-0.5">{n.body}</p>}
                <p className="text-xs text-slate-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
              </div>
              {!n.is_read && <span className="w-2 h-2 bg-blue-600 rounded-full mt-1.5" />}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
