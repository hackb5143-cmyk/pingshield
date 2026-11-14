import { NextRequest } from 'next/server';
import { z } from 'zod';
import { isOwner } from '@/lib/owner-session';
import { createContact,listContacts,sourceDigest } from '@/lib/contact-store';
import { sameOrigin,json,bodyJSON,contactError } from '@/lib/contact-http';
import { callingReady } from '@/lib/telephony';
import { emailEnabled,prepareOwnerEmail } from '@/lib/email-notifications';
const schema=z.object({tagCode:z.literal('DEMO001'),message:z.string().trim().min(3).max(1000),phone:z.string().regex(/^\+[1-9]\d{7,14}$/).optional(),callbackConsent:z.boolean().optional(),website:z.string().max(200).optional()});
export async function POST(req: NextRequest) {
  if(!sameOrigin(req))return json({error:'Invalid origin'},403);
  try {
    const parsed=schema.safeParse(await bodyJSON(req));
    if(!parsed.success||parsed.data.website)return json({error:'Enter a message of 3–1000 characters.'},400);
    const data=parsed.data;
    if(data.phone&&(!data.callbackConsent||!callingReady()))return json({error:'Phone calling is not activated. You can send a private message instead.'},503);
    const saved=await createContact(data.message,sourceDigest(req.headers.get('cf-connecting-ip')||'unknown'),data.phone);
    const notification=await prepareOwnerEmail(saved.id,saved.messageId);
    const {messageId,...session}=saved;
    return json({...session,emailStatus:notification.status,emailDispatch:notification.emailDispatch},201);
  } catch(error) { return contactError(error); }
}
export async function GET() {
  if(!await isOwner())return json({error:'Unauthorized'},401);
  try{return json({threads:await listContacts(),callingEnabled:callingReady(),emailEnabled:emailEnabled()});}catch(error){return contactError(error);}
}
