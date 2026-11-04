'use client';
// src/app/providers.tsx — proveedores de cliente (Auth.js SessionProvider)
import { SessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
