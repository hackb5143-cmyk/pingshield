'use client';
import { useEffect, useState } from 'react';

export default function AdminReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/reports').then(r => r.json()).then(d => { setReports(d.reports || []); setLoading(false); });
  }, []);

  async function updateReport(id: string, status: string) {
    await fetch('/api/admin/reports', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  }

  if (loading) return <p className="text-slate-500">Loading...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Abuse Reports</h1>
      {reports.length === 0 && <p className="text-slate-500">No reports.</p>}
      <div className="space-y-3">
        {reports.map(r => (
          <div key={r.id} className="bg-white rounded-xl p-4 border shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  r.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  r.status === 'reviewed' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                }`}>{r.status}</span>
                <p className="text-sm font-medium text-slate-900 mt-1">{r.reason}</p>
                <p className="text-xs text-slate-500">Target: {r.target_type} · {r.target_id?.substring(0, 8)}...</p>
                {r.details && <p className="text-xs text-slate-400 mt-1">{r.details}</p>}
                <p className="text-xs text-slate-400 mt-1">{new Date(r.created_at).toLocaleString()}</p>
              </div>
              {r.status === 'pending' && (
                <div className="flex gap-2">
                  <button onClick={() => updateReport(r.id, 'reviewed')}
                    className="text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100">
                    Mark Reviewed
                  </button>
                  <button onClick={() => updateReport(r.id, 'dismissed')}
                    className="text-xs px-3 py-1.5 bg-slate-50 text-slate-500 rounded-lg hover:bg-slate-100">
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
