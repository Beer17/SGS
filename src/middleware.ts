// src/middleware.ts
// Protege el dashboard y la API. Edge-safe: usa el split config (sin Prisma).
import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import authConfig from '@/auth.config';

const { auth } = NextAuth(authConfig);

const PUBLIC_PATHS = ['/login', '/register', '/api/credencial/verify'];
const PUBLIC_PREFIXES = ['/api/auth', '/_next', '/favicon', '/manifest.json', '/sw.js', '/icons'];

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) return true;
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  // archivos estáticos con extensión (png, svg, ico, txt…)
  if (/\.[a-zA-Z0-9]{2,5}$/.test(pathname)) return true;
  return false;
}

export default auth((request) => {
  const { pathname } = request.nextUrl;
  const isAuthenticated = !!request.auth;
  const role = request.auth?.user?.role;

  if (isPublic(pathname)) {
    // Usuario ya autenticado → fuera del login hacia el panel
    if (isAuthenticated && pathname === '/login') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  if (!isAuthenticated) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // /admin solo para ADMIN y NACIONAL
  if (pathname.startsWith('/admin') && role !== 'ADMIN' && role !== 'NACIONAL') {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
