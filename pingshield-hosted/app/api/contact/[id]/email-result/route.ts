import { NextRequest } from 'next/server';
import { z } from 'zod';
import { isOwner } from '@/lib/owner-session';
import { json,sameOrigin,bodyJSON,validId,finderToken,contactError } from '@/lib/contact-http';
import { contactDb,getContact } from '@/lib/contact-store';
export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}){
  if(!sameOrigin(req))return json({error:'Invalid origin'},403);
  try{
    const {id}=await params;if(!validId(id))return json({error:'Unauthorized'},401);
    const token=finderToken(req);if(req.headers.has('authorization')&&!token)return json({error:'Unauthorized'},401);
    await getContact(id,token,!token&&await isOwner());
    const parsed=z.object({messageId:z.string().uuid(),status:z.enum(['accepted','activation_required','failed','unknown','rate_limited'])}).safeParse(await bodyJSON(req));
    if(!parsed.success)return json({error:'Invalid email result'},400);
    // A browser report is deliberately distinguished from server-verified provider acceptance.
    const status=parsed.data.status==='accepted'?'browser_accepted':parsed.data.status;
    const saved=await contactDb().prepare("UPDATE contact_messages SET email_status=? WHERE id=? AND thread_id=? AND sender='finder' AND email_status='sending' AND email_attempted_at>?")
      .bind(status,parsed.data.messageId,id,new Date(Date.now()-120000).toISOString()).run();
    if(!saved.meta.changes)return json({error:'No pending email submission'},409);
    return json({ok:true,emailStatus:status});
  }catch(error){return contactError(error);}
}
