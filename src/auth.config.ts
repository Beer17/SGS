// src/auth.config.ts
// Configuración "edge-safe" de Auth.js v5: SIN Prisma ni bcrypt.
// La usan el middleware y los callbacks de sesión/JWT.
import type { NextAuthConfig } from 'next-auth';
import type { Role } from '@/types';

export default {
  pages: { signIn: '/login' },
  session: { strategy: 'jwt', maxAge: 60 * 60 * 8 }, // 8 horas (jornada de campo)
  providers: [], // los providers reales viven en src/auth.ts
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: Role }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? '';
        session.user.role = (token.role as Role) ?? 'MIEMBRO_TUTOR';
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
