import { finderSession } from '@/lib/finder-session';
import { NextResponse } from 'next/server';
import { ensureDbInitialized } from '@/lib/init';
import {
  getTagByToken, getItemById, createMessage, createNotification,
  getIncidentBySession, createIncident, getMessagesByIncident,
  checkRateLimit, incrementRateLimit, isBlocked,
} from '@/lib/db';
import { getRateLimitConfig } from '@/lib/types';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    ensureDbInitialized();

    const { token } = await params;
    const tag = getTagByToken(token);

    if (!tag || tag.is_revoked) {
      return NextResponse.json({ error: 'Invalid or revoked tag' }, { status: 404 });
    }

    const item = getItemById(tag.item_id);
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const body = await request.json();
    const { content } = body;
    const sessionId = await finderSession();

    if (!content || typeof content !== 'string' || !content.trim() || content.length > 2000) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    if (isBlocked(item.user_id, sessionId)) return NextResponse.json({ error: 'Contact is blocked' }, { status: 403 });
    // Rate limit check
    const config = getRateLimitConfig();
    const allowed = checkRateLimit(
      item.user_id,
      'message',
      config.messageHourlyLimit,
      60
    );
    if (!allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }
    incrementRateLimit(item.user_id, 'message');

    // Get or create incident for this session
    let incident = getIncidentBySession(sessionId, item.id);
    if (!incident) {
      incident = createIncident({ itemId: item.id, tagId: tag.id, sessionId });
    }

    const message = createMessage({
      incidentId: incident.id,
      itemId: item.id,
      direction: 'finder_to_owner',
      senderType: 'finder',
      content,
    });

    createNotification({
      userId: item.user_id,
      itemId: item.id,
      incidentId: incident.id,
      type: 'message',
      title: `New message about ${item.name}`,
      body: content.substring(0, 200),
    });

    return NextResponse.json({ messageId: message.id, incidentId: incident.id }, { status: 201 });
  } catch (error) {
    console.error('Finder message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  ensureDbInitialized();
  const { token } = await params;
  const tag = getTagByToken(token);
  if (!tag || tag.is_revoked) return NextResponse.json({ error: 'Invalid tag' }, { status: 404 });
  const sessionId = await finderSession();
  if (!sessionId) return NextResponse.json({ messages: [] });
  const incident = getIncidentBySession(sessionId, tag.item_id);
  const messages = incident ? getMessagesByIncident(incident.id).map(({ id, content, sender_type, status, created_at }) => ({ id, content, sender_type, status, created_at })) : [];
  return NextResponse.json({ messages });
}
