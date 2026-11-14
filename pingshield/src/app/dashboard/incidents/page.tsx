'use client';
import { useEffect, useState } from 'react';

export default function IncidentsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/items').then(r => r.json()).then(async (data) => {
      setItems(data.items || []);
      const incMap: Record<string, any[]> = {};
      for (const item of (data.items || [])) {
        const res = await fetch(`/api/items/${item.id}/incidents`);
        const d = await res.json();
        if (d.incidents?.length) incMap[item.id] = d.incidents;
      }
      setIncidents(incMap);
      setLoading(false);
    });
  }, []);

  if (loading) return <p className="text-slate-500">Loading incidents...</p>;

  const allIncidents = items.flatMap(item =>
    (incidents[item.id] || []).map((inc: any) => ({ ...inc, itemName: item.name, itemId: item.id }))
  ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">All Incidents</h1>
      {allIncidents.length === 0 && (
        <div className="bg-white rounded-xl p-8 border shadow-sm text-center">
          <p className="text-4xl mb-3">✓</p>
          <p className="text-slate-600">No incidents yet. That&apos;s a good thing!</p>
        </div>
      )}
      <div className="space-y-3">
        {allIncidents.map((inc) => (
          <a key={inc.id} href={`/dashboard/items/${inc.itemId}`}
            className="block bg-white rounded-xl p-4 border shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-slate-900">{inc.itemName}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  inc.status === 'resolved' ? 'bg-green-100 text-green-700' :
                  inc.status === 'reported' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                }`}>{inc.status.replace(/_/g, ' ')}</span>
                <p className="text-xs text-slate-400 mt-1">Calls: {inc.owner_call_attempts} · Family: {inc.family_contact_unlocked ? '🔓' : '🔒'}</p>
              </div>
              <p className="text-xs text-slate-400">{new Date(inc.created_at).toLocaleString()}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
