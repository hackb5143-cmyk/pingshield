import { isOwner } from '@/lib/owner-session';
import { getOwnerReports } from '@/lib/supabase';
import OwnerClient from './OwnerClient';

export const dynamic = 'force-dynamic';
export default async function OwnerPage() {
  const authorized = await isOwner();
  let reports = null;
  let loadError = false;
  if (authorized) {
    try { reports = await getOwnerReports(); } catch { loadError = true; }
  }
  return <OwnerClient initialReports={reports} authorized={authorized} loadError={loadError} />;
}
