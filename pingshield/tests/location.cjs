const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const ts = require('typescript');
const Database = require('better-sqlite3');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pingshield-location-'));
process.env.REPORTS_DATABASE_PATH = path.join(dir, 'recovery.db');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText, filename);
const store = require('../src/lib/recovery-sqlite.ts');
const { locationSchema } = require('../src/lib/location-validation.ts');
const hash = createHash('sha256').update('test-only-capability').digest('hex');
assert(locationSchema.safeParse({ latitude: 0, longitude: 0, accuracy: 0 }).success);
for (const bad of [{ latitude: 91, longitude: 0 }, { latitude: 0, longitude: -181 }, { latitude: NaN, longitude: 0 }, { latitude: 0 }, { latitude: '12', longitude: 0 }, { latitude: 0, longitude: 0, accuracy: -1 }]) assert(!locationSchema.safeParse(bad).success);
const input = { tagCode: 'DEMO001', message: 'Synthetic recovery test', finderContact: null, latitude: 0, longitude: 0, accuracy: 0, manualLocation: null, requesterHash: 'test-request', liveTokenHash: hash };
const saved = store.localSave(input);
const inspection = new Database(process.env.REPORTS_DATABASE_PATH);
assert.equal(store.localReports()[0].latitude, 0);
assert.equal(store.localReports()[0].accuracy, 0);
assert(!('live_token_hash' in store.localReports()[0]));
assert(!('requester_hash' in store.localReports()[0]));
assert.throws(() => store.localUpdate(saved.reportId, 'wrong', null), /invalid_session/);
assert.throws(() => store.localUpdate(saved.reportId, hash, { latitude: 1, longitude: 2, accuracy: 3 }), /update_rate/);
inspection.prepare("UPDATE recovery_reports SET updated_at = '2000-01-01T00:00:00.000Z' WHERE id = ?").run(saved.reportId);
store.localUpdate(saved.reportId, hash, { latitude: 1, longitude: 2, accuracy: 3 });
assert.equal(store.localReports()[0].longitude, 2);
store.localUpdate(saved.reportId, hash, null);
store.localUpdate(saved.reportId, hash, null); // Stop is idempotent.
assert.throws(() => store.localUpdate(saved.reportId, hash, { latitude: 4, longitude: 5, accuracy: 0 }), /session_expired/);
const expired = store.localSave({ ...input, requesterHash: 'expiry-test' });
inspection.prepare("UPDATE recovery_reports SET live_expires_at = '2000-01-01T00:00:00.000Z' WHERE id = ?").run(expired.reportId);
assert.throws(() => store.localUpdate(expired.reportId, hash, { latitude: 4, longitude: 5, accuracy: 0 }), /session_expired/);
const manual = store.localSave({ ...input, requesterHash: 'manual-test', latitude: null, longitude: null, accuracy: null, manualLocation: 'Test reception', liveTokenHash: undefined });
assert.equal(manual.expiresAt, null);
for (let i = 0; i < 5; i++) store.localSave(input);
assert.throws(() => store.localSave(input), /rate_limit/);
assert.throws(() => store.localSave({ ...input, tagCode: 'UNKNOWN' }), /invalid_tag/);
inspection.close();
// The isolated database stays in the OS temp directory; no user database is touched.
console.log('PASS: GPS validation, zero coordinates, durable SQLite saves, token privacy, unauthorized writes, throttling, stop, expiry, manual fallback, report rate limit');
