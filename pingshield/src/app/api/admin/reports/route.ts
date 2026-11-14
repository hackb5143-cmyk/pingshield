import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ensureDbInitialized } from '@/lib/init';
import { getAbuseReports } from '@/lib/db';

export async function GET(request: Request) {
  try {
    ensureDbInitialized();

    // For demo: just check user exists (no separate admin role)
    const session = await auth();
    const admins = (process.env.ADMIN_EMAILS || '').split(',').map(email => email.trim().toLowerCase());
    if (!session?.user?.email || !admins.includes(session.user.email.toLowerCase())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const reports = getAbuseReports(status);
    return NextResponse.json({ reports });
  } catch (error) {
    console.error('Admin reports error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
