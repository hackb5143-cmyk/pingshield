import { getDb } from './connection';

/**
 * Run all migrations in order. Idempotent — safe to call on every startup.
 */
export function runMigrations(): void {
  const db = getDb();

  db.exec(`
    -- ─── Users (Owners) ───────────────────────────────────
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      phone_verified INTEGER DEFAULT 0,
      language TEXT DEFAULT 'en',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- ─── Items (Belongings) ──────────────────────────────
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'other',
      description TEXT,
      public_message TEXT,
      color TEXT,
      is_active INTEGER DEFAULT 1,
      is_stolen INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- ─── Tags (QR Codes) ─────────────────────────────────
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      item_id TEXT REFERENCES items(id) ON DELETE SET NULL,
      token TEXT UNIQUE NOT NULL,
      is_active INTEGER DEFAULT 1,
      is_revoked INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      activated_at TEXT,
      revoked_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_tags_token ON tags(token);

    -- ─── Emergency Contacts ──────────────────────────────
    CREATE TABLE IF NOT EXISTS emergency_contacts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      relationship TEXT,
      invitation_token TEXT UNIQUE,
      consent_status TEXT DEFAULT 'pending',
      consent_at TEXT,
      consent_withdrawn_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- ─── Scan Events ─────────────────────────────────────
    CREATE TABLE IF NOT EXISTS scan_events (
      id TEXT PRIMARY KEY,
      tag_id TEXT NOT NULL REFERENCES tags(id),
      item_id TEXT REFERENCES items(id),
      session_id TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      accuracy REAL,
      location_source TEXT,
      location_time TEXT,
      ip_hash TEXT,
      user_agent TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_scan_events_tag ON scan_events(tag_id);
    CREATE INDEX IF NOT EXISTS idx_scan_events_item ON scan_events(item_id);

    -- ─── Incidents ───────────────────────────────────────
    CREATE TABLE IF NOT EXISTS incidents (
      id TEXT PRIMARY KEY,
      item_id TEXT NOT NULL REFERENCES items(id),
      tag_id TEXT NOT NULL REFERENCES tags(id),
      session_id TEXT NOT NULL,
      status TEXT DEFAULT 'reported',
      owner_call_attempts INTEGER DEFAULT 0,
      family_contact_unlocked INTEGER DEFAULT 0,
      finder_phone_hash TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      expires_at TEXT,
      resolved_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_incidents_item ON incidents(item_id);
    CREATE INDEX IF NOT EXISTS idx_incidents_session ON incidents(session_id);

    -- ─── Call Attempts ───────────────────────────────────
    CREATE TABLE IF NOT EXISTS call_attempts (
      id TEXT PRIMARY KEY,
      incident_id TEXT NOT NULL REFERENCES incidents(id),
      call_type TEXT NOT NULL,
      provider_call_id TEXT UNIQUE,
      from_number TEXT,
      to_number TEXT,
      status TEXT DEFAULT 'initiated',
      duration_seconds INTEGER,
      ring_duration_seconds INTEGER,
      answered_by TEXT,
      started_at TEXT DEFAULT (datetime('now')),
      ended_at TEXT,
      callback_received INTEGER DEFAULT 0,
      callback_data TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_call_attempts_incident ON call_attempts(incident_id);
    CREATE INDEX IF NOT EXISTS idx_call_attempts_provider ON call_attempts(provider_call_id);

    -- ─── Messages ────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      incident_id TEXT REFERENCES incidents(id),
      item_id TEXT NOT NULL REFERENCES items(id),
      direction TEXT NOT NULL,
      sender_type TEXT NOT NULL,
      content TEXT NOT NULL,
      status TEXT DEFAULT 'queued',
      channel TEXT DEFAULT 'platform',
      created_at TEXT DEFAULT (datetime('now')),
      delivered_at TEXT,
      read_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_messages_item ON messages(item_id);
    CREATE INDEX IF NOT EXISTS idx_messages_incident ON messages(incident_id);

    -- ─── Notifications ───────────────────────────────────
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      item_id TEXT REFERENCES items(id),
      incident_id TEXT REFERENCES incidents(id),
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT,
      is_read INTEGER DEFAULT 0,
      channel TEXT DEFAULT 'platform',
      external_status TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

    -- ─── Rate Limit Tracking ─────────────────────────────
    CREATE TABLE IF NOT EXISTS rate_limits (
      id TEXT PRIMARY KEY,
      key TEXT NOT NULL,
      category TEXT NOT NULL,
      count INTEGER DEFAULT 1,
      window_start TEXT DEFAULT (datetime('now')),
      window_end TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON rate_limits(key, category);

    -- ─── Abuse Reports ───────────────────────────────────
    CREATE TABLE IF NOT EXISTS abuse_reports (
      id TEXT PRIMARY KEY,
      reporter_type TEXT NOT NULL,
      reporter_id TEXT,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      details TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now')),
      resolved_at TEXT,
      resolved_by TEXT
    );

    -- ─── Blocks ──────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS blocks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      blocked_session_id TEXT,
      blocked_phone_hash TEXT,
      reason TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_blocks_user ON blocks(user_id);

    -- ─── Admin Audit Log ─────────────────────────────────
    CREATE TABLE IF NOT EXISTS admin_audit_log (
      id TEXT PRIMARY KEY,
      admin_id TEXT NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id TEXT,
      details TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- ─── Job Queue ───────────────────────────────────────
    CREATE TABLE IF NOT EXISTS job_queue (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      payload TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      attempts INTEGER DEFAULT 0,
      max_attempts INTEGER DEFAULT 3,
      scheduled_at TEXT DEFAULT (datetime('now')),
      started_at TEXT,
      completed_at TEXT,
      failed_at TEXT,
      error TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_job_queue_status ON job_queue(status, scheduled_at);
  `);
  const columns = db.prepare('PRAGMA table_info(scan_events)').all() as { name: string }[];
  if (!columns.some(column => column.name === 'landmark')) db.exec('ALTER TABLE scan_events ADD COLUMN landmark TEXT');

}
