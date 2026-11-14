// Temporary synthetic location, for visual QA only. Cleaned up after three minutes.
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const Database = require('better-sqlite3');
require('@next/env').loadEnvConfig(path.resolve(__dirname, '..'));
if (process.env.REPORT_STORAGE !== 'sqlite') throw new Error('Visual QA requires local SQLite');
const db = new Database(path.resolve(__dirname, '..', process.env.REPORTS_DATABASE_PATH || './data/recovery.db'));
const id = randomUUID();
const timestamp = new Date().toISOString();
db.prepare(`INSERT INTO recovery_reports (id,tag_code,message,latitude,longitude,accuracy,requester_hash,created_at,updated_at,live_expires_at)
  VALUES (?,'DEMO001','Synthetic map preview: public landmark, not device GPS',12.9716,77.5946,25,'visual-qa',?,?,?)`)
  .run(id,timestamp,timestamp,new Date(Date.now()+180000).toISOString());
console.log('Synthetic map preview available in the owner inbox for three minutes.');
setTimeout(() => { db.prepare('UPDATE recovery_reports SET latitude=12.9726,longitude=77.5956,updated_at=? WHERE id=?').run(new Date().toISOString(),id); console.log('Synthetic pin moved.'); },10000);
setTimeout(() => { db.prepare("DELETE FROM recovery_reports WHERE id=? AND requester_hash='visual-qa'").run(id); db.close(); console.log('Synthetic map preview removed.'); },180000);
