// Hosted storage adapter. The local source uses SQLite; this deployment uses D1.
import { env } from 'cloudflare:workers';
import type { TagPublicInfo, RecoveryReport, ReportInput, LocationFix } from './recovery-types';
export type { TagPublicInfo, RecoveryReport } from './recovery-types';
function db() { if (!env.DB) throw new Error('Hosted database unavailable'); return env.DB; }
export async function getPublicTag(code: string): Promise<TagPublicInfo | null> {
  return code.toUpperCase() === 'DEMO001' ? { tag_code: 'DEMO001', owner_alias: 'Alex R.', item_name: 'MacBook Pro 16 (Space Black)' } : null;
}
export async function saveRecoveryReport(input: ReportInput) {
  if (!await getPublicTag(input.tagCode)) throw new Error('invalid_tag');
  const reportId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const expiresAt = input.liveTokenHash ? new Date(Date.now() + 1800000).toISOString() : null;
  // The quota check and insert are one atomic SQLite statement across Worker instances.
  const result = await db().prepare(`INSERT INTO recovery_reports
    (id,tag_code,message,finder_contact,latitude,longitude,accuracy,manual_location,
     requester_hash,created_at,updated_at,live_token_hash,live_expires_at)
    SELECT ?,?,?,?,?,?,?,?,?,?,?,?,? WHERE
    (SELECT count(*) FROM recovery_reports WHERE requester_hash=? AND created_at>?) < 6`)
    .bind(reportId,input.tagCode,input.message,input.finderContact,input.latitude,input.longitude,input.accuracy,
      input.manualLocation,input.requesterHash,timestamp,timestamp,input.liveTokenHash ?? null,expiresAt,
      input.requesterHash,new Date(Date.now()-600000).toISOString()).run();
  if (!result.meta.changes) throw new Error('rate_limit');
  return { reportId, timestamp, expiresAt };
}
export async function getOwnerReports(): Promise<RecoveryReport[]> {
  const { results } = await db().prepare(`SELECT id,tag_code,message,finder_contact,latitude,longitude,accuracy,
    manual_location,created_at,updated_at,live_expires_at,sharing_stopped_at
    FROM recovery_reports WHERE tag_code='DEMO001' ORDER BY created_at DESC LIMIT 100`).all<RecoveryReport>();
  return results;
}
export async function updateReportLocation(id: string, tokenHash: string, fix: LocationFix | null) {
  const current = await db().prepare('SELECT updated_at,live_expires_at,sharing_stopped_at FROM recovery_reports WHERE id=? AND live_token_hash=?')
    .bind(id,tokenHash).first<{ updated_at: string; live_expires_at: string | null; sharing_stopped_at: string | null }>();
  if (!current) throw new Error('invalid_session');
  const now = new Date().toISOString();
  if (!fix) {
    await db().prepare('UPDATE recovery_reports SET sharing_stopped_at=coalesce(sharing_stopped_at,?) WHERE id=? AND live_token_hash=?').bind(now,id,tokenHash).run();
    return;
  }
  if (current.sharing_stopped_at || !current.live_expires_at || Date.parse(current.live_expires_at) <= Date.now()) throw new Error('session_expired');
  const cutoff = new Date(Date.now()-3000).toISOString();
  if (current.updated_at > cutoff) throw new Error('update_rate');
  const result = await db().prepare(`UPDATE recovery_reports SET latitude=?,longitude=?,accuracy=?,updated_at=?
    WHERE id=? AND live_token_hash=? AND sharing_stopped_at IS NULL AND live_expires_at>? AND updated_at<=?`)
    .bind(fix.latitude,fix.longitude,fix.accuracy,now,id,tokenHash,now,cutoff).run();
  if (!result.meta.changes) throw new Error('update_rate');
}
