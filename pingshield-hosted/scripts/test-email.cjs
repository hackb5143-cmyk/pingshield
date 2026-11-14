const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const assert=require('node:assert/strict');
const runtime={};const cache=new Map();
function load(relative){
 const filename=path.resolve(__dirname,'..',relative);if(cache.has(filename))return cache.get(filename).exports;
 const module={exports:{}};cache.set(filename,module);
 const code=ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 const imports=name=>name==='cloudflare:workers'?{env:runtime}:name.startsWith('.')?load(path.relative(path.resolve(__dirname,'..'),path.resolve(path.dirname(filename),name+'.ts'))):require(name);
 new Function('require','module','exports',code)(imports,module,module.exports);return module.exports;
}
(async()=>{
 const protocol=load('lib/email-protocol.ts');const notifications=load('lib/email-notifications.ts');
 const response=(success,message='',status=200)=>new Response(JSON.stringify({success,message}),{status});
 assert(!protocol.validRecipient('owner@example.com\nBcc: other@example.com'));
 assert.equal(await protocol.submitOwnerEmail('invalid','id','test',async()=>{throw new Error('must not call');}),'disabled');
 let captured;
 assert.equal(await protocol.submitOwnerEmail('owner@example.com','private-thread-id','A recovered item',async(url,init)=>{captured={url,body:JSON.parse(init.body)};return response('true');}),'accepted');
 assert.equal(captured.url,'https://formsubmit.co/ajax/owner%40example.com');
 assert.equal(captured.body.owner_inbox,protocol.publicSiteOrigin+'/owner');
 assert(!('email' in captured.body));assert(!('_replyto' in captured.body));assert(!JSON.stringify(captured.body).includes('owner@example.com'));
 assert.equal(await protocol.submitOwnerEmail('owner@example.com','id','test',async()=>response('false','Rejected')),'failed');
 assert.equal(await protocol.submitOwnerEmail('owner@example.com','id','test',async()=>response('false','This form needs Activation')),'activation_required');
 assert.equal(await protocol.submitOwnerEmail('owner@example.com','id','test',async()=>response(true)),'accepted');
 assert.equal(await protocol.submitOwnerEmail('owner@example.com','id','test',async()=>new Response('<html>Error</html>',{status:403})),'failed');
 assert.equal(await protocol.submitOwnerEmail('owner@example.com','id','test',async()=>response(false,'temporary error',503)),'unknown');
 assert.equal(await protocol.submitOwnerEmail('owner@example.com','id','test',async()=>{throw new Error('timeout');}),'unknown');
 let state='not_requested',attempt=null,sender='finder',blocked=false,calls=0;
 runtime.DB={prepare(sql){return{bind(...values){return{
   async first(){return sql.includes('SELECT content')?{content:'Synthetic email text',sender,email_status:state}:{email_status:state};},
   async run(){let changes=1;
     if(sql.includes("SET email_status='sending'")){if(blocked||['accepted','sending','unknown'].includes(state))changes=0;else{state='sending';attempt=values[0];}}
     else if(sql.includes("SET email_status='disabled'")){if(state==='not_requested')state='disabled';}
     else if(sql.includes("SET email_status='rate_limited'"))state='rate_limited';
     else if(sql.includes('SET email_status=?')){if(state==='sending'&&attempt===values[2])state=values[0];}
     return{meta:{changes}};
   }
 };}};}};
 const originalFetch=global.fetch;
 try{
  global.fetch=async()=>{calls++;return response('true');};
  assert.equal(await notifications.notifyOwner('thread','message'),'disabled');assert.equal(calls,0);
  runtime.EMAIL_PROVIDER='formsubmit';runtime.OWNER_NOTIFICATION_EMAIL='owner@example.com';state='not_requested';
  assert.equal(await notifications.notifyOwner('thread','message'),'accepted');assert.equal(calls,1);
  assert.equal(await notifications.notifyOwner('thread','message',true),'accepted');assert.equal(calls,1);
  state='not_requested';blocked=true;assert.equal(await notifications.notifyOwner('thread','message'),'rate_limited');assert.equal(calls,1);
  state='not_requested';blocked=false;global.fetch=async()=>{calls++;throw new Error('timeout');};
  assert.equal(await notifications.notifyOwner('thread','message'),'unknown');assert.equal(state,'unknown');
  const before=calls;assert.equal(await notifications.notifyOwner('thread','message',true),'unknown');assert.equal(calls,before);
  sender='owner';assert.equal(await notifications.notifyOwner('thread','message'),'not_requested');assert.equal(calls,before);
  // Execute the production quota/claim SQL against a real SQLite engine, not just a transport mock.
  const {DatabaseSync}=require('node:sqlite');const sqlite=new DatabaseSync(':memory:');
  for(const filename of fs.readdirSync(path.resolve(__dirname,'../drizzle')).filter(name=>/^\d+_.+\.sql$/.test(name)).sort())sqlite.exec(fs.readFileSync(path.resolve(__dirname,'../drizzle',filename),'utf8'));
  runtime.DB={prepare(sql){return{bind(...values){return{async first(){return sqlite.prepare(sql).get(...values)||null;},async run(){const result=sqlite.prepare(sql).run(...values);return{meta:{changes:Number(result.changes)}};}};}};}};
  const now=new Date().toISOString();
  function thread(id){sqlite.prepare('INSERT INTO contact_threads(id,tag_code,token_hash,requester_hash,created_at,updated_at,expires_at) VALUES(?,?,?,?,?,?,?)').run(id,'DEMO001','test-hash','source',now,now,new Date(Date.now()+3600000).toISOString());}
  function message(id,threadId,seq){sqlite.prepare('INSERT INTO contact_messages(id,thread_id,sender,content,created_at,sequence) VALUES(?,?,?,?,?,?)').run(id,threadId,'finder','SQLite email test',now,seq);}
  thread('sql-thread');message('sql-first','sql-thread',1);message('sql-second','sql-thread',2);
  global.fetch=async()=>{calls++;return response('true');};
  const initialCalls=calls;
  assert.equal(await notifications.notifyOwner('sql-thread','sql-first'),'accepted');
  assert.equal(await notifications.notifyOwner('sql-thread','sql-second'),'rate_limited');assert.equal(calls,initialCalls+1);
  assert.equal(sqlite.prepare('SELECT email_status FROM contact_messages WHERE id=?').get('sql-first').email_status,'accepted');
  sqlite.prepare('UPDATE contact_messages SET email_attempted_at=? WHERE id=?').run(new Date(Date.now()-61000).toISOString(),'sql-first');
  assert.equal(await notifications.notifyOwner('sql-thread','sql-second',true),'accepted');assert.equal(calls,initialCalls+2);
  thread('quota-thread');for(let i=0;i<20;i++){message('quota-'+i,'quota-thread',i+1);sqlite.prepare('UPDATE contact_messages SET email_attempted_at=? WHERE id=?').run(now,'quota-'+i);}
  thread('limited-thread');message('sql-limited','limited-thread',1);
  assert.equal(await notifications.notifyOwner('limited-thread','sql-limited'),'rate_limited');assert.equal(calls,initialCalls+2);
  sqlite.exec('DELETE FROM contact_messages; DELETE FROM contact_threads;');thread('browser-thread');message('browser-message','browser-thread',1);
  runtime.EMAIL_PROVIDER='formsubmit-browser';runtime.FORM_SUBMIT_FORM_ID='a'.repeat(32);
  const dispatch=await notifications.prepareOwnerEmail('browser-thread','browser-message');
  assert.equal(dispatch.status,'sending');assert.equal(dispatch.emailDispatch.endpoint,'https://formsubmit.co/ajax/'+'a'.repeat(32));
  assert(!JSON.stringify(dispatch).includes('owner@example.com'));assert.equal(calls,initialCalls+2);
  const client=load('lib/client-email.ts');let receipt;
  global.fetch=async(url,options)=>{if(url.startsWith('https://formsubmit.co/'))return response('true');receipt=JSON.parse(options.body);return response(true);};
  assert.equal(await client.deliverBrowserEmail(dispatch.emailDispatch,'finder-test-token'),'browser_accepted');assert.equal(receipt.status,'accepted');
  global.fetch=async(url,options)=>{if(url.startsWith('https://formsubmit.co/'))return new Response('Rate limit exceeded',{status:429});receipt=JSON.parse(options.body);return response(true);};
  assert.equal(await client.deliverBrowserEmail(dispatch.emailDispatch,'finder-test-token'),'rate_limited');assert.equal(receipt.status,'rate_limited');
  assert.equal(await client.deliverBrowserEmail({...dispatch.emailDispatch,endpoint:'https://untrusted.example/post'}),'failed');sqlite.close();
 }finally{global.fetch=originalFetch;}
 console.log('PASS: real success parsing, activation/failure/timeout states, fixed recipient privacy, disabled transport, atomic claim, rate limiting, no duplicate retry, and no mail for owner replies.');
})().catch(error=>{console.error(error);process.exitCode=1;});
