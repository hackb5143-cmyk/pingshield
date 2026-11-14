import { finderSession } from '@/lib/finder-session';
import { NextResponse } from 'next/server';
import { ensureDbInitialized } from '@/lib/init';
import {
  getTagByToken, getItemById, createScanEvent, createNotification,
  checkRateLimit, incrementRateLimit, getDb, isBlocked,
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
    const { latitude, longitude, accuracy, source, landmark } = body;
    const sessionId = await finderSession();

    const manual = source === 'manually provided';
    if (typeof sessionId !== 'string' || !sessionId || (manual ? typeof landmark !== 'string' || !landmark.trim() || landmark.length > 500 : !Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180)) {
      return NextResponse.json({ error: 'A session and valid location or landmark are required' }, { status: 400 });
    }
    if (isBlocked(item.user_id, sessionId)) return NextResponse.json({ error: 'Reports are blocked' }, { status: 403 });

    // Rate limit check
    const config = getRateLimitConfig();
    const allowed = checkRateLimit(
      item.user_id,
      'scan_notification',
      config.scanNotificationLimit,
      config.scanNotificationWindowMinutes
    );

    // Always record the scan event
    const scanEventId = createScanEvent({
      tagId: tag.id,
      itemId: item.id,
      sessionId: sessionId || 'unknown',
      latitude: manual ? undefined : latitude,
      longitude: manual ? undefined : longitude,
      accuracy: Number.isFinite(accuracy) && accuracy >= 0 ? accuracy : undefined,
      locationSource: source,
    });

    if (manual) getDb().prepare('UPDATE scan_events SET landmark = ? WHERE id = ?').run(landmark.trim(), scanEventId);

    // Only create notification if within rate limit
    if (allowed) {
      incrementRateLimit(item.user_id, 'scan_notification');
      createNotification({
        userId: item.user_id,
        itemId: item.id,
        type: 'location_report',
        title: `Location reported for ${item.name}`,
        body: manual ? `Manually provided landmark: ${landmark.trim()}` : `A finder shared their location (${latitude.toFixed(4)}, ${longitude.toFixed(4)}).`,
      });
    }

    return NextResponse.json({ scanEventId, recorded: true });
  } catch (error) {
    console.error('Location report error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
