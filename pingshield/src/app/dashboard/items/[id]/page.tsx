'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const LocationMap = dynamic(() => import('@/components/dashboard/LocationMap'), { ssr: false });

export default function ItemDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [item, setItem] = useState<any>(null);
  const [tags, setTags] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [scanEvents, setScanEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'info' | 'tags' | 'reports' | 'messages' | 'incidents'>('info');
  const [editForm, setEditForm] = useState<any>(null);
  const [replyIncident, setReplyIncident] = useState('');
  const [replyError, setReplyError] = useState('');
  const [reply, setReply] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [itemRes, tagsRes, msgRes, incRes] = await Promise.all([
        fetch(`/api/items/${id}`).then(r => r.json()),
        fetch(`/api/items/${id}/tags`).then(r => r.json()),
        fetch(`/api/items/${id}/messages`).then(r => r.json()),
        fetch(`/api/items/${id}/incidents`).then(r => r.json()),
      ]);
      setItem(itemRes.item);
      setEditForm(itemRes.item);
      setTags(tagsRes.tags || []);
      setMessages(msgRes.messages || []);
      setIncidents(incRes.incidents || []);
      if (itemRes.item) {
        // scanEvents come from incidents details - use location data from scan events
        setScanEvents(incRes.scanEvents || []);
      }
    } catch {}
    setLoading(false);
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  async function generateTag() {
    const res = await fetch(`/api/items/${id}/tags`, { method: 'POST' });
    const data = await res.json();
    if (data.tag) setTags(prev => [data.tag, ...prev]);
  }

  async function revokeTag(tagId: string) {
    if (!confirm('Revoke this tag? It will stop working.')) return;
    await fetch(`/api/items/${id}/tags/${tagId}`, { method: 'DELETE' });
    setTags(prev => prev.map(t => t.id === tagId ? { ...t, is_revoked: 1, is_active: 0 } : t));
  }

  async function saveItem() {
    setSaving(true);
    await fetch(`/api/items/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editForm.name, category: editForm.category,
        description: editForm.description, public_message: editForm.public_message,
        color: editForm.color, is_stolen: editForm.is_stolen,
      }),
    });
    setItem(editForm);
    setSaving(false);
  }

  async function deleteItem() {
    if (!confirm('Delete this item permanently? All tags, incidents, and messages will be removed.')) return;
    await fetch(`/api/items/${id}`, { method: 'DELETE' });
    router.push('/dashboard/items');
  }

  async function sendReply() {
    if (!reply.trim()) return;
    const res = await fetch(`/api/items/${id}/messages`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: reply, incidentId: replyIncident }),
    });
    if (!res.ok) { setReplyError((await res.json()).error); return; }
    setReplyError('');
    setReply('');
    loadData();
  }

  async function updateIncident(incidentId: string, status: string) {
    await fetch(`/api/items/${id}/incidents/${incidentId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    loadData();
  }

  if (loading) return <p className="text-slate-500">Loading...</p>;
  if (!item) return <p className="text-red-600">Item not found</p>;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return (
    <div className="max-w-3xl">
      <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-slate-700 mb-4">← Back</button>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">{item.name}</h1>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto mb-4 bg-white rounded-xl p-1 border">
        {(['info', 'tags', 'reports', 'messages', 'incidents'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${tab === t ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}>
            {t === 'info' ? '📝 Info' : t === 'tags' ? '🏷️ Tags' : t === 'reports' ? '📍 Locations' : t === 'messages' ? '💬 Messages' : '🔔 Incidents'}
          </button>
        ))}
      </div>

      {/* Info tab */}
      {tab === 'info' && editForm && (
        <div className="bg-white rounded-xl p-5 border shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description (private)</label>
            <input value={editForm.description || ''} onChange={e => setEditForm({...editForm, description: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Public Message</label>
            <textarea value={editForm.public_message || ''} onChange={e => setEditForm({...editForm, public_message: e.target.value})} rows={3}
              className="w-full px-4 py-2 border rounded-lg" />
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!!editForm.is_stolen} onChange={e => setEditForm({...editForm, is_stolen: e.target.checked ? 1 : 0})}
                className="w-5 h-5 rounded" />
              <span className="text-sm font-medium text-red-600">Mark as stolen</span>
            </label>
          </div>
          <div className="flex gap-3">
            <button onClick={saveItem} disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button onClick={deleteItem} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100">
              Delete Item
            </button>
          </div>
        </div>
      )}

      {/* Tags tab */}
      {tab === 'tags' && (
        <div className="space-y-4">
          <button onClick={generateTag} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
            + Generate QR Tag
          </button>
          {tags.length === 0 && <p className="text-slate-500 text-sm">No tags yet. Generate one to get started.</p>}
          {tags.map(tag => (
            <div key={tag.id} className="bg-white rounded-xl p-4 border shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-mono text-sm text-slate-700">{tag.token}</p>
                  <p className="text-xs text-slate-400 mt-1">Created: {new Date(tag.created_at).toLocaleDateString()}</p>
                  {tag.is_revoked ? (
                    <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">Revoked</span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Active</span>
                  )}
                </div>
                {!tag.is_revoked && (
                  <div className="flex flex-col gap-2">
                    <a href={`/api/qr/${tag.token}`} download={`pingshield-${tag.token}.png`}
                      className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-center">
                      ⬇ Download QR
                    </a>
                    <button onClick={() => revokeTag(tag.id)}
                      className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
                      ✕ Revoke
                    </button>
                  </div>
                )}
              </div>
              {!tag.is_revoked && (
                <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Scan URL:</p>
                  <p className="text-xs font-mono text-blue-600 break-all">{appUrl}/find/{tag.token}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Location reports tab */}
      {tab === 'reports' && (
        <div className="space-y-4">
          {scanEvents.length > 0 && (
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ height: 300 }}>
              <LocationMap markers={scanEvents.filter((s: any) => s.latitude != null && s.longitude != null).map((s: any) => ({
                lat: s.latitude, lng: s.longitude, label: `Finder report at ${new Date(s.created_at).toLocaleString()}`,
              }))} />
            </div>
          )}
          {scanEvents.length === 0 && <p className="text-slate-500 text-sm">No location reports yet.</p>}
          {scanEvents.map((s: any) => (
            <div key={s.id} className="bg-white rounded-xl p-4 border shadow-sm text-sm">
              <p className="font-medium text-slate-900">
                📍 {s.latitude != null ? `${s.latitude.toFixed(5)}, ${s.longitude.toFixed(5)}` : s.landmark || 'No location'}
                {s.location_source === 'manually provided' && ' (manually provided)'}
              </p>
              <p className="text-slate-500 mt-1">Reported: {new Date(s.created_at).toLocaleString()}</p>
              {s.accuracy && <p className="text-slate-400">Accuracy: ~{Math.round(s.accuracy)}m</p>}
            </div>
          ))}
        </div>
      )}

      {/* Messages tab */}
      {tab === 'messages' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border shadow-sm p-4 max-h-96 overflow-y-auto">
            {messages.length === 0 && <p className="text-slate-500 text-sm text-center py-4">No messages yet.</p>}
            {messages.map((m: any) => (
              <div key={m.id} className={`mb-3 ${m.sender_type === 'owner' ? 'text-right' : ''}`}>
                <div className={`inline-block px-4 py-2 rounded-xl max-w-[80%] text-sm ${
                  m.sender_type === 'owner' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-900'
                }`}>
                  {m.content}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{new Date(m.created_at).toLocaleString()} · {m.status}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <label className="block">Finder conversation
              <select value={replyIncident} onChange={e => setReplyIncident(e.target.value)} className="w-full border p-3 rounded-lg">
                <option value="">Select an incident</option>
                {incidents.map(incident => <option key={incident.id} value={incident.id}>{incident.id.slice(0, 8)} — {incident.status}</option>)}
              </select>
            </label>
            {replyError && <p role="alert" className="text-red-700">{replyError}</p>}
            <input value={reply} onChange={e => setReply(e.target.value)} placeholder="Reply to finder..."
              className="flex-1 px-4 py-2 border rounded-lg" onKeyDown={e => e.key === 'Enter' && sendReply()} />
            <button onClick={sendReply} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Send</button>
          </div>
        </div>
      )}

      {/* Incidents tab */}
      {tab === 'incidents' && (
        <div className="space-y-4">
          {incidents.length === 0 && <p className="text-slate-500 text-sm">No incidents yet.</p>}
          {incidents.map((inc: any) => (
            <div key={inc.id} className="bg-white rounded-xl p-4 border shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    inc.status === 'resolved' ? 'bg-green-100 text-green-700' :
                    inc.status === 'reported' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                  }`}>{inc.status.replace(/_/g, ' ')}</span>
                  <p className="text-sm text-slate-700 mt-2">Owner calls: {inc.owner_call_attempts}</p>
                  <p className="text-sm text-slate-700">Family unlocked: {inc.family_contact_unlocked ? 'Yes' : 'No'}</p>
                  <p className="text-xs text-slate-400 mt-1">{new Date(inc.created_at).toLocaleString()}</p>
                </div>
                <div className="flex flex-col gap-2">
                  {inc.status !== 'owner_acknowledged' && inc.status !== 'resolved' && (
                    <button onClick={() => updateIncident(inc.id, 'owner_acknowledged')}
                      className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100">
                      Acknowledge
                    </button>
                  )}
                  {inc.status !== 'resolved' && (
                    <button onClick={() => updateIncident(inc.id, 'resolved')}
                      className="text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100">
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
