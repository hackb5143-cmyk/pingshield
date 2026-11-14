import 'server-only';
import { createHmac, createHash, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { env } from 'cloudflare:workers';

const cookieName = 'pingshield_owner';
const lifetime = 24 * 60 * 60;
function secret() {
  const value = env.OWNER_SESSION_SECRET;
  if (!value || value.length < 32) throw new Error('OWNER_SESSION_SECRET must be at least 32 characters');
  return value;
}
function digest(value: string) { return createHash('sha256').update(value).digest(); }
function sign(value: string) { return createHmac('sha256', secret()).update(value).digest('hex'); }
export function validPasscode(candidate: string) {
  const expected = env.DEMO_OWNER_PASSCODE;
  if (!expected || expected.length < 12) throw new Error('DEMO_OWNER_PASSCODE must be at least 12 characters');
  return timingSafeEqual(digest(candidate), digest(expected));
}
export function createOwnerToken() {
  const expires = String(Math.floor(Date.now() / 1000) + lifetime);
  return `${expires}.${sign(expires)}`;
}
export async function isOwner() {
  const value = (await cookies()).get(cookieName)?.value;
  if (!value) return false;
  const [expires, signature] = value.split('.');
  if (!/^\d+$/.test(expires ?? '') || !/^[a-f0-9]{64}$/.test(signature ?? '')) return false;
  if (Number(expires) < Date.now() / 1000) return false;
  return timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(sign(expires), 'hex'));
}
export const ownerCookie = { name: cookieName, options: { httpOnly: true, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production', path: '/', maxAge: lifetime } };
