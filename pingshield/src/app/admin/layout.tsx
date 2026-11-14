'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => { if (status === 'unauthenticated') router.push('/auth/login'); }, [status, router]);
  if (status === 'loading') return <p className="p-8 text-slate-500">Loading...</p>;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-xl font-bold text-blue-600">🛡️ PingShield</Link>
            <span className="text-sm bg-amber-100 text-amber-800 px-2 py-0.5 rounded">Admin</span>
          </div>
          <nav className="flex gap-4">
            <Link href="/admin" className="text-sm text-slate-600 hover:text-slate-900">Overview</Link>
            <Link href="/admin/reports" className="text-sm text-slate-600 hover:text-slate-900">Reports</Link>
            <Link href="/admin/audit" className="text-sm text-slate-600 hover:text-slate-900">Audit Log</Link>
          </nav>
        </div>
      </header>
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-700 text-center">
        Demo admin panel. In production, this requires role-based access control.
      </div>
      <main className="max-w-6xl mx-auto p-4 md:p-6">{children}</main>
    </div>
  );
}
