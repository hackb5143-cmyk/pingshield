import { NextRequest } from 'next/server';
import { env } from 'cloudflare:workers';
import { isOwner } from '@/lib/owner-session';
import { json,sameOrigin } from '@/lib/contact-http';
import { emailEnabled,browserEmailEnabled } from '@/lib/email-notifications';
import { submitOwnerEmailAttempt } from '@/lib/email-protocol';
export async function POST(req:NextRequest){
  if(!sameOrigin(req))return json({error:'Invalid origin'},403);
  if(!await isOwner())return json({error:'Unauthorized'},401);
  if(!emailEnabled())return json({error:'Owner email is not configured'},503);
  if(browserEmailEnabled())return json({status:'browser_required',detail:'Use the message form to test the activated browser email endpoint.'});
  return json(await submitOwnerEmailAttempt(env.OWNER_NOTIFICATION_EMAIL!,'owner-test','PingShield owner email test. This confirms the notification connection; it is not a real lost-item report.'));
}
