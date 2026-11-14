'use client';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { useEffect } from 'react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Home', icon: '🏠' },
  { href: '/dashboard/items', label: 'Items', icon: '📦' },
  { href: '/dashboard/contacts', label: 'Contacts', icon: '👥' },
  { href: '/dashboard/incidents', label: 'Incidents', icon: '🔔' },
  { href: '/dashboard/notifications', label: 'Alerts', icon: '📬' },
  { href: '/dashboard/settings', label: 'Settings', icon: '⚙️' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== '/dashboard/contacts/accept' && status === 'unauthenticated') router.push('/auth/login');
  }, [status, router, pathname]);

  if (pathname === '/dashboard/contacts/accept') return <>{children}</>;

  if (status === 'loading') return (
    <div className="min-h-screen flex items-center justify-center"><p className="text-slate-500">Loading...</p></div>
  );
  if (!session) return null;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
      {/* Top bar */}
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="text-xl font-bold text-blue-600">🛡️ PingShield</Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600 hidden sm:block">{session.user?.name}</span>
            <button onClick={() => signOut({ callbackUrl: '/' })}
              className="text-sm px-3 py-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg">Sign out</button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden md:block w-56 bg-white border-r min-h-[calc(100vh-57px)] p-4">
          <nav className="space-y-1">
            {NAV_ITEMS.map(item => (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  pathname === item.href ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
                }`}>
                <span>{item.icon}</span> {item.label}
              </Link>
            ))}
            <Link href="/admin" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-50 mt-4">
              <span>🔧</span> Admin
            </Link>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6 max-w-5xl">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-30">
        <div className="flex justify-around">
          {NAV_ITEMS.slice(0, 5).map(item => (
            <Link key={item.href} href={item.href}
              className={`flex flex-col items-center py-2 px-2 text-xs min-w-[56px] ${
                pathname === item.href ? 'text-blue-600' : 'text-slate-400'
              }`}>
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
