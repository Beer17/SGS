// src/auth.ts
// Auth.js v5 — fuente de verdad de la sesión. Servidor únicamente.
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { LoginSchema } from '@/lib/validations';
import authConfig from '@/auth.config';
import type { Role } from '@/types';

// Rate limit en memoria: 5 intentos fallidos cada 5 min por correo+IP.
// (Suficiente para una instancia única; para multi-instancia usar un store compartido.)
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 5 * 60 * 1000;

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) return true;
  return entry.count < MAX_ATTEMPTS;
}

function recordFailure(key: string) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    entry.count += 1;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials, request) {
        const parsed = LoginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const email = parsed.data.email.trim().toLowerCase();
        const ip = request?.headers?.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
        const limitKey = `${email}|${ip}`;

        if (!checkRateLimit(limitKey)) return null;

        const user = await db.user.findUnique({ where: { email } });
        if (!user || !user.activo) {
          recordFailure(limitKey);
          return null;
        }
        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!valid) {
          recordFailure(limitKey);
          return null;
        }

        await db.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });
        return { id: user.id, email: user.email, role: user.role as Role };
      },
    }),
  ],
});
