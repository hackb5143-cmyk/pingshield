'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DashboardHome() {
  const [stats, setStats] = useState({ items: 0, incidents: 0, notifications: 0, contacts: 0 });
  const [recentNotifs, setRecentNotifs] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/items').then(r => r.json()),
      fetch('/api/notifications').then(r => r.json()),
      fetch('/api/contacts').then(r => r.json()),
    ]).then(([items, notifs, contacts]) => {
      setStats({
        items: items.items?.length || 0,
        incidents: 0,
        notifications: notifs.notifications?.filter((n: any) => !n.is_read).length || 0,
        contacts: contacts.contacts?.length || 0,
      });
      setRecentNotifs((notifs.notifications || []).slice(0, 5));
    });
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Items', value: stats.items, icon: '📦', href: '/dashboard/items' },
          { label: 'Contacts', value: stats.contacts, icon: '👥', href: '/dashboard/contacts' },
          { label: 'Unread', value: stats.notifications, icon: '📬', href: '/dashboard/notifications' },
          { label: 'Emergency', value: '🆘', icon: '', href: '/emergency', isLink: true },
        ].map(s => (
          <Link key={s.label} href={s.href}
            className="bg-white rounded-xl p-4 border shadow-sm hover:shadow-md transition-shadow">
            <p className="text-2xl">{s.icon}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{s.value}</p>
            <p className="text-sm text-slate-500">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="flex gap-3 mb-6">
        <Link href="/dashboard/items/new" className="px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 min-h-[44px] flex items-center">
          + Add Item
        </Link>
        <Link href="/dashboard/contacts" className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 min-h-[44px] flex items-center">
          + Add Contact
        </Link>
      </div>

      {recentNotifs.length > 0 && (
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <h2 className="font-semibold text-slate-900 mb-3">Recent Notifications</h2>
          <div className="space-y-2">
            {recentNotifs.map((n: any) => (
              <div key={n.id} className={`p-3 rounded-lg text-sm ${n.is_read ? 'bg-slate-50' : 'bg-blue-50'}`}>
                <p className="font-medium text-slate-900">{n.title}</p>
                {n.body && <p className="text-slate-600 mt-0.5">{n.body}</p>}
                <p className="text-xs text-slate-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
