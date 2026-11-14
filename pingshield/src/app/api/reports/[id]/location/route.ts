import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { updateReportLocation } from '@/lib/supabase';
import { locationSchema } from '@/lib/location-validation';

export const runtime = 'nodejs';
async function handle(req: NextRequest, context: { params: Promise<{ id: string }> }, stop: boolean) {
  const origin = req.headers.get('origin');
  if (origin && origin !== req.nextUrl.origin) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  const { id } = await context.params;
  const token = req.headers.get('authorization')?.replace(/^Bearer /, '');
  if (!/^[a-f0-9-]{36}$/.test(id) || !token || !/^[a-f0-9]{64}$/.test(token)) return NextResponse.json({ error: 'Invalid sharing session' }, { status: 401 });
  let fix = null;
  if (!stop) {
    if (!req.headers.get('content-type')?.startsWith('application/json')) return NextResponse.json({ error: 'JSON required' }, { status: 415 });
    const raw = await req.text();
    if (raw.length > 2000) return NextResponse.json({ error: 'Request too large' }, { status: 413 });
    let value;
    try { value = JSON.parse(raw); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
    const parsed = locationSchema.safeParse(value);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid GPS coordinates' }, { status: 400 });
    fix = parsed.data;
  }
  try {
    await updateReportLocation(id, createHash('sha256').update(token).digest('hex'), fix);
    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const reason = error instanceof Error ? error.message : '';
    const status = reason.includes('invalid_session') ? 401 : reason.includes('session_expired') ? 410 : reason.includes('update_rate') ? 429 : 503;
    return NextResponse.json({ error: status === 503 ? 'Could not save location. Please retry.' : status === 429 ? 'Please wait before updating again.' : 'Sharing session ended or is invalid.' }, { status });
  }
}
export function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) { return handle(req, context, false); }
export function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) { return handle(req, context, true); }
