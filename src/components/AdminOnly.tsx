'use client';
// src/components/AdminOnly.tsx — gate visual por rol (la seguridad real vive en el servidor)
import { ShieldAlert } from 'lucide-react';
import { useSession } from 'next-auth/react';

export function AdminOnly({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="grid min-h-[40vh] place-items-center text-sm text-muted">
        Verificando permisos…
      </div>
    );
  }

  const role = session?.user?.role;
  if (role !== 'ADMIN' && role !== 'NACIONAL') {
    return (
      <div className="grid min-h-[60vh] place-items-center p-6">
        <div className="max-w-md rounded-2xl border border-line bg-surface p-8 text-center shadow-soft">
          <ShieldAlert className="mx-auto mb-4 h-10 w-10 text-clay" aria-hidden />
          <h1 className="font-display text-xl font-bold text-ink">Acceso restringido</h1>
          <p className="mt-2 text-sm text-muted">
            Esta sección requiere rol de administración (ADMIN o NACIONAL). Si crees que es un
            error, contacta al administrador del sistema.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
