import { getDb } from './connection';
import { v4 as uuid } from 'uuid';
import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';

// Re-export connection
export { getDb } from './connection';
export { runMigrations } from './migrations';

// ─── User Operations ────────────────────────────────────

export function createUser(email: string, password: string, name: string, phone?: string) {
  const db = getDb();
  const id = uuid();
  const password_hash = bcrypt.hashSync(password, 12);
  db.prepare(
    `INSERT INTO users (id, email, password_hash, name, phone) VALUES (?, ?, ?, ?, ?)`
  ).run(id, email.toLowerCase(), password_hash, name, phone || null);
  return getUserById(id);
}

export function getUserByEmail(email: string) {
  const db = getDb();
  return db.prepare(`SELECT * FROM users WHERE email = ?`).get(email.toLowerCase()) as any;
}

export function getUserById(id: string) {
  const db = getDb();
  return db.prepare(`SELECT id, email, name, phone, phone_verified, language, created_at FROM users WHERE id = ?`).get(id) as any;
}

export function verifyPassword(hash: string, password: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function updateUser(id: string, data: { name?: string; phone?: string; language?: string }) {
  const db = getDb();
  const fields: string[] = [];
  const values: any[] = [];
  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
  if (data.phone !== undefined) { fields.push('phone = ?'); values.push(data.phone); }
  if (data.language !== undefined) { fields.push('language = ?'); values.push(data.language); }
  if (fields.length === 0) return;
  fields.push("updated_at = datetime('now')");
  values.push(id);
  db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

export function deleteUser(id: string) {
  const db = getDb();
  db.transaction(() => {
    const items = `SELECT id FROM items WHERE user_id = ?`;
    const incidents = `SELECT id FROM incidents WHERE item_id IN (${items})`;
    db.prepare(`DELETE FROM call_attempts WHERE incident_id IN (${incidents})`).run(id);
    for (const table of ['messages', 'notifications', 'scan_events', 'incidents']) {
      db.prepare(`DELETE FROM ${table} WHERE item_id IN (${items})`).run(id);
    }
    db.prepare(`DELETE FROM tags WHERE item_id IN (${items})`).run(id);
    db.prepare(`DELETE FROM notifications WHERE user_id = ?`).run(id);
    db.prepare(`DELETE FROM blocks WHERE user_id = ?`).run(id);
    db.prepare(`DELETE FROM users WHERE id = ?`).run(id);
  })();
}

// ─── Item Operations ────────────────────────────────────

export function createItem(userId: string, data: { name: string; category: string; description?: string; public_message?: string; color?: string }) {
  const db = getDb();
  const id = uuid();
  db.prepare(
    `INSERT INTO items (id, user_id, name, category, description, public_message, color) VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, userId, data.name, data.category, data.description || null, data.public_message || null, data.color || null);
  return getItemById(id);
}

export function getItemById(id: string) {
  const db = getDb();
  return db.prepare(`SELECT * FROM items WHERE id = ?`).get(id) as any;
}

export function getItemsByUser(userId: string) {
  const db = getDb();
  return db.prepare(`SELECT * FROM items WHERE user_id = ? ORDER BY created_at DESC`).all(userId) as any[];
}

export function updateItem(id: string, data: { name?: string; category?: string; description?: string; public_message?: string; color?: string; is_stolen?: boolean }) {
  const db = getDb();
  const fields: string[] = [];
  const values: any[] = [];
  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
  if (data.category !== undefined) { fields.push('category = ?'); values.push(data.category); }
  if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
  if (data.public_message !== undefined) { fields.push('public_message = ?'); values.push(data.public_message); }
  if (data.color !== undefined) { fields.push('color = ?'); values.push(data.color); }
  if (data.is_stolen !== undefined) { fields.push('is_stolen = ?'); values.push(data.is_stolen ? 1 : 0); }
  if (fields.length === 0) return;
  fields.push("updated_at = datetime('now')");
  values.push(id);
  db.prepare(`UPDATE items SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

export function deleteItem(id: string) {
  const db = getDb();
  db.transaction(() => {
    db.prepare(`DELETE FROM call_attempts WHERE incident_id IN (SELECT id FROM incidents WHERE item_id = ?)`).run(id);
    for (const table of ['messages', 'notifications', 'scan_events', 'incidents', 'tags']) db.prepare(`DELETE FROM ${table} WHERE item_id = ?`).run(id);
    db.prepare(`DELETE FROM items WHERE id = ?`).run(id);
  })();
}

// ─── Tag Operations ─────────────────────────────────────

export function createTag(itemId: string) {
  const db = getDb();
  const id = uuid();
  const token = nanoid(24); // Unpredictable 24-char token
  db.prepare(
    `INSERT INTO tags (id, item_id, token, activated_at) VALUES (?, ?, ?, datetime('now'))`
  ).run(id, itemId, token);
  return db.prepare(`SELECT * FROM tags WHERE id = ?`).get(id) as any;
}

export function getTagByToken(token: string) {
  const db = getDb();
  return db.prepare(`SELECT * FROM tags WHERE token = ?`).get(token) as any;
}

export function getTagsByItem(itemId: string) {
  const db = getDb();
  return db.prepare(`SELECT * FROM tags WHERE item_id = ? ORDER BY created_at DESC`).all(itemId) as any[];
}

export function revokeTag(id: string) {
  const db = getDb();
  db.prepare(`UPDATE tags SET is_revoked = 1, is_active = 0, revoked_at = datetime('now') WHERE id = ?`).run(id);
}

// ─── Emergency Contact Operations ───────────────────────

export function createEmergencyContact(userId: string, data: { name: string; phone: string; relationship?: string }) {
  const db = getDb();
  const id = uuid();
  const invitation_token = nanoid(32);
  db.prepare(
    `INSERT INTO emergency_contacts (id, user_id, name, phone, relationship, invitation_token) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, userId, data.name, data.phone, data.relationship || null, invitation_token);
  return db.prepare(`SELECT * FROM emergency_contacts WHERE id = ?`).get(id) as any;
}

export function getEmergencyContactsByUser(userId: string) {
  const db = getDb();
  return db.prepare(`SELECT * FROM emergency_contacts WHERE user_id = ? ORDER BY created_at DESC`).all(userId) as any[];
}

export function acceptEmergencyInvitation(token: string) {
  const db = getDb();
  db.prepare(
    `UPDATE emergency_contacts SET consent_status = 'accepted', consent_at = datetime('now') WHERE invitation_token = ?`
  ).run(token);
  return db.prepare(`SELECT * FROM emergency_contacts WHERE invitation_token = ?`).get(token) as any;
}

export function withdrawEmergencyConsent(id: string) {
  const db = getDb();
  db.prepare(
    `UPDATE emergency_contacts SET consent_status = 'withdrawn', consent_withdrawn_at = datetime('now') WHERE id = ?`
  ).run(id);
}

export function deleteEmergencyContact(id: string) {
  const db = getDb();
  db.prepare(`DELETE FROM emergency_contacts WHERE id = ?`).run(id);
}

// ─── Scan Event Operations ──────────────────────────────

export function createScanEvent(data: {
  tagId: string; itemId?: string; sessionId: string;
  latitude?: number; longitude?: number; accuracy?: number;
  locationSource?: string; ipHash?: string; userAgent?: string;
}) {
  const db = getDb();
  const id = uuid();
  db.prepare(
    `INSERT INTO scan_events (id, tag_id, item_id, session_id, latitude, longitude, accuracy, location_source, location_time, ip_hash, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?)`
  ).run(id, data.tagId, data.itemId || null, data.sessionId,
    data.latitude ?? null, data.longitude ?? null, data.accuracy ?? null,
    data.locationSource || null, data.ipHash || null, data.userAgent || null);
  return id;
}

export function getScanEventsByItem(itemId: string, limit = 50) {
  const db = getDb();
  return db.prepare(
    `SELECT * FROM scan_events WHERE item_id = ? ORDER BY created_at DESC LIMIT ?`
  ).all(itemId, limit) as any[];
}

// ─── Incident Operations ────────────────────────────────

export function createIncident(data: { itemId: string; tagId: string; sessionId: string }) {
  const db = getDb();
  const id = uuid();
  const expiryHours = parseInt(process.env.INCIDENT_SESSION_EXPIRY_HOURS || '24');
  db.prepare(
    `INSERT INTO incidents (id, item_id, tag_id, session_id, expires_at)
     VALUES (?, ?, ?, ?, datetime('now', '+${expiryHours} hours'))`
  ).run(id, data.itemId, data.tagId, data.sessionId);
  return db.prepare(`SELECT * FROM incidents WHERE id = ?`).get(id) as any;
}

export function getIncidentById(id: string) {
  const db = getDb();
  return db.prepare(`SELECT * FROM incidents WHERE id = ?`).get(id) as any;
}

export function getIncidentBySession(sessionId: string, itemId: string) {
  const db = getDb();
  return db.prepare(
    `SELECT * FROM incidents WHERE session_id = ? AND item_id = ? AND status != 'resolved' AND expires_at > datetime('now') ORDER BY created_at DESC LIMIT 1`
  ).get(sessionId, itemId) as any;
}

export function getIncidentsByItem(itemId: string) {
  const db = getDb();
  return db.prepare(
    `SELECT * FROM incidents WHERE item_id = ? ORDER BY created_at DESC`
  ).all(itemId) as any[];
}

export function updateIncidentStatus(id: string, status: string) {
  const db = getDb();
  const extra = status === 'resolved' ? ", resolved_at = datetime('now')" : '';
  db.prepare(
    `UPDATE incidents SET status = ?, updated_at = datetime('now')${extra} WHERE id = ?`
  ).run(status, id);
}

export function incrementOwnerCallAttempts(incidentId: string) {
  const db = getDb();
  db.prepare(
    `UPDATE incidents SET owner_call_attempts = owner_call_attempts + 1, updated_at = datetime('now') WHERE id = ?`
  ).run(incidentId);
  const incident = getIncidentById(incidentId);
  const required = 2;
  if (incident && incident.owner_call_attempts >= required) {
    db.prepare(
      `UPDATE incidents SET family_contact_unlocked = 1, status = 'family_contact_enabled', updated_at = datetime('now') WHERE id = ?`
    ).run(incidentId);
  }
}

// ─── Call Attempt Operations ────────────────────────────

export function createCallAttempt(data: {
  incidentId: string; callType: string; providerCallId: string;
  fromNumber?: string; toNumber?: string;
}) {
  const db = getDb();
  const id = uuid();
  db.prepare(
    `INSERT INTO call_attempts (id, incident_id, call_type, provider_call_id, from_number, to_number)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, data.incidentId, data.callType, data.providerCallId,
    data.fromNumber || null, data.toNumber || null);
  return id;
}

export function getCallAttemptByProviderId(providerCallId: string) {
  const db = getDb();
  return db.prepare(`SELECT * FROM call_attempts WHERE provider_call_id = ?`).get(providerCallId) as any;
}

export function updateCallAttempt(providerCallId: string, data: {
  status: string; durationSeconds?: number; answeredBy?: string; callbackData?: string;
}) {
  const db = getDb();
  db.prepare(
    `UPDATE call_attempts SET status = ?, duration_seconds = ?, answered_by = ?,
     callback_received = 1, callback_data = ?, ended_at = datetime('now')
     WHERE provider_call_id = ?`
  ).run(data.status, data.durationSeconds || null, data.answeredBy || null,
    data.callbackData || null, providerCallId);
}

export function getCallAttemptsByIncident(incidentId: string) {
  const db = getDb();
  return db.prepare(
    `SELECT * FROM call_attempts WHERE incident_id = ? ORDER BY started_at DESC`
  ).all(incidentId) as any[];
}

// ─── Message Operations ─────────────────────────────────

export function createMessage(data: {
  incidentId?: string; itemId: string; direction: string;
  senderType: string; content: string; channel?: string;
}) {
  const db = getDb();
  const id = uuid();
  db.prepare(
    `INSERT INTO messages (id, incident_id, item_id, direction, sender_type, content, channel, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'sent')`
  ).run(id, data.incidentId || null, data.itemId, data.direction,
    data.senderType, data.content, data.channel || 'platform');
  return db.prepare(`SELECT * FROM messages WHERE id = ?`).get(id) as any;
}

export function getMessagesByItem(itemId: string, limit = 100) {
  const db = getDb();
  return db.prepare(
    `SELECT * FROM messages WHERE item_id = ? ORDER BY created_at ASC LIMIT ?`
  ).all(itemId, limit) as any[];
}

export function getMessagesByIncident(incidentId: string) {
  const db = getDb();
  return db.prepare(
    `SELECT * FROM messages WHERE incident_id = ? ORDER BY created_at ASC`
  ).all(incidentId) as any[];
}

// ─── Notification Operations ────────────────────────────

export function createNotification(data: {
  userId: string; itemId?: string; incidentId?: string;
  type: string; title: string; body?: string;
}) {
  const db = getDb();
  const id = uuid();
  db.prepare(
    `INSERT INTO notifications (id, user_id, item_id, incident_id, type, title, body)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, data.userId, data.itemId || null, data.incidentId || null,
    data.type, data.title, data.body || null);
  return id;
}

export function getNotificationsByUser(userId: string, limit = 50) {
  const db = getDb();
  return db.prepare(
    `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`
  ).all(userId, limit) as any[];
}

export function markNotificationRead(id: string) {
  const db = getDb();
  db.prepare(`UPDATE notifications SET is_read = 1 WHERE id = ?`).run(id);
}

// ─── Rate Limiting ──────────────────────────────────────

export function checkRateLimit(key: string, category: string, limit: number, windowMinutes: number): boolean {
  const db = getDb();
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
  const row = db.prepare(
    `SELECT COALESCE(SUM(count), 0) as total FROM rate_limits
     WHERE key = ? AND category = ? AND datetime(window_start) > datetime(?)`
  ).get(key, category, windowStart) as any;
  return (row?.total || 0) < limit;
}

export function incrementRateLimit(key: string, category: string) {
  const db = getDb();
  const id = uuid();
  db.prepare(
    `INSERT INTO rate_limits (id, key, category) VALUES (?, ?, ?)`
  ).run(id, key, category);
}

// ─── Abuse Report Operations ────────────────────────────

export function createAbuseReport(data: {
  reporterType: string; reporterId?: string; targetType: string;
  targetId: string; reason: string; details?: string;
}) {
  const db = getDb();
  const id = uuid();
  db.prepare(
    `INSERT INTO abuse_reports (id, reporter_type, reporter_id, target_type, target_id, reason, details)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, data.reporterType, data.reporterId || null, data.targetType,
    data.targetId, data.reason, data.details || null);
  return id;
}

export function getAbuseReports(status?: string) {
  const db = getDb();
  if (status) {
    return db.prepare(`SELECT * FROM abuse_reports WHERE status = ? ORDER BY created_at DESC`).all(status) as any[];
  }
  return db.prepare(`SELECT * FROM abuse_reports ORDER BY created_at DESC`).all() as any[];
}

// ─── Block Operations ───────────────────────────────────

export function createBlock(userId: string, data: { sessionId?: string; phoneHash?: string; reason?: string }) {
  const db = getDb();
  const id = uuid();
  db.prepare(
    `INSERT INTO blocks (id, user_id, blocked_session_id, blocked_phone_hash, reason) VALUES (?, ?, ?, ?, ?)`
  ).run(id, userId, data.sessionId || null, data.phoneHash || null, data.reason || null);
}

export function isBlocked(userId: string, sessionId: string): boolean {
  const db = getDb();
  const row = db.prepare(
    `SELECT COUNT(*) as c FROM blocks WHERE user_id = ? AND blocked_session_id = ?`
  ).get(userId, sessionId) as any;
  return row.c > 0;
}

export function getBlocksByUser(userId: string) {
  const db = getDb();
  return db.prepare(`SELECT * FROM blocks WHERE user_id = ? ORDER BY created_at DESC`).all(userId) as any[];
}

export function deleteBlock(id: string) {
  const db = getDb();
  db.prepare(`DELETE FROM blocks WHERE id = ?`).run(id);
}

// ─── Admin Audit ────────────────────────────────────────

export function logAdminAction(adminId: string, action: string, targetType?: string, targetId?: string, details?: string) {
  const db = getDb();
  const id = uuid();
  db.prepare(
    `INSERT INTO admin_audit_log (id, admin_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, adminId, action, targetType || null, targetId || null, details || null);
}

// ─── Seed Data ──────────────────────────────────────────

export function seedDemoData() {
  const db = getDb();
  const existing = db.prepare(`SELECT COUNT(*) as c FROM users`).get() as any;
  if (existing.c > 0) return;

  // Create demo owner
  const owner = createUser('demo@pingshield.local', 'Demo123!', 'Arjun Sharma', '+919876543210');
  if (!owner) return;

  // Create items
  const bag = createItem(owner.id, { name: 'Office Laptop Bag', category: 'bag', description: 'Black leather laptop bag', public_message: 'Please help me find my bag! It contains important work files.' });
  const phone = createItem(owner.id, { name: 'iPhone 15', category: 'phone', description: 'Space Grey', public_message: 'Found my phone? Thank you! Please use the contact options below.' });
  const keys = createItem(owner.id, { name: 'Car Keys - Honda City', category: 'keys', description: 'Honda keys with red keychain', public_message: 'These are my car keys. I would really appreciate getting them back.' });
  const laptop = createItem(owner.id, { name: 'MacBook Pro 14"', category: 'laptop', description: 'Silver, has stickers', public_message: 'This laptop has important data. Please contact me!' });

  // Create tags
  if (bag) createTag(bag.id);
  if (phone) createTag(phone.id);
  if (keys) createTag(keys.id);
  if (laptop) createTag(laptop.id);

  // Create emergency contacts
  if (owner) {
    const ec = createEmergencyContact(owner.id, { name: 'Priya Sharma', phone: '+919876543211', relationship: 'Spouse' });
    if (ec) acceptEmergencyInvitation(ec.invitation_token);

    createEmergencyContact(owner.id, { name: 'Rahul Sharma', phone: '+919876543212', relationship: 'Brother' });
  }
}
