import fs from 'node:fs/promises';
import {PresentationFile,FileBlob} from 'file:///C:/Program%20Files/WindowsApps/OpenAI.CodexPrimaryRuntime.v26-1112-737-0_26.1112.737.0_x64__3k8sg7r9htsxt/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs';
const p=await PresentationFile.importPptx(await FileBlob.load('C:/Users/hp/Downloads/Slide Deck R3 VENTUREX.pptx'));
await fs.writeFile('inspect.txt',(await p.inspect({kind:'slide,textbox,shape,layout',maxChars:30000})).ndjson);
for(let i=0;i<p.slides.items.length;i++){await fs.writeFile(`before-${i+1}.png`,new Uint8Array(await (await p.export({slide:p.slides.items[i],format:'png',scale:.6})).arrayBuffer()));}
console.log('Imported',p.slides.items.length); console.log((await fs.readFile('inspect.txt','utf8')).slice(0,16000));
