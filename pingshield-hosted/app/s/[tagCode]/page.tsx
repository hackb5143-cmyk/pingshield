import { Metadata } from 'next';
import { getPublicTag } from '@/lib/supabase';
import ScannerClient from './ScannerClient';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ tagCode: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tagCode } = await params;
  return {
    title: `PingShield — Found Item (${tagCode.toUpperCase()})`,
    description: 'Secure lost & found recovery portal without exposing private phone numbers.',
  };
}

export default async function ScannerPage({ params }: PageProps) {
  const { tagCode } = await params;
  const tagInfo = await getPublicTag(tagCode);

  if (!tagInfo) {
    return (
      <main className="min-h-screen bg-[#0B0F17] text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md glass-panel p-6 sm:p-8 rounded-2xl text-center border border-rose-500/30">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-4 text-rose-400 text-2xl">
            ⚠️
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Tag Not Found or Inactive</h1>
          <p className="text-sm text-slate-400 mb-6">
            The scanned tag code <span className="font-mono text-rose-400 font-bold">{tagCode.toUpperCase()}</span> does not exist or is currently inactive.
          </p>
          <div className="space-y-3">
            <Link
              href="/s/DEMO001"
              className="block w-full py-3 px-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-semibold text-sm transition-all pink-glow"
            >
              Try Demo Tag (DEMO001)
            </Link>
            <Link
              href="/demo"
              className="block w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium text-sm transition-all"
            >
              View QR Code Studio
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return <ScannerClient tag={tagInfo} />;
}
