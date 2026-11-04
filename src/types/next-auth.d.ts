// src/types/next-auth.d.ts
// Amplía los tipos de Auth.js con el rol RBAC y el id del usuario.
import type { Role } from '@/types';

declare module 'next-auth' {
  interface User {
    id?: string;
    role?: Role;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      role: Role;
      name?: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: Role;
  }
}
