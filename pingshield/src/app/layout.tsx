import { Suspense } from 'react';
import type { Metadata } from 'next';
import './generated.css';
import './globals.css';
import Providers from './providers';

export const metadata: Metadata = {
  title: 'PingShield — Privacy-First Item Recovery & Emergency Contact',
  description: 'PingShield connects finders and owners with zero phone number exposure and instant emergency hotlines.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#0B0F17] text-slate-100 min-h-screen">
        <Providers>
          <Suspense fallback={<div className="min-h-screen bg-[#0B0F17] flex items-center justify-center text-rose-400">Loading PingShield...</div>}>
            {children}
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
