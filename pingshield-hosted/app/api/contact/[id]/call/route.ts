import { NextRequest } from 'next/server';
import { isOwner } from '@/lib/owner-session';
import { sameOrigin,json,validId } from '@/lib/contact-http';
import { approveMaskedCall } from '@/lib/telephony';
import { callingReady } from '@/lib/telephony';
import { getContact,contactDb,encryptCallback } from '@/lib/contact-store';
import { bodyJSON,finderToken,contactError } from '@/lib/contact-http';
import { z } from 'zod';
export async function PUT(req:NextRequest,{params}:{params:Promise<{id:string}>}) {
  if(!sameOrigin(req))return json({error:'Invalid origin'},403);
  const {id}=await params;if(!validId(id)||!finderToken(req))return json({error:'Unauthorized'},401);
  try{
    await getContact(id,finderToken(req));
    if(!callingReady())return json({error:'Phone calling is not activated. Private messages still work.'},503);
    const parsed=z.object({phone:z.string().regex(/^\+[1-9]\d{7,14}$/),callbackConsent:z.literal(true)}).safeParse(await bodyJSON(req));
    if(!parsed.success)return json({error:'Enter your phone in international format and agree to the callback.'},400);
    const number=parsed.data.phone;
    const result=await contactDb().prepare("UPDATE contact_threads SET callback_ciphertext=?,callback_hint=?,call_status='requested' WHERE id=? AND call_status='not_requested'")
      .bind(encryptCallback(number),`•••• ${number.slice(-4)}`,id).run();
    if(!result.meta.changes)return json({error:'This conversation already has a call request.'},409);
    return json({ok:true});
  }catch(error){return contactError(error);}
}
export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}) {
  if(!sameOrigin(req))return json({error:'Invalid origin'},403);
  if(!await isOwner())return json({error:'Unauthorized'},401);
  const {id}=await params;if(!validId(id))return json({error:'Invalid request'},400);
  try{return json(await approveMaskedCall(id,req.nextUrl.origin),202);}catch(error){
    const reason=error instanceof Error?error.message:'';
    return json({error:reason==='calling_unavailable'?'Phone calling is not activated.':reason==='call_busy'?'A call is already active or awaiting provider confirmation.':reason==='call_unknown'?'Call status is uncertain. Check the calling provider before retrying.':'Could not start the call. Check the calling account.'},reason==='calling_unavailable'?503:409);
  }
}
