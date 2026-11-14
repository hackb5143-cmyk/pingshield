import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ensureDbInitialized } from '@/lib/init';
import { getNotificationsByUser, markNotificationRead, getDb } from '@/lib/db';

export async function GET() {
  try {
    ensureDbInitialized();

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const notifications = getNotificationsByUser(userId);
    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('List notifications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    ensureDbInitialized();

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
    }

    const result = getDb().prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(id, (session.user as any).id);
    if (!result.changes) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
