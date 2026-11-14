const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const assert=require('node:assert/strict');
const {createHmac}=require('node:crypto');
const cache=new Map();
const runtime={OWNER_SESSION_SECRET:'test-only-long-session-secret-0123456789',REPORT_HASH_SECRET:'test-only-report-salt',JAMBONZ_API_BASE:'https://calling.example.test',JAMBONZ_ACCOUNT_SID:'00000000-0000-4000-8000-000000000001',JAMBONZ_API_KEY:'test-only-provider-key',MASKED_CALL_NUMBER:'+12025550111',OWNER_PHONE_NUMBER:'+12025550122'};
function load(relative){
 const filename=path.resolve(__dirname,'..',relative);if(cache.has(filename))return cache.get(filename).exports;
 const module={exports:{}};cache.set(filename,module);
 const code=ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 const imports=name=>name==='cloudflare:workers'?{env:runtime}:name.startsWith('.')?load(path.relative(path.resolve(__dirname,'..'),path.resolve(path.dirname(filename),name+'.ts'))):require(name);
 new Function('require','module','exports',code)(imports,module,module.exports);return module.exports;
}
(async()=>{
 const protocol=load('lib/telephony-protocol.ts');const store=load('lib/contact-store.ts');const phone=load('lib/telephony.ts');
 const config=phone.phoneConfig();assert(phone.callingReady());
 assert(!protocol.validPhoneConfig({...config,apiBase:'http://calling.example.test'}));
 assert(!protocol.validPhoneConfig({...config,proxyNumber:config.ownerNumber}));
 const request=protocol.maskedCallRequest(config,'+12025550133','https://demo.example.test','00000000-0000-4000-8000-000000000002','test-hook');
 assert.equal(request.payload.from,config.proxyNumber);assert.equal(request.payload.to.number,'+12025550133');
 assert(!JSON.stringify(request.payload).includes(config.ownerNumber));assert.equal(request.payload.timeLimit,180);
 assert.equal(protocol.maskedDial(config)[0].callerId,config.proxyNumber);
 assert.equal(protocol.maskedDial(config)[0].target[0].number,config.ownerNumber);
 assert.throws(()=>protocol.maskedCallRequest(config,config.ownerNumber,'https://demo.example.test','id','secret'),/invalid_call/);
 const encrypted=store.encryptCallback('+12025550133');assert(!encrypted.includes('12025550133'));assert.equal(store.decryptCallback(encrypted),'+12025550133');
 const parts=encrypted.split('.');parts[1]=Buffer.alloc(16).toString('base64url');assert.throws(()=>store.decryptCallback(parts.join('.')));
 const id='00000000-0000-4000-8000-000000000002';
 const password=createHmac('sha256',runtime.OWNER_SESSION_SECRET).update('phone-hook:'+id).digest('hex');
 assert(phone.validHook(id,'Basic '+Buffer.from('pingshield:'+password).toString('base64')));assert(!phone.validHook(id,'Basic wrong'));
 let status='requested',sid=null,fetches=0;
 runtime.DB={
   prepare(sql){
     return {
       bind(...values){
         return {
           async first(){if(sql.includes('callback_ciphertext'))return{callback_ciphertext:encrypted,expires_at:new Date(Date.now()+100000).toISOString()};return{call_sid:sid,call_status:status};},
           async run(){let changes=1;if(sql.includes("call_status='starting',updated_at")){changes=status==='requested'?1:0;if(changes)status='starting';}else if(sql.includes('CASE WHEN')){sid=values[0];if(status==='starting')status='queued';}else if(sql.includes("call_status='dispatch_unknown'"))status='dispatch_unknown';return{meta:{changes}};}
         };
       }
     };
   }
 };
 const originalFetch=global.fetch;
 try{
  global.fetch=async()=>{fetches++;return new Response(JSON.stringify({sid:'00000000-0000-4000-8000-000000000003'}),{status:201});};
  await phone.approveMaskedCall(id,'https://demo.example.test');assert.equal(status,'queued');assert.equal(fetches,1);
  await assert.rejects(phone.approveMaskedCall(id,'https://demo.example.test'),/call_busy/);assert.equal(fetches,1);
  status='requested';sid=null;global.fetch=async()=>{fetches++;throw new Error('timeout');};
  await assert.rejects(phone.approveMaskedCall(id,'https://demo.example.test'),/call_unknown/);assert.equal(status,'dispatch_unknown');
  delete runtime.JAMBONZ_API_KEY;assert(!phone.callingReady());
  await assert.rejects(phone.approveMaskedCall(id,'https://demo.example.test'),/calling_unavailable/);
 }finally{global.fetch=originalFetch;}
 console.log('PASS: masked caller IDs, encrypted callback, authenticated hooks, missing configuration, duplicate-call lock, and uncertain-dispatch handling. No real calls made.');
})().catch(error=>{console.error(error);process.exitCode=1;});
