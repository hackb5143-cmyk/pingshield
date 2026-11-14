import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ensureDbInitialized } from '@/lib/init';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    ensureDbInitialized();

    // For demo: just check user exists (no separate admin role)
    const session = await auth();
    const admins = (process.env.ADMIN_EMAILS || '').split(',').map(email => email.trim().toLowerCase());
    if (!session?.user?.email || !admins.includes(session.user.email.toLowerCase())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const logs = db.prepare(
      `SELECT * FROM admin_audit_log ORDER BY created_at DESC LIMIT 100`
    ).all();

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Admin audit error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
