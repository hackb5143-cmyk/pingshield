import { finderSession } from '@/lib/finder-session';
import { NextResponse } from 'next/server';
import { ensureDbInitialized } from '@/lib/init';
import { getTagByToken, getItemById, getIncidentBySession } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    ensureDbInitialized();

    const { token } = await params;
    const tag = getTagByToken(token);

    if (!tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }
    if (tag.is_revoked) {
      return NextResponse.json({ error: 'This tag has been revoked' }, { status: 410 });
    }

    const item = getItemById(tag.item_id);
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Return only public info — NEVER expose owner's personal data
    const publicInfo = {
      name: item.name,
      category: item.category,
      public_message: item.public_message,
      color: item.color,
      is_stolen: !!item.is_stolen,
    };

    // Check for existing incident session
    const { searchParams } = new URL(request.url);
    const sessionId = await finderSession(true);
    let incidentSession = null;

    if (sessionId) {
      const incident = getIncidentBySession(sessionId, item.id);
      if (incident) {
        incidentSession = {
          incidentId: incident.id,
          status: incident.status,
          ownerCallAttempts: incident.owner_call_attempts,
          familyContactUnlocked: !!incident.family_contact_unlocked,
        };
      }
    }

    return NextResponse.json({
      item: publicInfo,
      tagId: tag.id,
      itemId: item.id,
      incidentSession,
    });
  } catch (error) {
    console.error('Scan error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
