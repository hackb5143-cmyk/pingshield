import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
const origin = 'http://127.0.0.1:3101';
const passcode = fs.readFileSync('.dev.vars','utf8').match(/^DEMO_OWNER_PASSCODE=(.+)$/m)[1].trim();
const ids=[];
async function request(route,method='GET',body,headers={}) {
  return fetch(origin+route,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...headers},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(20000)});
}
try {
  assert.equal((await request('/s/DEMO001')).status,200);
  assert.equal((await request('/api/reports')).status,401);
  const body={tagCode:'DEMO001',message:'Hosting smoke: synthetic location',latitude:0,longitude:0,accuracy:0,live:true};
  assert.equal((await request('/api/reports','POST',{...body,latitude:91})).status,400);
  assert.equal((await request('/api/reports','POST',body,{Origin:'https://untrusted.example'})).status,403);
  const created=await request('/api/reports','POST',body);
  assert.equal(created.status,201,await created.clone().text());
  const saved=await created.json(); ids.push(saved.reportId);
  const route=`/api/reports/${saved.reportId}/location`;
  const auth={Authorization:`Bearer ${saved.liveToken}`};
  assert.equal((await request(route,'PATCH',{latitude:1,longitude:2})).status,401);
  assert.equal((await request(route,'PATCH',{latitude:1,longitude:2},auth)).status,429);
  await new Promise(resolve=>setTimeout(resolve,3200));
  assert.equal((await request(route,'PATCH',{latitude:1,longitude:2,accuracy:5},auth)).status,200);
  const login=await request('/api/owner-session','POST',{passcode});
  assert.equal(login.status,200,await login.clone().text());
  const cookie=login.headers.get('set-cookie').split(';')[0];
  const read=await request('/api/reports','GET',undefined,{Cookie:cookie});
  assert.equal(read.status,200);
  const row=(await read.json()).reports.find(r=>r.id===saved.reportId);
  assert.equal(row.longitude,2); assert.equal(row.accuracy,5);
  assert(!('live_token_hash' in row)); assert(!('requester_hash' in row));
  assert.equal((await request(route,'DELETE',undefined,auth)).status,200);
  assert.equal((await request(route,'PATCH',{latitude:3,longitude:4},auth)).status,410);
  const manual=await request('/api/reports','POST',{tagCode:'DEMO001',message:'Hosting smoke: manual pickup',manualLocation:'Synthetic reception'});
  assert.equal(manual.status,201); ids.push((await manual.json()).reportId);
  console.log('PASS: Worker/D1 scanner, validation, consent-based live session, protected owner read, stop, and manual fallback.');
} finally {
  for(const id of ids) {
    assert.match(id,/^[a-f0-9-]{36}$/);
    const result=spawnSync(process.execPath,['--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--config','dist/server/wrangler.json','--persist-to','.wrangler/state','--command',`DELETE FROM recovery_reports WHERE id='${id}' AND message LIKE 'Hosting smoke:%'`],{encoding:'utf8'});
    if(result.status!==0) throw new Error('Could not clean up synthetic local test row');
  }
}
