const assert = require('node:assert/strict');
const path = require('node:path');
const Database = require('better-sqlite3');
require('@next/env').loadEnvConfig(path.resolve(__dirname, '..'));
const origin = process.env.LOCATION_TEST_ORIGIN || 'http://localhost:3100';
if (!/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) throw new Error('Run this synthetic test only against a local server');
if (process.env.REPORT_STORAGE !== 'sqlite') throw new Error('HTTP test requires the local SQLite backend');
const ids = [];
async function call(url, method = 'GET', body, headers = {}) {
  return fetch(`${origin}${url}`, { method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(15000) });
}
(async () => {
  assert.equal((await call('/s/DEMO001')).status, 200);
  assert.equal((await call('/api/reports')).status, 401);
  const base = { tagCode: 'DEMO001', message: 'Synthetic HTTP location test', latitude: 0, longitude: 0, accuracy: 0, live: true };
  assert.equal((await call('/api/reports', 'POST', { ...base, latitude: 95 })).status, 400);
  assert.equal((await call('/api/reports', 'POST', { ...base, longitude: null })).status, 400);
  assert.equal((await call('/api/reports', 'POST', { ...base, website: 'bot.example' })).status, 400);
  assert.equal((await call('/api/reports', 'POST', { ...base, latitude: null, longitude: null })).status, 400);
  assert.equal((await call('/api/reports', 'POST', { ...base, latitude: null, longitude: null, manualLocation: 'Test reception' })).status, 400);
  assert.equal((await call('/api/reports', 'POST', { ...base, finderContact: 'x'.repeat(121) })).status, 400);
  assert.equal((await call('/api/reports', 'POST', base, { 'Content-Type': 'text/plain' })).status, 415);
  assert.equal((await call('/api/reports', 'POST', { ...base, message: 'x'.repeat(11000) })).status, 413);
  assert.equal((await call('/api/reports', 'POST', base, { Origin: 'https://untrusted.example' })).status, 403);
  const res = await call('/api/reports', 'POST', base);
  assert.equal(res.status, 201);
  const saved = await res.json(); ids.push(saved.reportId);
  assert.match(saved.liveToken, /^[a-f0-9]{64}$/);
  const endpoint = `/api/reports/${saved.reportId}/location`;
  const authorization = { Authorization: `Bearer ${saved.liveToken}` };
  assert.equal((await call(endpoint, 'PATCH', { latitude: 1, longitude: 2 })).status, 401);
  assert.equal((await call(endpoint, 'PATCH', { latitude: 1, longitude: 2 }, { Authorization: `Bearer ${'a'.repeat(64)}` })).status, 401);
  assert.equal((await call(endpoint, 'PATCH', { latitude: -91, longitude: 2 }, authorization)).status, 400);
  assert.equal((await call(endpoint, 'PATCH', { latitude: 1, longitude: 2 }, authorization)).status, 429);
  await new Promise(resolve => setTimeout(resolve, 3200));
  assert.equal((await call(endpoint, 'PATCH', { latitude: 1, longitude: 2, accuracy: 5 }, authorization)).status, 200);
  const login = await call('/api/owner-session', 'POST', { passcode: process.env.DEMO_OWNER_PASSCODE });
  assert.equal(login.status, 200);
  const cookie = login.headers.get('set-cookie').split(';')[0];
  const owner = await call('/api/reports', 'GET', undefined, { Cookie: cookie });
  assert.equal(owner.status, 200);
  const report = (await owner.json()).reports.find(r => r.id === saved.reportId);
  assert.equal(report.latitude, 1); assert.equal(report.longitude, 2);
  assert(!('live_token_hash' in report)); assert(!('liveToken' in report));
  assert.equal((await call(endpoint, 'DELETE', undefined, authorization)).status, 200);
  assert.equal((await call(endpoint, 'DELETE', undefined, authorization)).status, 200);
  assert.equal((await call(endpoint, 'PATCH', { latitude: 3, longitude: 4 }, authorization)).status, 410);
  const manual = await call('/api/reports', 'POST', { tagCode: 'DEMO001', message: 'Synthetic manual pickup test', manualLocation: 'Test reception' });
  assert.equal(manual.status, 201); ids.push((await manual.json()).reportId);
  console.log('PASS: scanner HTTP, owner authentication, validation, origin protection, live save/update/read, capability isolation, rate limit, stop, manual pickup');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => {
  if (ids.length) {
    const db = new Database(path.resolve(__dirname, '..', process.env.REPORTS_DATABASE_PATH || './data/recovery.db'));
    for (const id of ids) db.prepare('DELETE FROM recovery_reports WHERE id = ? AND message LIKE ?').run(id, 'Synthetic%');
    db.close();
  }
});
