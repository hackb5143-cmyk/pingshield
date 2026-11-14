import NextAuth from 'next-auth';
import { ensureDbInitialized } from './init';
import Credentials from 'next-auth/providers/credentials';
import { getUserByEmail, getUserById, verifyPassword } from '@/lib/db';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        ensureDbInitialized();
        const user = getUserByEmail(credentials.email as string);
        if (!user) return null;

        const valid = verifyPassword(user.password_hash, credentials.password as string);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      ensureDbInitialized();
      const current = token?.id ? getUserById(token.id as string) : null;
      if (!current) return { ...session, user: undefined } as any;
      session.user.name = current.name;
      if (token?.id) {
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
  },
  trustHost: true,
});
