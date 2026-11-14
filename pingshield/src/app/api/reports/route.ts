import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'node:crypto';
import { z } from 'zod';
import { getOwnerReports, saveRecoveryReport } from '@/lib/supabase';
import { isOwner } from '@/lib/owner-session';

const schema = z.object({
  tagCode: z.literal('DEMO001'),
  message: z.string().trim().min(3).max(1000),
  finderContact: z.string().trim().max(120).nullish(),
  latitude: z.number().finite().min(-90).max(90).nullish(),
  longitude: z.number().finite().min(-180).max(180).nullish(),
  accuracy: z.number().finite().min(0).max(100000).nullish(),
  manualLocation: z.string().trim().max(300).nullish(),
  website: z.string().max(200).optional(),
  live: z.boolean().optional().default(false),
}).refine(v => (v.latitude == null) === (v.longitude == null), 'Coordinates must be paired')
  .refine(v => v.latitude != null || Boolean(v.manualLocation), 'Share GPS or enter a pickup location')
  .refine(v => !v.live || v.latitude != null, 'Live sharing requires GPS');

export async function POST(req: NextRequest) {
  if (!req.headers.get('content-type')?.startsWith('application/json')) return NextResponse.json({ error: 'JSON required' }, { status: 415 });
  if (Number(req.headers.get('content-length') || 0) > 10000) return NextResponse.json({ error: 'Request too large' }, { status: 413 });
  const origin = req.headers.get('origin');
  if (origin && origin !== req.nextUrl.origin) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  let body: unknown;
  try {
    const raw = await req.text();
    if (raw.length > 10000) return NextResponse.json({ error: 'Request too large' }, { status: 413 });
    body = JSON.parse(raw);
  } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  if (parsed.data.website) return NextResponse.json({ error: 'Submission rejected' }, { status: 400 });
  const v = parsed.data;
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const salt = process.env.REPORT_HASH_SECRET || process.env.OWNER_SESSION_SECRET;
  if (!salt) return NextResponse.json({ error: 'Server configuration incomplete' }, { status: 503 });
  const requesterHash = createHash('sha256').update(`${salt}:${ip}`).digest('hex');
  const liveToken = v.live ? randomBytes(32).toString('hex') : undefined;
  try {
    const saved = await saveRecoveryReport({ tagCode: v.tagCode, message: v.message,
      finderContact: v.finderContact || null, latitude: v.latitude ?? null,
      longitude: v.longitude ?? null, accuracy: v.accuracy ?? null,
      manualLocation: v.manualLocation || null, requesterHash,
      liveTokenHash: liveToken ? createHash('sha256').update(liveToken).digest('hex') : undefined });
    return NextResponse.json({ ...saved, tagCode: v.tagCode, liveToken }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('rate_limit')) return NextResponse.json({ error: 'Too many reports. Try again in 10 minutes.' }, { status: 429 });
    if (message.includes('invalid_tag')) return NextResponse.json({ error: 'Tag is inactive' }, { status: 404 });
    console.error('Report insert failed', error);
    return NextResponse.json({ error: 'Could not save report. Please try again.' }, { status: 503 });
  }
}

export async function GET() {
  if (!await isOwner()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try { return NextResponse.json({ reports: await getOwnerReports() }, { headers: { 'Cache-Control': 'no-store' } }); }
  catch (error) { console.error('Report fetch failed', error); return NextResponse.json({ error: 'Could not load reports' }, { status: 503 }); }
}
