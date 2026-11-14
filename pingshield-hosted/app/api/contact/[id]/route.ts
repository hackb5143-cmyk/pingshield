import { NextRequest } from 'next/server';
import { z } from 'zod';
import { isOwner } from '@/lib/owner-session';
import { getContact,contactMessagesFor,appendContactMessage,contactDb } from '@/lib/contact-store';
import { sameOrigin,json,bodyJSON,contactError,finderToken,validId } from '@/lib/contact-http';
import { prepareOwnerEmail } from '@/lib/email-notifications';
type Context={params:Promise<{id:string}>};
async function authorize(req:NextRequest,context:Context) {
  const {id}=await context.params;if(!validId(id))throw new Error('unauthorized');
  if(req.headers.has('authorization')&&!finderToken(req))throw new Error('unauthorized');
  // A supplied finder capability always takes precedence over an owner cookie.
  const token=finderToken(req);const owner=!token&&await isOwner();
  const thread=await getContact(id,token,owner);return {id,thread,owner};
}
export async function GET(req:NextRequest,context:Context) {
  try{const {id,thread}=await authorize(req,context);return json({thread,messages:await contactMessagesFor(id)});}catch(error){return contactError(error);}
}
export async function POST(req:NextRequest,context:Context) {
  if(!sameOrigin(req))return json({error:'Invalid origin'},403);
  try {
    const {id,owner,thread}=await authorize(req,context);
    if(Date.parse(thread.expires_at)<=Date.now())throw new Error('expired');
    const parsed=z.object({message:z.string().trim().min(1).max(1000)}).safeParse(await bodyJSON(req));
    if(!parsed.success)return json({error:'Enter a message of 1–1000 characters.'},400);
    const saved=await appendContactMessage(id,owner?'owner':'finder',parsed.data.message);
    const notification=owner?{status:'not_requested'}:await prepareOwnerEmail(id,saved.messageId);
    return json({ok:true,emailStatus:notification.status,emailDispatch:'emailDispatch' in notification?notification.emailDispatch:undefined},201);
  }catch(error){return contactError(error);}
}
export async function DELETE(req:NextRequest,context:Context) {
  if(!sameOrigin(req))return json({error:'Invalid origin'},403);
  if(!await isOwner())return json({error:'Unauthorized'},401);
  const {id}=await context.params;if(!validId(id))return json({error:'Invalid conversation'},400);
  const active=await contactDb().prepare("SELECT id FROM contact_threads WHERE id=? AND call_status IN ('starting','queued','ringing','in-progress','dispatch_unknown')").bind(id).first();
  if(active)return json({error:'End or reconcile the phone call with the provider before deleting this conversation.'},409);
  await contactDb().prepare('DELETE FROM contact_threads WHERE id=?').bind(id).run();return json({ok:true});
}
