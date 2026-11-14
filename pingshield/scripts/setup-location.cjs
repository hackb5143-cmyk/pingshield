const fs = require('node:fs');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const filename = path.join(__dirname, '..', '.env.local');
const content = fs.existsSync(filename) ? fs.readFileSync(filename, 'utf8') : '';
const additions = [];
for (const [key, value] of Object.entries({
  REPORT_STORAGE: 'sqlite', DEMO_OWNER_PASSCODE: randomBytes(12).toString('hex'),
  OWNER_SESSION_SECRET: randomBytes(32).toString('hex'), REPORT_HASH_SECRET: randomBytes(32).toString('hex'),
})) {
  if (key === 'REPORT_STORAGE' && /^(NEXT_PUBLIC_SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY)=.+/m.test(content)) continue;
  if (!new RegExp(`^${key}=`, 'm').test(content)) additions.push(`${key}=${value}`);
}
if (additions.length) fs.appendFileSync(filename, `\n# Recovery location backend\n${additions.join('\n')}\n`);
console.log('Location configuration prepared. Owner passcode is in .env.local (DEMO_OWNER_PASSCODE). Existing values were preserved.');
