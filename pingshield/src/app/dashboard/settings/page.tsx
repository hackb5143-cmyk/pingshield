'use client';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [form, setForm] = useState({ name: session?.user?.name || '', phone: '', language: 'en' });
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { fetch('/api/account').then(async res => {
    if (!res.ok) throw new Error('Unable to load settings.');
    const { user } = await res.json(); setForm(user); setLoaded(true);
  }).catch(err => setError(err.message)); }, []);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(''); setSaved(false);
    try {
      const res = await fetch('/api/account', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSaved(true);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to save.'); }
    finally { setSaving(false); }
  }

  async function deleteAccount() {
    if (!confirm('Are you sure you want to delete your account? This cannot be undone. All items, tags, and data will be permanently removed.')) return;
    if (!confirm('This is your final confirmation. Delete account?')) return;
    const password = prompt('Enter your password to delete your account:');
    if (!password) return;
    try {
      const res = await fetch('/api/account', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await signOut({ callbackUrl: '/' });
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to delete account.'); }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Settings</h1>

      {error && <p role="alert" className="mb-4 text-red-700">{error}</p>}
      <form onSubmit={handleSave} className="bg-white rounded-xl p-5 border shadow-sm space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
          <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input value={session?.user?.email || ''} disabled
            className="w-full px-4 py-2 border rounded-lg bg-slate-50 text-slate-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Language</label>
          <select value={form.language} onChange={e => setForm({...form, language: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg">
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
          </select>
        </div>
        <button type="submit" disabled={saving || !loaded}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">
          {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Changes'}
        </button>
      </form>

      <div className="bg-red-50 border border-red-200 rounded-xl p-5">
        <h2 className="font-semibold text-red-800 mb-2">Danger Zone</h2>
        <p className="text-sm text-red-700 mb-3">Deleting your account removes all items, tags, contacts, and incident data permanently.</p>
        <button onClick={deleteAccount}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
          Delete Account
        </button>
      </div>
    </div>
  );
}
