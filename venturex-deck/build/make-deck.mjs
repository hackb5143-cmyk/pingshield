import fs from 'node:fs/promises';
import {PresentationFile,FileBlob} from 'file:///C:/Program%20Files/WindowsApps/OpenAI.CodexPrimaryRuntime.v26-1112-737-0_26.1112.737.0_x64__3k8sg7r9htsxt/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs';
const root='E:/ANTIGRAVITY WEBSITE/venturex-deck';
const p=await PresentationFile.importPptx(await FileBlob.load('C:/Users/hp/Downloads/Slide Deck R3 VENTUREX.pptx'));
const records=(await p.inspect({kind:'textbox',maxChars:30000})).ndjson.split('\n').filter(Boolean).map(x=>JSON.parse(x));
for(const record of records){if(record.text==='YOUR TEAM NAME/LOGO'){const s=p.resolve(record.id);s.text='PEAKY BLINDERS';s.text.style={fontSize:36,fontFamily:'Roboto Bold',bold:true,color:'#FFFFFF'};}}
const cover=p.resolve(records.find(x=>x.slideIndex===0).id);cover.text='PROBLEM: PRIVATE LOST-ITEM RECOVERY\nTEAM: PEAKY BLINDERS\nTEAM LEADER: PARTH SHARMA\nINSTITUTION: PEC\nTHEME: SMART SAFETY & DIGITAL TRUST';cover.text.style={fontSize:40,fontFamily:'Poppins Bold',bold:true,color:'#000000'};
function text(slide,value,x,y,w,h,size=34,color='#FFFFFF',bold=false){const s=slide.shapes.add({geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});s.text=value;s.text.style={fontFamily:'Calibri',fontSize:size,color,bold};s.text.insets=0;return s;}
function block(slide,heading,body,x,y,w=690){text(slide,heading,x,y,w,50,36,'#67D0A9',true);text(slide,body,x,y+58,w,122,33);}
const s2=p.slides.items[1];p.resolve(records.find(x=>x.text==='IDEA TITLE').id).text='PINGSHIELD';
text(s2,'QR-based recovery with private owner contact',210,350,1400,60,42,'#67D0A9',true);
block(s2,'The problem','A finder may want to return an item, but a public phone-number label exposes its owner.',210,450,1050);
block(s2,'The idea','A QR tag opens a browser page for private messages, owner email alerts and optional location sharing.',210,640,1050);
const qr=await fs.readFile('E:/ANTIGRAVITY WEBSITE/pingshield-hosted/public/PingShield-DEMO001-QR.png');s2.images.add({blob:qr.buffer.slice(qr.byteOffset,qr.byteOffset+qr.byteLength),contentType:'image/png',position:{left:1390,top:440,width:310,height:310},fit:'contain',alt:'Scan to open PingShield DEMO001'});
text(s2,'SCAN THE LIVE DEMO\nTag: DEMO001',1320,775,450,90,30,'#67D0A9',true);
const s3=p.slides.items[2];
block(s3,'Finder experience','QR scan opens the public React interface. No app download or finder account is required.',230,385);
block(s3,'Private messages and email','Chat refreshes every 4 seconds. An activated FormSubmit form sends owner email alerts.',230,585);
block(s3,'Location with consent','Leaflet and OpenStreetMap display GPS pins. Optional live sharing updates every 5 seconds.',230,785);
block(s3,'Hosted backend','Vinext runs on Cloudflare Workers. D1 persists messages, location reports and session status.',1030,385);
block(s3,'Access controls','A signed owner session protects the inbox. Each finder conversation uses a random access token.',1030,585);
block(s3,'Sharing limits','Live GPS expires after 30 minutes. Finder chat access lasts 24 hours. Email alerts have rate limits.',1030,785);
const s4=p.slides.items[3];
block(s4,'Working prototype','Public HTTPS demo, QR entry, private two-way chat, owner inbox and cloud data storage.',230,380);
block(s4,'Email verification','The owner confirmed receiving an email submitted from the live website.',230,580);
block(s4,'Proposed business model','Sell printed QR tags and offer optional campus or organisation plans. Pricing needs pilot validation.',230,780);
block(s4,'Operational constraints','GPS needs permission and an active browser. Email depends on a third-party service and its limits.',1030,380);
block(s4,'Calling readiness','The jambonz adapter is prepared. Real phone calls and SMS need a carrier account and service number.',1030,580);
block(s4,'Next release','Add individual owner accounts, tag registration and an authorised campus pilot. Current demo uses one owner.',1030,780);
const s5=p.slides.items[4];
block(s5,'For item owners','Receive recovery messages without printing a personal phone number on belongings.',230,385);
block(s5,'For finders','Report a found item from a phone camera and browser, with an optional pickup landmark or GPS pin.',230,585);
block(s5,'For campus teams','Proposed pilot with a PEC lost-and-found desk, followed by review of verified return outcomes.',230,785);
block(s5,'Expected benefits','Less friction in contacting the owner and clearer pickup coordination. These are pilot hypotheses.',1030,385);
block(s5,'Pilot measures','Track completed returns, response time, notification failures and participant feedback.',1030,585);
block(s5,'Evidence boundary','The technical demo works. Recovery-rate improvements and adoption figures remain unmeasured.',1030,785);
const s6=p.slides.items[5];
const refs=[['Project prototype','pingshield-location-beacon.sunlitbeech14.chatgpt.site/s/DEMO001'],['Leaflet documentation','leafletjs.com/reference.html'],['Cloudflare D1 documentation','developers.cloudflare.com/d1/'],['FormSubmit AJAX documentation','formsubmit.co/ajax-documentation'],['jambonz dial documentation','docs.jambonz.org/verbs/verbs/dial']];
for(let i=0;i<refs.length;i++){text(s6,refs[i][0],240,370+i*111,1450,43,35,'#67D0A9',true);const sh=text(s6,refs[i][1],240,414+i*111,1450,42,29);sh.hyperlink={uri:'https://'+refs[i][1],isExternal:true};}
for(const slide of p.slides.items)slide.speakerNotes.text='Project: PingShield. Team: PEAKY BLINDERS. Team leader: PARTH SHARMA. Institution: PEC. Status reflects the implemented demo discussed in this project. No commercial adoption, return-rate improvement or revenue figures have been claimed.';
p.slides.items[2].speakerNotes.text+=' Sources: https://leafletjs.com/reference.html ; https://developers.cloudflare.com/d1/ ; https://formsubmit.co/ajax-documentation . Implementation: pingshield-hosted source and EMAIL_SETUP.md.';
p.slides.items[3].speakerNotes.text+=' Calling reference: https://docs.jambonz.org/verbs/verbs/dial . Calling is an unactivated integration. Email receipt was confirmed by the owner in the project conversation. Pricing and pilot are proposals.';
p.slides.items[5].speakerNotes.text+=' References accessed 14 November 2026. The linked live QR demo is DEMO001. Public documentation describes the selected components; prototype capabilities come from the project implementation and tests.';
for(let i=0;i<6;i++){await fs.writeFile(root+`/build/after-${i+1}.png`,new Uint8Array(await(await p.export({slide:p.slides.items[i],format:'png',scale:.7})).arrayBuffer()));}
await(await PresentationFile.exportPptx(p)).save(root+'/build/candidate.pptx');
const {finalizePresentation}=await import('file:///C:/Users/hp/.codex/plugins/cache/openai-primary-runtime/presentations/26.1112.11217/skills/presentations/container_tools/artifact_tool_utils.mjs');
const skill='C:/Users/hp/.codex/plugins/cache/openai-primary-runtime/presentations/26.1112.11217/skills/presentations';
const result=await finalizePresentation({workspaceDir:root,candidatePath:root+'/build/candidate.pptx',finalPath:root+'/output/PingShield_PEAKY_BLINDERS_VENTUREX.pptx',pythonExecutable:'C:/Program Files/WindowsApps/OpenAI.CodexPrimaryRuntime.v26-1112-737-0_26.1112.737.0_x64__3k8sg7r9htsxt/dependencies/python/python.exe',integrityValidatorPath:skill+'/container_tools/inspect_presentation_package_integrity.py',layoutValidatorPath:skill+'/container_tools/inspect_presentation_layout_geometry.py',layoutArgs:['--expected-slide-size-emu','18288000,10287000','--validate-heading-fit'],explicitTotalSlideCount:6,verifyArtifactToolImport:true,receiptPath:root+'/build/validation.json'});console.log(result);

