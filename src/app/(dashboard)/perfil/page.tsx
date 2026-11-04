'use client';
// src/app/(dashboard)/perfil/page.tsx — Mi cuenta y cambio de contraseña
import { useEffect, useState } from 'react';
import { CheckCircle2, KeyRound, Loader2, Mail, ShieldCheck } from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import { ROLE_LABELS } from '@/lib/labels';

export default function PerfilPage() {
  const { user, loading } = useSession();
  const [actual, setActual]         = useState('');
  const [nueva, setNueva]           = useState('');
  const [confirma, setConfirma]     = useState('');
  const [guardando, setGuardando]   = useState(false);
  const [mensaje, setMensaje]       = useState('');
  const [error, setError]           = useState('');

  useEffect(() => { setMensaje(''); setError(''); }, [actual, nueva, confirma]);

  async function cambiarPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setMensaje('');
    if (nueva.length < 8) { setError('La nueva contraseña debe tener al menos 8 caracteres.'); return; }
    if (nueva !== confirma) { setError('Las contraseñas no coinciden.'); return; }
    setGuardando(true);
    try {
      const res = await fetch('/api/usuarios/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actual, nueva }),
      });
      const d = (await res.json()) as { error?: string };
      if (!res.ok) { setError(d.error ?? 'No se pudo cambiar la contraseña.'); return; }
      setMensaje('Contraseña actualizada ✓');
      setActual(''); setNueva(''); setConfirma('');
    } catch {
      setError('Error de conexión.');
    } finally {
      setGuardando(false);
    }
  }

  const iniciales = user?.email?.slice(0, 2).toUpperCase() ?? '??';

  return (
    <main className="max-w-4xl p-5 lg:p-8">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[.2em] text-clay">Cuenta</p>
        <h1 className="mt-2 font-display text-3xl font-bold">Mi perfil</h1>
        <p className="mt-1 text-sm text-muted">Datos de tu sesión y seguridad de tu cuenta.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_1.2fr]">
        {/* Tarjeta de cuenta */}
        <section className="rounded-2xl border border-line bg-surface p-6 text-center shadow-soft">
          <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-moss font-display text-3xl font-bold text-white">
            {iniciales}
          </div>
          <p className="mt-4 break-all font-display text-lg font-bold">{loading ? '…' : user?.email}</p>
          <p className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-fern px-3 py-1 text-xs font-bold text-moss">
            <ShieldCheck size={13} /> {user ? ROLE_LABELS[user.role] : ''}
          </p>
          <div className="mt-5 space-y-2 border-t border-line pt-5 text-left text-sm">
            <p className="flex items-center gap-2 text-muted"><Mail size={15} className="text-faint" /> {user?.email}</p>
            <p className="text-xs text-faint">
              El nombre visible y el rol los administra el responsable del sistema. Si necesitas cambiar alguno, contacta al administrador.
            </p>
          </div>
        </section>

        {/* Cambio de contraseña */}
        <section className="rounded-2xl border border-line bg-surface p-6 shadow-soft">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold"><KeyRound size={18} className="text-moss" /> Cambiar contraseña</h2>
          <p className="mt-1 text-xs text-faint">Requiere tu contraseña actual. Mínimo 8 caracteres.</p>

          {error && <div role="alert" className="mt-4 rounded-lg bg-dangersoft px-4 py-3 text-sm font-semibold text-clay">{error}</div>}
          {mensaje && <div role="status" className="mt-4 flex items-center gap-2 rounded-lg bg-fern px-4 py-3 text-sm font-bold text-moss"><CheckCircle2 size={17} />{mensaje}</div>}

          <form onSubmit={(e) => void cambiarPassword(e)} className="mt-5 space-y-4">
            <label className="block text-sm font-bold">
              Contraseña actual
              <input required type="password" autoComplete="current-password" value={actual} onChange={(e) => setActual(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-linestrong p-3 text-sm outline-none focus:border-moss" />
            </label>
            <label className="block text-sm font-bold">
              Nueva contraseña
              <input required type="password" autoComplete="new-password" minLength={8} value={nueva} onChange={(e) => setNueva(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-linestrong p-3 text-sm outline-none focus:border-moss" />
            </label>
            <label className="block text-sm font-bold">
              Confirma la nueva contraseña
              <input required type="password" autoComplete="new-password" minLength={8} value={confirma} onChange={(e) => setConfirma(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-linestrong p-3 text-sm outline-none focus:border-moss" />
            </label>
            <button type="submit" disabled={guardando}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-moss py-3 text-sm font-bold text-white disabled:opacity-60">
              {guardando && <Loader2 className="animate-spin" size={16} />} Actualizar contraseña
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
