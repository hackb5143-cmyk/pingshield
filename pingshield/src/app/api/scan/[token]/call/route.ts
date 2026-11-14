import { finderSession } from '@/lib/finder-session';
import { NextResponse } from 'next/server';
import { ensureDbInitialized } from '@/lib/init';
import {
  getTagByToken, getItemById, getUserById,
  getIncidentBySession, createIncident, createCallAttempt,
  getEmergencyContactsByUser, createNotification,
  checkRateLimit, incrementRateLimit, isBlocked,
} from '@/lib/db';
import { initiateCall } from '@/lib/telephony/provider';
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
    const { callType, finderPhone } = body;
    const sessionId = await finderSession();

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }
    if (!callType || !['owner', 'family'].includes(callType)) {
      return NextResponse.json({ error: 'callType must be "owner" or "family"' }, { status: 400 });
    }

    if (isBlocked(item.user_id, sessionId)) return NextResponse.json({ error: 'Contact is blocked' }, { status: 403 });
    const config = getRateLimitConfig();

    // Get or create incident
    let incident = getIncidentBySession(sessionId, item.id);
    if (!incident) {
      incident = createIncident({ itemId: item.id, tagId: tag.id, sessionId });
    }

    const owner = getUserById(item.user_id);
    if (!owner) {
      return NextResponse.json({ error: 'Owner not found' }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const callbackUrl = `${appUrl}/api/webhooks/telephony`;

    if (callType === 'owner') {
      // Rate limit: owner calls per hour
      const allowed = checkRateLimit(
        item.user_id,
        'owner_call',
        config.ownerCallHourlyLimit,
        60
      );
      if (!allowed) {
        return NextResponse.json({ error: 'Call rate limit exceeded' }, { status: 429 });
      }
      incrementRateLimit(item.user_id, 'owner_call');

      const callResult = await initiateCall(
        owner.phone || 'no-phone',
        finderPhone || 'anonymous',
        callbackUrl,
        config.callRingDurationSeconds
      );

      const callAttemptId = createCallAttempt({
        incidentId: incident.id,
        callType: 'owner',
        providerCallId: callResult.providerCallId,
        fromNumber: callResult.fromNumber,
        toNumber: callResult.toNumber,
      });

      createNotification({
        userId: item.user_id,
        itemId: item.id,
        incidentId: incident.id,
        type: 'call_attempt',
        title: `Incoming call about ${item.name}`,
        body: 'A finder is trying to reach you.',
      });

      return NextResponse.json({
        callAttemptId,
        providerCallId: callResult.providerCallId,
        status: 'initiated',
      });
    }

    // callType === 'family'
    // CHECK on SERVER: family_contact_unlocked
    if (!incident.family_contact_unlocked) {
      return NextResponse.json(
        { error: 'Family contacts are not yet unlocked. More owner call attempts are needed.' },
        { status: 403 }
      );
    }

    // Rate limit: family calls per hour
    const familyAllowed = checkRateLimit(
      item.user_id,
      'family_call',
      config.familyCallHourlyLimit,
      60
    );
    if (!familyAllowed) {
      return NextResponse.json({ error: 'Family call rate limit exceeded' }, { status: 429 });
    }
    incrementRateLimit(item.user_id, 'family_call');

    // Find an accepted emergency contact
    const contacts = getEmergencyContactsByUser(item.user_id);
    const acceptedContact = contacts.find((c: any) => c.consent_status === 'accepted');

    if (!acceptedContact) {
      return NextResponse.json(
        { error: 'No emergency contacts with accepted consent' },
        { status: 404 }
      );
    }

    const callResult = await initiateCall(
      acceptedContact.phone,
      finderPhone || 'anonymous',
      callbackUrl,
      config.callRingDurationSeconds
    );

    const callAttemptId = createCallAttempt({
      incidentId: incident.id,
      callType: 'family',
      providerCallId: callResult.providerCallId,
      fromNumber: callResult.fromNumber,
      toNumber: callResult.toNumber,
    });

    createNotification({
      userId: item.user_id,
      itemId: item.id,
      incidentId: incident.id,
      type: 'call_attempt',
      title: `Family contact called about ${item.name}`,
      body: `Emergency contact ${acceptedContact.name} is being called.`,
    });

    return NextResponse.json({
      callAttemptId,
      providerCallId: callResult.providerCallId,
      status: 'initiated',
    });
  } catch (error) {
    console.error('Call request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
