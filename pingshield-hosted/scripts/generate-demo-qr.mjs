import QRCode from 'qrcode';
import fs from 'node:fs/promises';
const url='https://pingshield-location-beacon.sunlitbeech14.chatgpt.site/s/DEMO001';
const options={width:640,margin:4,errorCorrectionLevel:'H',color:{dark:'#111827',light:'#ffffff'}};
await fs.mkdir('public',{recursive:true});
await QRCode.toFile('public/PingShield-DEMO001-QR.png',url,options);
await fs.writeFile('public/PingShield-DEMO001-QR.svg',await QRCode.toString(url,{...options,type:'svg'}));
console.log('Generated QR for '+url);
