import { NextResponse } from 'next/server';
import { ensureDbInitialized } from '@/lib/init';
import { acceptEmergencyInvitation } from '@/lib/db';

export async function POST(request: Request) {
  try {
    ensureDbInitialized();

    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'Invitation token is required' }, { status: 400 });
    }

    const contact = acceptEmergencyInvitation(token);
    if (!contact) {
      return NextResponse.json({ error: 'Invalid invitation token' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      contact: {
        id: contact.id,
        name: contact.name,
        consent_status: contact.consent_status,
      },
    });
  } catch (error) {
    console.error('Accept invitation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
