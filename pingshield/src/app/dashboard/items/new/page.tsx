'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const CATEGORIES = [
  { value: 'bag', label: 'Bag', icon: '🎒' },
  { value: 'phone', label: 'Phone', icon: '📱' },
  { value: 'laptop', label: 'Laptop', icon: '💻' },
  { value: 'keys', label: 'Keys', icon: '🔑' },
  { value: 'vehicle', label: 'Vehicle', icon: '🚗' },
  { value: 'wallet', label: 'Wallet', icon: '👛' },
  { value: 'other', label: 'Other', icon: '📦' },
];

export default function NewItemPage() {
  const [form, setForm] = useState({ name: '', category: 'bag', description: '', public_message: '', color: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/items', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setLoading(false); return; }
    router.push(`/dashboard/items/${data.item.id}`);
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Add New Item</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-5 border shadow-sm space-y-4">
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Item Name *</label>
          <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required
            className="w-full px-4 py-3 border rounded-lg" placeholder="e.g., My Laptop Bag" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES.map(c => (
              <button key={c.value} type="button" onClick={() => setForm({...form, category: c.value})}
                className={`p-3 rounded-lg border text-center text-sm ${form.category === c.value ? 'border-blue-500 bg-blue-50' : 'hover:bg-slate-50'}`}>
                <span className="text-xl block">{c.icon}</span>
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description (private)</label>
          <input type="text" value={form.description} onChange={e => setForm({...form, description: e.target.value})}
            className="w-full px-4 py-3 border rounded-lg" placeholder="For your reference only" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Public Message (shown to finders)</label>
          <textarea value={form.public_message} onChange={e => setForm({...form, public_message: e.target.value})} rows={3}
            className="w-full px-4 py-3 border rounded-lg" placeholder="e.g., Please help me find my bag! It has important files." />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Color</label>
          <input type="text" value={form.color} onChange={e => setForm({...form, color: e.target.value})}
            className="w-full px-4 py-3 border rounded-lg" placeholder="e.g., Black" />
        </div>
        <button type="submit" disabled={loading}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 min-h-[48px]">
          {loading ? 'Creating...' : 'Create Item'}
        </button>
      </form>
    </div>
  );
}
