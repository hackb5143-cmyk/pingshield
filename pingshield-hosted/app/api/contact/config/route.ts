import { json } from '@/lib/contact-http';
import { callingReady } from '@/lib/telephony';
import { emailEnabled } from '@/lib/email-notifications';
export function GET() { return json({callingEnabled:callingReady(),messagingEnabled:true,emailEnabled:emailEnabled()}); }
