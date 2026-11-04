'use client';
// src/hooks/useSession.ts — fachada sobre Auth.js para componentes cliente
import { useSession as useNextAuthSession, signOut } from 'next-auth/react';
import type { Role } from '@/types';

export interface ClientSessionUser {
  id: string;
  email: string;
  role: Role;
}

export function useSession() {
  const { data, status } = useNextAuthSession();
  const user: ClientSessionUser | null = data?.user
    ? { id: data.user.id, email: data.user.email ?? '', role: data.user.role }
    : null;

  async function logout() {
    await signOut({ redirectTo: '/login' });
  }

  return { user, loading: status === 'loading', logout };
}
