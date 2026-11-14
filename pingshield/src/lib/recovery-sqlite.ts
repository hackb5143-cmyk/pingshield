import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { RecoveryReport, ReportInput, LocationFix, TagPublicInfo } from './recovery-types';

let connection: Database.Database | undefined;
function db() {
  if (connection) return connection;
  const filename = path.resolve(process.env.REPORTS_DATABASE_PATH || './data/recovery.db');
  mkdirSync(path.dirname(filename), { recursive: true });
  const candidate = new Database(filename);
  candidate.pragma('journal_mode = WAL');
  candidate.pragma('busy_timeout = 5000');
  candidate.exec(`CREATE TABLE IF NOT EXISTS recovery_reports (
    id TEXT PRIMARY KEY, tag_code TEXT NOT NULL, message TEXT NOT NULL,
    finder_contact TEXT, latitude REAL, longitude REAL, accuracy REAL,
    manual_location TEXT, requester_hash TEXT NOT NULL, created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL, live_token_hash TEXT, live_expires_at TEXT, sharing_stopped_at TEXT
  );
  CREATE INDEX IF NOT EXISTS recovery_rate ON recovery_reports(requester_hash, created_at);
  CREATE INDEX IF NOT EXISTS recovery_tag ON recovery_reports(tag_code, created_at);`);
  connection = candidate;
  return candidate;
}
export function localTag(code: string): TagPublicInfo | null {
  return code === 'DEMO001' ? { tag_code: code, item_name: 'MacBook Pro 16 (Space Black)', owner_alias: 'Alex R.' } : null;
}
export function localSave(input: ReportInput) {
  return db().transaction(() => {
    if (!localTag(input.tagCode)) throw new Error('invalid_tag');
    const recent = db().prepare('SELECT count(*) AS n FROM recovery_reports WHERE requester_hash = ? AND created_at > ?')
      .get(input.requesterHash, new Date(Date.now() - 600000).toISOString()) as { n: number };
    if (recent.n >= 6) throw new Error('rate_limit');
    const reportId = randomUUID();
    const timestamp = new Date().toISOString();
    const expiresAt = input.liveTokenHash ? new Date(Date.now() + 1800000).toISOString() : null;
    db().prepare(`INSERT INTO recovery_reports
      (id, tag_code, message, finder_contact, latitude, longitude, accuracy, manual_location,
       requester_hash, created_at, updated_at, live_token_hash, live_expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      reportId, input.tagCode, input.message, input.finderContact, input.latitude, input.longitude,
      input.accuracy, input.manualLocation, input.requesterHash, timestamp, timestamp, input.liveTokenHash ?? null, expiresAt);
    return { reportId, timestamp, expiresAt };
  }).immediate();
}
export function localReports(): RecoveryReport[] {
  return db().prepare(`SELECT id,tag_code,message,finder_contact,latitude,longitude,accuracy,
    manual_location,created_at,updated_at,live_expires_at,sharing_stopped_at
    FROM recovery_reports WHERE tag_code = 'DEMO001' ORDER BY created_at DESC LIMIT 100`).all() as RecoveryReport[];
}
export function localUpdate(id: string, tokenHash: string, fix: LocationFix | null) {
  return db().transaction(() => {
    const row = db().prepare('SELECT * FROM recovery_reports WHERE id = ? AND live_token_hash = ?')
      .get(id, tokenHash) as RecoveryReport | undefined;
    if (!row) throw new Error('invalid_session');
    if (fix === null) {
      db().prepare('UPDATE recovery_reports SET sharing_stopped_at = coalesce(sharing_stopped_at, ?) WHERE id = ?')
        .run(new Date().toISOString(), id);
      return;
    }
    if (row.sharing_stopped_at || !row.live_expires_at || Date.parse(row.live_expires_at) <= Date.now()) throw new Error('session_expired');
    if (Date.now() - Date.parse(row.updated_at) < 3000) throw new Error('update_rate');
    db().prepare('UPDATE recovery_reports SET latitude = ?, longitude = ?, accuracy = ?, updated_at = ? WHERE id = ?')
      .run(fix.latitude, fix.longitude, fix.accuracy, new Date().toISOString(), id);
  }).immediate();
}
