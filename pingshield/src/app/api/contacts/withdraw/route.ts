import { NextResponse } from 'next/server';
import { ensureDbInitialized } from '@/lib/init';
import { withdrawEmergencyConsent, getDb } from '@/lib/db';

export async function POST(request: Request) {
  try {
    ensureDbInitialized();

    const body = await request.json();
    const { token, action } = body;
    const contact = typeof token === 'string' ? getDb().prepare('SELECT id FROM emergency_contacts WHERE invitation_token = ?').get(token) as { id: string } | undefined : undefined;
    const id = contact?.id;

    if (!id) {
      return NextResponse.json({ error: 'Emergency contact ID is required' }, { status: 400 });
    }

    if (action === 'decline') getDb().prepare("UPDATE emergency_contacts SET consent_status = 'declined' WHERE id = ?").run(id);
    else withdrawEmergencyConsent(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Withdraw consent error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
