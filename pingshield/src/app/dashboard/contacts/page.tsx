'use client';
import { useEffect, useState } from 'react';

export default function ContactsPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', relationship: '' });
  const [saving, setSaving] = useState(false);

  async function loadContacts() {
    const res = await fetch('/api/contacts');
    const data = await res.json();
    setContacts(data.contacts || []);
    setLoading(false);
  }

  useEffect(() => { loadContacts(); }, []);

  async function addContact(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/contacts', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    });
    setForm({ name: '', phone: '', relationship: '' });
    setShowForm(false);
    setSaving(false);
    loadContacts();
  }

  async function deleteContact(id: string) {
    if (!confirm('Remove this emergency contact?')) return;
    await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
    loadContacts();
  }

  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';

  if (loading) return <p className="text-slate-500">Loading...</p>;

  return (
    <div className="max-w-lg">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Emergency Contacts</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 min-h-[44px]">
          + Add Contact
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 mb-4">
        Emergency contacts can be reached when a finder cannot reach you after 2 unanswered call attempts.
        Contacts must accept an invitation before they can receive emergency calls. Their phone numbers remain masked.
      </div>

      {showForm && (
        <form onSubmit={addContact} className="bg-white rounded-xl p-5 border shadow-sm mb-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required
              className="w-full px-4 py-2 border rounded-lg" placeholder="Contact name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone *</label>
            <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required
              className="w-full px-4 py-2 border rounded-lg" placeholder="+91 XXXXX XXXXX" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Relationship</label>
            <input value={form.relationship} onChange={e => setForm({...form, relationship: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg" placeholder="e.g., Spouse, Parent" />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">
              {saving ? 'Adding...' : 'Add Contact'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 text-slate-500 hover:text-slate-700">Cancel</button>
          </div>
        </form>
      )}

      {contacts.length === 0 && !showForm && (
        <div className="bg-white rounded-xl p-8 border shadow-sm text-center">
          <p className="text-4xl mb-3">👥</p>
          <p className="text-slate-600">No emergency contacts added yet.</p>
        </div>
      )}

      <div className="space-y-3">
        {contacts.map(c => (
          <div key={c.id} className="bg-white rounded-xl p-4 border shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-slate-900">{c.name}</h3>
                <p className="text-sm text-slate-500">
                  {c.phone.replace(/(\d{2})\d+(\d{4})/, '$1•••••$2')}
                  {c.relationship && ` · ${c.relationship}`}
                </p>
                <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
                  c.consent_status === 'accepted' ? 'bg-green-100 text-green-700' :
                  c.consent_status === 'withdrawn' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>{c.consent_status}</span>
              </div>
              <button onClick={() => deleteContact(c.id)}
                className="text-xs px-3 py-1.5 text-red-500 hover:bg-red-50 rounded-lg">Remove</button>
            </div>
            {c.consent_status === 'pending' && c.invitation_token && (
              <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Share this invitation link:</p>
                <p className="text-xs font-mono text-blue-600 break-all">{appUrl}/dashboard/contacts/accept?token={c.invitation_token}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
