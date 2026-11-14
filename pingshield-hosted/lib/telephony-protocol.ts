export type PhoneConfig = { apiBase: string; accountSid: string; apiKey: string; proxyNumber: string; ownerNumber: string };
export const phonePattern = /^\+[1-9]\d{7,14}$/;
export function validPhoneConfig(config: PhoneConfig) {
  try {
    const url=new URL(config.apiBase);
    return url.protocol==='https:'&&!url.username&&!url.password&&!url.search&&!url.hash
      && /^[a-f0-9-]{36}$/i.test(config.accountSid)&&config.apiKey.length>=8
      &&phonePattern.test(config.proxyNumber)&&phonePattern.test(config.ownerNumber)&&config.proxyNumber!==config.ownerNumber;
  } catch { return false; }
}
export function maskedCallRequest(config: PhoneConfig,caller: string,origin: string,id: string,password: string) {
  if (!validPhoneConfig(config)||!phonePattern.test(caller)||caller===config.ownerNumber||caller===config.proxyNumber) throw new Error('invalid_call');
  const credentials={method:'POST',username:'pingshield',password};
  return { url:`${config.apiBase.replace(/\/$/,'')}/v1/Accounts/${config.accountSid}/Calls`,
    payload:{from:config.proxyNumber,to:{type:'phone',number:caller},timeout:30,timeLimit:180,
      call_hook:{...credentials,url:`${origin}/api/telephony/${id}/answer`},
      call_status_hook:{...credentials,url:`${origin}/api/telephony/${id}/status`}},
  };
}
export function maskedDial(config: PhoneConfig) {
  return [{verb:'dial',callerId:config.proxyNumber,timeout:25,timeLimit:180,target:[{type:'phone',number:config.ownerNumber}]}];
}
