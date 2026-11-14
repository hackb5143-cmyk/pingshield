import { NextRequest } from 'next/server';
import { z } from 'zod';
import { isOwner } from '@/lib/owner-session';
import { json,sameOrigin,bodyJSON,validId,contactError } from '@/lib/contact-http';
import { getContact } from '@/lib/contact-store';
import { prepareOwnerEmail } from '@/lib/email-notifications';
export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}) {
  if(!sameOrigin(req))return json({error:'Invalid origin'},403);
  if(!await isOwner())return json({error:'Unauthorized'},401);
  try {
    const {id}=await params;if(!validId(id))return json({error:'Invalid conversation'},400);
    await getContact(id,undefined,true);
    const parsed=z.object({messageId:z.string().uuid()}).safeParse(await bodyJSON(req));
    if(!parsed.success)return json({error:'Invalid message'},400);
    const notification=await prepareOwnerEmail(id,parsed.data.messageId,true);
    return json({emailStatus:notification.status,emailDispatch:notification.emailDispatch},notification.status==='rate_limited'?429:200);
  }catch(error){return contactError(error);}
}
