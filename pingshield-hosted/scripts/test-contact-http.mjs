import assert from 'node:assert/strict';
import fs from 'node:fs';
const origin=process.env.CONTACT_TEST_ORIGIN||'http://127.0.0.1:3101';
if(!/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin))throw new Error('This synthetic write test is local only.');
const passcode=fs.readFileSync('.dev.vars','utf8').match(/^DEMO_OWNER_PASSCODE=(.+)$/m)[1].trim();
async function request(route,method='GET',body,headers={}){return fetch(origin+route,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...headers},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(20000)});}
let id,cookie;
try {
  const config=await (await request('/api/contact/config')).json();assert.equal(config.callingEnabled,false);assert.equal(config.messagingEnabled,true);
  assert.equal((await request('/api/contact')).status,401);
  assert.equal((await request('/api/contact','POST',{tagCode:'DEMO001',message:'Test'},{Origin:'https://untrusted.example'})).status,403);
  assert.equal((await request('/api/contact','POST',{tagCode:'DEMO001',message:'x'})).status,400);
  assert.equal((await request('/api/contact','POST',{tagCode:'DEMO001',message:'Synthetic callback',phone:'+12025550133',callbackConsent:true})).status,503);
  const create=await request('/api/contact','POST',{tagCode:'DEMO001',message:'Synthetic chat: no location or phone required'});
  assert.equal(create.status,201,await create.clone().text());const session=await create.json();id=session.id;
  const auth={Authorization:'Bearer '+session.token};
  assert.equal((await request(`/api/contact/${id}`)).status,401);
  assert.equal((await request(`/api/contact/${id}`,'GET',undefined,{Authorization:'Bearer '+'a'.repeat(64)})).status,401);
  const first=await (await request(`/api/contact/${id}`,'GET',undefined,auth)).json();assert.equal(first.messages[0].sender,'finder');
  assert.equal(first.messages[0].email_status,'disabled');
  assert(!('token_hash' in first.thread));assert(!('requester_hash' in first.thread));assert(!('callback_ciphertext' in first.thread));
  const login=await request('/api/owner-session','POST',{passcode});assert.equal(login.status,200);cookie=login.headers.get('set-cookie').split(';')[0];
  const owner={Cookie:cookie};const list=await (await request('/api/contact','GET',undefined,owner)).json();assert(list.threads.some(t=>t.id===id));
  assert.equal((await request(`/api/contact/${id}/email`,'POST',{messageId:first.messages[0].id},auth)).status,401);
  assert.equal((await request(`/api/contact/${id}/email-result`,'POST',{messageId:first.messages[0].id,status:'accepted'})).status,401);
  assert.equal((await request(`/api/contact/${id}/email-result`,'POST',{messageId:first.messages[0].id,status:'accepted'},auth)).status,409);
  const retry=await request(`/api/contact/${id}/email`,'POST',{messageId:first.messages[0].id},owner);assert.equal(retry.status,200);assert.equal((await retry.json()).emailStatus,'disabled');
  assert.equal((await request(`/api/contact/${id}`,'POST',{message:'Synthetic owner reply'},owner)).status,201);
  assert.equal((await request(`/api/contact/${id}`,'POST',{message:'too fast'},owner)).status,429);
  const replied=await (await request(`/api/contact/${id}`,'GET',undefined,auth)).json();assert.equal(replied.messages[1].sender,'owner');assert.equal(replied.messages[1].content,'Synthetic owner reply');
  assert.equal((await request(`/api/contact/${id}/call`,'POST')).status,401);
  assert.equal((await request(`/api/contact/${id}/call`,'POST',undefined,owner)).status,503);
  assert.equal((await request(`/api/contact/${id}/call`,'PUT',{phone:'+12025550133',callbackConsent:true},auth)).status,503);
  assert.equal((await request(`/api/telephony/${id}/answer`,'POST',{call_sid:'synthetic'})).status,401);
  assert.equal((await request(`/api/contact/${id}`,'DELETE',undefined,auth)).status,401);
  await new Promise(resolve=>setTimeout(resolve,2100));
  assert.equal((await request(`/api/contact/${id}`,'POST',{message:'Synthetic finder reply',sender:'owner'},auth)).status,201);
  const final=await (await request(`/api/contact/${id}`,'GET',undefined,auth)).json();assert.equal(final.messages[2].sender,'finder');
  console.log('PASS: private two-way chat without GPS/phone, capability isolation, owner-only inbox, sender roles, message throttling, unavailable-call honesty, and authenticated provider hooks.');
}finally{
  if(id&&cookie){const deleted=await request(`/api/contact/${id}`,'DELETE',undefined,{Cookie:cookie});assert.equal(deleted.status,200);assert.equal((await request(`/api/contact/${id}`)).status,401);}
}
