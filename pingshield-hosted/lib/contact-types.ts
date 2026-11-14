export type EmailStatus = 'not_requested'|'disabled'|'sending'|'accepted'|'browser_accepted'|'activation_required'|'failed'|'unknown'|'rate_limited';
export type EmailDispatch={threadId:string;messageId:string;endpoint:string;payload:Record<string,string>};
export type ContactMessage = { id: string; sender: 'finder' | 'owner'; content: string; created_at: string; sequence: number; email_status?: EmailStatus; email_attempted_at?: string | null };
export type ContactThread = { id: string; tag_code: string; created_at: string; updated_at: string; expires_at: string; callback_hint: string | null; call_status: string };
export type ContactSession = { id: string; token: string; expiresAt: string };
