'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const ICONS: Record<string, string> = { bag: '🎒', phone: '📱', laptop: '💻', keys: '🔑', vehicle: '🚗', wallet: '👛', other: '📦' };

export default function ItemsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/items').then(r => r.json()).then(d => { setItems(d.items || []); setLoading(false); });
  }, []);

  if (loading) return <p className="text-slate-500">Loading items...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Items</h1>
        <Link href="/dashboard/items/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 min-h-[44px] flex items-center">
          + Add Item
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-xl p-8 border shadow-sm text-center">
          <p className="text-4xl mb-3">📦</p>
          <p className="text-slate-600">No items registered yet. Add your first item to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map(item => (
            <Link key={item.id} href={`/dashboard/items/${item.id}`}
              className="bg-white rounded-xl p-4 border shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{ICONS[item.category] || '📦'}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 truncate">{item.name}</h3>
                  <p className="text-sm text-slate-500 capitalize">{item.category}</p>
                  {item.description && <p className="text-sm text-slate-400 truncate mt-1">{item.description}</p>}
                  <div className="flex gap-2 mt-2">
                    {item.is_active ? (
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Active</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">Inactive</span>
                    )}
                    {item.is_stolen ? (
                      <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">Stolen</span>
                    ) : null}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
