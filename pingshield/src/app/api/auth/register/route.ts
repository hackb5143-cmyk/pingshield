import { NextRequest, NextResponse } from 'next/server';
import { ensureDbInitialized } from '@/lib/init';
import { createUser, getUserByEmail } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    ensureDbInitialized();
    const { email, password, name, phone } = await req.json();
    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Email, password, and name are required' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }
    const existing = getUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }
    const user = createUser(email, password, name, phone);
    return NextResponse.json({ user }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
