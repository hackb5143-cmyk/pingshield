import { NextRequest } from 'next/server';
import { json,validId,bodyJSON } from '@/lib/contact-http';
import { validHook,answerMaskedCall,callStatus } from '@/lib/telephony';
export async function POST(req:NextRequest,{params}:{params:Promise<{id:string;action:string}>}) {
  const {id,action}=await params;
  if(!validId(id)||!['answer','status'].includes(action)||!validHook(id,req.headers.get('authorization')))return json({error:'Unauthorized'},401);
  try {
    const body=await bodyJSON(req) as {call_sid?:unknown;call_status?:unknown};
    if(typeof body.call_sid!=='string'||body.call_sid.length>80)return json({error:'Invalid callback'},400);
    if(action==='answer')return json(await answerMaskedCall(id,body.call_sid));
    if(typeof body.call_status==='string')await callStatus(id,body.call_sid,body.call_status);
    return json({ok:true});
  }catch{return json({error:'Could not process callback'},400);}
}
