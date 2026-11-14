import { NextRequest, NextResponse } from 'next/server';
import { createOwnerToken, ownerCookie, validPasscode } from '@/lib/owner-session';

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin');
  if (origin && origin !== req.nextUrl.origin) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const passcode = typeof body === 'object' && body !== null && 'passcode' in body ? String(body.passcode).slice(0, 256) : '';
  try {
    if (!validPasscode(passcode)) return NextResponse.json({ error: 'Incorrect passcode' }, { status: 401 });
    const res = NextResponse.json({ ok: true });
    res.cookies.set(ownerCookie.name, createOwnerToken(), ownerCookie.options);
    return res;
  } catch (error) { console.error('Owner sign in failed', error); return NextResponse.json({ error: 'Owner access is not configured' }, { status: 503 }); }
}
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ownerCookie.name, '', { ...ownerCookie.options, maxAge: 0 });
  return res;
}
