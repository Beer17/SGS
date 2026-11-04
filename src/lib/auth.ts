// src/lib/auth.ts
// Sesión y autorización en el servidor. Úsalo desde Server Components y Route Handlers.
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import type { Role } from '@/types';

export interface SessionUser {
  id: string;
  email: string;
  role: Role;
}

/** Devuelve el usuario autenticado o null. */
export async function getSession(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) return null;
  return { id: session.user.id, email: session.user.email ?? '', role: session.user.role };
}

export function canAccess(user: SessionUser, allowedRoles: Role[]): boolean {
  return allowedRoles.includes(user.role);
}

/** Lanza si no hay permiso. Para páginas/server components. */
export function requireRole(user: SessionUser | null, allowedRoles: Role[]): SessionUser {
  if (!user || !canAccess(user, allowedRoles)) throw new Error('No autorizado');
  return user;
}

export function isAdmin(user: SessionUser | null): boolean {
  return user?.role === 'ADMIN';
}

export function canManageFinances(user: SessionUser | null): boolean {
  return user ? ['ADMIN', 'NACIONAL', 'GRUPO'].includes(user.role) : false;
}

export function canManageMembers(user: SessionUser | null): boolean {
  return user ? ['ADMIN', 'NACIONAL', 'PROVINCIA', 'GRUPO'].includes(user.role) : false;
}

/** Jefatura y coordinación: lectura/escritura operativa. */
export function canOperate(user: SessionUser | null): boolean {
  return user ? ['ADMIN', 'NACIONAL', 'PROVINCIA', 'GRUPO', 'SECCION'].includes(user.role) : false;
}

/** Ficha médica: solo jefatura, coordinación y admin. NO tutores. */
export function canViewMedical(user: SessionUser | null): boolean {
  return canOperate(user);
}

type ApiAuthResult =
  | { session: SessionUser; error?: never }
  | { session?: never; error: NextResponse };

/**
 * Guardia para Route Handlers.
 * Uso: const { session, error } = await requireApiRole(['ADMIN', 'GRUPO']);
 *      if (error) return error;
 */
export async function requireApiRole(allowedRoles?: Role[]): Promise<ApiAuthResult> {
  const session = await getSession();
  if (!session) {
    return { error: NextResponse.json({ error: 'No autenticado' }, { status: 401 }) };
  }
  if (allowedRoles && !allowedRoles.includes(session.role)) {
    return { error: NextResponse.json({ error: 'No autorizado' }, { status: 403 }) };
  }
  return { session };
}
