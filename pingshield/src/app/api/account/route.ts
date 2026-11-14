import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ensureDbInitialized } from '@/lib/init';
import { getUserById, updateUser, deleteUser, getUserByEmail, verifyPassword } from '@/lib/db';
import { z } from 'zod';
const schema = z.object({ name: z.string().trim().min(1).max(100), language: z.enum(['en', 'hi']) });
async function user() {
  ensureDbInitialized();
  const session = await auth();
  return session?.user ? getUserById((session.user as { id: string }).id) : null;
}
export async function GET() {
  const current = await user();
  return current ? NextResponse.json({ user: current }) : NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
export async function PATCH(request: Request) {
  const current = await user();
  if (!current) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Enter a name and a supported language.' }, { status: 400 });
  updateUser(current.id, parsed.data);
  return NextResponse.json({ user: getUserById(current.id) });
}
export async function DELETE(request: Request) {
  const current = await user();
  if (!current) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => null);
  const stored = getUserByEmail(current.email);
  if (typeof body?.password !== 'string' || !verifyPassword(stored.password_hash, body.password)) return NextResponse.json({ error: 'Your password is incorrect.' }, { status: 403 });
  deleteUser(current.id);
  return NextResponse.json({ success: true });
}
