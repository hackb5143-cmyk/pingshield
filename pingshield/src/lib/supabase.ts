import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { localTag, localSave, localReports, localUpdate } from './recovery-sqlite';
import type { ReportInput, LocationFix, RecoveryReport, TagPublicInfo } from './recovery-types';
export type { RecoveryReport, TagPublicInfo } from './recovery-types';

function useLocal() {
  if (process.env.REPORT_STORAGE === 'sqlite') return true;
  if (process.env.REPORT_STORAGE === 'supabase' || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_SERVICE_ROLE_KEY) return false;
  if (process.env.NODE_ENV !== 'production') return true;
  throw new Error('Configure Supabase or REPORT_STORAGE=sqlite with a persistent disk');
}

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase is not configured');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function getPublicTag(code: string): Promise<TagPublicInfo | null> {
  if (!/^[A-Z0-9]{3,30}$/.test(code.toUpperCase())) return null;
  if (useLocal()) return localTag(code.toUpperCase());
  const { data, error } = await db().from('demo_tags')
    .select('code,item_name,owner_alias').eq('code', code.toUpperCase()).eq('active', true).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? { tag_code: data.code, item_name: data.item_name, owner_alias: data.owner_alias } : null;
}

export async function saveRecoveryReport(input: ReportInput): Promise<{ reportId: string; timestamp: string; expiresAt: string | null }> {
  if (useLocal()) return localSave(input);
  const args = {
    p_tag_code: input.tagCode, p_message: input.message,
    p_finder_contact: input.finderContact, p_latitude: input.latitude,
    p_longitude: input.longitude, p_accuracy: input.accuracy,
    p_manual_location: input.manualLocation, p_requester_hash: input.requesterHash,
  };
  const { data, error } = input.liveTokenHash
    ? await db().rpc('submit_live_recovery_report', { ...args, p_token_hash: input.liveTokenHash })
    : await db().rpc('submit_recovery_report', args);
  if (error) throw new Error(error.message);
  if (!data?.[0]) throw new Error('Report was not saved');
  return { reportId: data[0].report_id, timestamp: data[0].reported_at, expiresAt: data[0].expires_at ?? null };
}

export async function getOwnerReports(): Promise<RecoveryReport[]> {
  if (useLocal()) return localReports();
  const { data, error } = await db().from('recovery_reports')
    .select('id,tag_code,message,finder_contact,latitude,longitude,accuracy,manual_location,created_at,updated_at,live_expires_at,sharing_stopped_at')
    .eq('tag_code', 'DEMO001').order('created_at', { ascending: false }).limit(100);
  if (error) throw new Error(error.message);
  return (data ?? []) as RecoveryReport[];
}

export async function updateReportLocation(id: string, tokenHash: string, fix: LocationFix | null) {
  if (useLocal()) return localUpdate(id, tokenHash, fix);
  const { error } = await db().rpc('update_recovery_location', {
    p_report_id: id, p_token_hash: tokenHash, p_stop: fix === null,
    p_latitude: fix?.latitude ?? null, p_longitude: fix?.longitude ?? null, p_accuracy: fix?.accuracy ?? null,
  });
  if (error) throw new Error(error.message);
}
