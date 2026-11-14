import { cookies } from 'next/headers';
import { randomUUID } from 'node:crypto';
export async function finderSession(create = false) {
  const jar = await cookies();
  let id = jar.get('ps_finder')?.value;
  if (!id && create) {
    id = randomUUID();
    jar.set('ps_finder', id, { httpOnly: true, sameSite: 'strict', secure: process.env.NEXT_PUBLIC_APP_URL?.startsWith('https:') ?? false, path: '/', maxAge: 86400 });
  }
  return id;
}
