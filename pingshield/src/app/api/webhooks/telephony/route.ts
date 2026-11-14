import { NextResponse } from 'next/server';
// Simulation outcomes are generated and processed server-side. No browser or
// unauthenticated external request may determine a verified call outcome.
export async function POST() {
  return NextResponse.json({ error: 'External callbacks are disabled until an authenticated live provider adapter is configured.' }, { status: 403 });
}
