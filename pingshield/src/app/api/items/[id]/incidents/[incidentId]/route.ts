import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ensureDbInitialized } from '@/lib/init';
import { getItemById, getIncidentById, updateIncidentStatus } from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; incidentId: string }> }
) {
  try {
    ensureDbInitialized();

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, incidentId } = await params;
    const userId = (session.user as any).id;
    const item = getItemById(id);

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }
    if (item.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const incident = getIncidentById(incidentId);
    if (!incident || incident.item_id !== id) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    const body = await request.json();
    const { status } = body;

    const allowedStatuses = ['owner_acknowledged', 'resolved'];
    if (!status || !allowedStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Status must be one of: ${allowedStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    updateIncidentStatus(incidentId, status);
    const updated = getIncidentById(incidentId);
    return NextResponse.json({ incident: updated });
  } catch (error) {
    console.error('Update incident error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
