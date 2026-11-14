import { finderSession } from '@/lib/finder-session';
import { processDemoCallbacks } from '@/lib/telephony/process';
import { NextResponse } from 'next/server';
import { ensureDbInitialized } from '@/lib/init';
import { getTagByToken, getItemById, getIncidentBySession, getCallAttemptsByIncident } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    ensureDbInitialized();
    processDemoCallbacks();

    const { token } = await params;
    const tag = getTagByToken(token);

    if (!tag || tag.is_revoked) {
      return NextResponse.json({ error: 'Invalid or revoked tag' }, { status: 404 });
    }

    const item = getItemById(tag.item_id);
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = await finderSession();

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId query param is required' }, { status: 400 });
    }

    const incident = getIncidentBySession(sessionId, item.id);
    if (!incident) {
      return NextResponse.json({ incident: null });
    }

    const callAttempts = getCallAttemptsByIncident(incident.id);
    const ownerCallAttempts = incident.owner_call_attempts;

    return NextResponse.json({
      incidentId: incident.id,
      ownerCallAttempts,
      familyContactUnlocked: !!incident.family_contact_unlocked,
      status: incident.status,
    });
  } catch (error) {
    console.error('Incident state error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
