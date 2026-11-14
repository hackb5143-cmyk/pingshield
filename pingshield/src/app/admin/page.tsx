'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminPage() {
  const [stats, setStats] = useState({ reports: 0, users: 0, items: 0 });

  useEffect(() => {
    fetch('/api/admin/reports').then(r => r.json()).then(d => {
      setStats(prev => ({ ...prev, reports: (d.reports || []).filter((r: any) => r.status === 'pending').length }));
    });
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Admin Overview</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Link href="/admin/reports" className="bg-white rounded-xl p-5 border shadow-sm hover:shadow-md">
          <p className="text-3xl font-bold text-slate-900">{stats.reports}</p>
          <p className="text-sm text-slate-500">Pending Reports</p>
        </Link>
        <Link href="/admin/audit" className="bg-white rounded-xl p-5 border shadow-sm hover:shadow-md">
          <p className="text-3xl">📋</p>
          <p className="text-sm text-slate-500">Audit Log</p>
        </Link>
        <Link href="/dashboard" className="bg-white rounded-xl p-5 border shadow-sm hover:shadow-md">
          <p className="text-3xl">🏠</p>
          <p className="text-sm text-slate-500">Back to Dashboard</p>
        </Link>
      </div>
    </div>
  );
}
