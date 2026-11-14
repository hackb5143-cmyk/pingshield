import 'server-only';
import { createClient } from '@supabase/supabase-js';

export type TagPublicInfo = { tag_code: string; item_name: string; owner_alias: string };
export type RecoveryReport = {
  id: string; tag_code: string; message: string; finder_contact: string | null;
  latitude: number | null; longitude: number | null; accuracy: number | null;
  manual_location: string | null; created_at: string;
};

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase is not configured');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function getPublicTag(code: string): Promise<TagPublicInfo | null> {
  if (!/^[A-Z0-9]{3,30}$/.test(code.toUpperCase())) return null;
  const { data, error } = await db().from('demo_tags')
    .select('code,item_name,owner_alias').eq('code', code.toUpperCase()).eq('active', true).maybeSingle();
  if (error) throw error;
  return data ? { tag_code: data.code, item_name: data.item_name, owner_alias: data.owner_alias } : null;
}

export async function saveRecoveryReport(input: {
  tagCode: string; message: string; finderContact: string | null;
  latitude: number | null; longitude: number | null; accuracy: number | null;
  manualLocation: string | null; requesterHash: string;
}): Promise<{ reportId: string; timestamp: string }> {
  const { data, error } = await db().rpc('submit_recovery_report', {
    p_tag_code: input.tagCode, p_message: input.message,
    p_finder_contact: input.finderContact, p_latitude: input.latitude,
    p_longitude: input.longitude, p_accuracy: input.accuracy,
    p_manual_location: input.manualLocation, p_requester_hash: input.requesterHash,
  });
  if (error) throw error;
  if (!data?.[0]) throw new Error('Report was not saved');
  return { reportId: data[0].report_id, timestamp: data[0].reported_at };
}

export async function getOwnerReports(): Promise<RecoveryReport[]> {
  const { data, error } = await db().from('recovery_reports')
    .select('id,tag_code,message,finder_contact,latitude,longitude,accuracy,manual_location,created_at')
    .eq('tag_code', 'DEMO001').order('created_at', { ascending: false }).limit(100);
  if (error) throw error;
  return (data ?? []) as RecoveryReport[];
}
