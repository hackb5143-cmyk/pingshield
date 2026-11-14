import { NextRequest, NextResponse } from 'next/server';
export function json(value: unknown,status=200) { return NextResponse.json(value,{status,headers:{'Cache-Control':'no-store'}}); }
export function sameOrigin(req: NextRequest) { const origin=req.headers.get('origin'); return !origin || origin===req.nextUrl.origin; }
export function finderToken(req: NextRequest) { const value=req.headers.get('authorization')?.replace(/^Bearer /,''); return value&&/^[a-f0-9]{64}$/.test(value)?value:undefined; }
export function validId(id: string) { return /^[a-f0-9-]{36}$/.test(id); }
export async function bodyJSON(req: NextRequest) {
  if (!req.headers.get('content-type')?.startsWith('application/json')) throw new Error('invalid_json');
  const text=await req.text(); if(text.length>6000) throw new Error('invalid_json');
  try { return JSON.parse(text) as unknown; } catch { throw new Error('invalid_json'); }
}
export function contactError(error: unknown) {
  const reason=error instanceof Error?error.message:'';
  const status=reason==='unauthorized'?401:reason==='expired'?410:reason==='rate_limit'||reason==='message_limit'?429:reason==='invalid_json'?400:503;
  const message=status===401?'Conversation access denied.':status===410?'This conversation has expired.':status===429?'Please wait before sending again, or start a new conversation after the limit resets.':status===400?'Invalid request.':'Could not save the message. Please retry.';
  return json({error:message},status);
}
