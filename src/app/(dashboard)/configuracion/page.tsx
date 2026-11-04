'use client';
// src/app/(dashboard)/configuracion/page.tsx — Cuentas, roles y preferencias
import { useEffect, useState } from 'react';
import {
  Loader2, Plus, ShieldCheck, UserCog, Users2, X,
} from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import { ROLE_LABELS } from '@/lib/labels';
import { ROLES } from '@/types';
import type { Role } from '@/types';

interface UsuarioItem {
  id: string;
  email: string;
  role: Role;
  activo: boolean;
  lastLogin: string | null;
  scoutProfile: { nombres: string; apellidos: string } | null;
}

const ROLE_DESCRIPCION: Record<Role, string> = {
  ADMIN: 'Control total: cuentas, sistema, respaldos y todos los módulos.',
  NACIONAL: 'Vista y gestión nacional: censo, eventos, finanzas de cualquier grupo.',
  PROVINCIA: 'Coordinación de su provincia: censo, eventos y validaciones.',
  GRUPO: 'Jefatura de grupo: gestión completa de los miembros de su grupo.',
  SECCION: 'Scouter: asistencia, avances y consulta de su sección.',
  MIEMBRO_TUTOR: 'Padre/tutor: expediente y credencial de sus vinculados.',
};

export default function ConfiguracionPage() {
  const { user } = useSession();
  const esAdmin = user?.role === 'ADMIN';
  const puedeVerUsuarios = user?.role === 'ADMIN' || user?.role === 'NACIONAL';

  const [usuarios, setUsuarios] = useState<UsuarioItem[] | null>(null);
  const [error, setError]     = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modalNuevo, setModalNuevo] = useState(false);

  useEffect(() => {
    if (!puedeVerUsuarios) return;
    fetch('/api/usuarios')
      .then((r) => r.json())
      .then((d: { data?: UsuarioItem[] }) => setUsuarios(d.data ?? []))
      .catch(() => setError('No se pudo cargar la lista de cuentas.'));
  }, [puedeVerUsuarios]);

  async function toggleActivo(u: UsuarioItem) {
    if (u.id === user?.id) { setError('No puedes desactivar tu propia cuenta.'); return; }
    const res = await fetch('/api/usuarios', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: u.id, activo: !u.activo }),
    });
    if (res.ok) {
      setUsuarios((prev) => prev?.map((x) => (x.id === u.id ? { ...x, activo: !u.activo } : x)) ?? null);
      setMensaje(`${u.email} ${!u.activo ? 'activada' : 'desactivada'} ✓`);
    } else {
      const d = (await res.json()) as { error?: string };
      setError(d.error ?? 'No se pudo actualizar.');
    }
  }

  return (
    <main className="max-w-6xl p-5 lg:p-8">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[.2em] text-clay">Sistema</p>
        <h1 className="mt-2 font-display text-3xl font-bold">Configuración</h1>
        <p className="mt-1 text-sm text-muted">Cuentas de acceso, roles y preferencias del portal.</p>
      </div>

      {error && <div role="alert" className="mb-4 rounded-lg bg-dangersoft px-4 py-3 text-sm font-semibold text-clay">{error}</div>}
      {mensaje && <div role="status" className="mb-4 rounded-lg bg-fern px-4 py-3 text-sm font-bold text-moss">{mensaje}</div>}

      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        {/* ─── Cuentas ─── */}
        {puedeVerUsuarios && (
          <section className="rounded-2xl border border-line bg-surface p-6 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold"><Users2 size={19} className="text-moss" /> Cuentas del sistema</h2>
              {esAdmin && (
                <button onClick={() => setModalNuevo(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-moss px-3 py-2 text-xs font-bold text-white">
                  <Plus size={14} /> Nueva cuenta
                </button>
              )}
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="text-left text-[11px] uppercase tracking-wider text-faint">
                  <tr className="border-b border-line"><th className="pb-2">Cuenta</th><th className="pb-2">Rol</th><th className="pb-2">Último acceso</th><th className="pb-2 text-right">Estado</th></tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {usuarios === null && <tr><td colSpan={4} className="py-6 text-center text-faint">Cargando…</td></tr>}
                  {usuarios?.map((u) => (
                    <tr key={u.id}>
                      <td className="py-2.5">
                        <p className="font-semibold">{u.email}</p>
                        {u.scoutProfile && <p className="text-[11px] text-faint">Vinculado: {u.scoutProfile.nombres} {u.scoutProfile.apellidos}</p>}
                      </td>
                      <td className="py-2.5 text-xs font-bold">{ROLE_LABELS[u.role]}</td>
                      <td className="py-2.5 text-xs text-faint">{u.lastLogin ? new Date(u.lastLogin).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' }) : 'Nunca'}</td>
                      <td className="py-2.5 text-right">
                        {esAdmin ? (
                          <button onClick={() => void toggleActivo(u)}
                            className={`rounded-full px-3 py-1 text-[10px] font-bold ${u.activo ? 'bg-fern text-moss' : 'bg-dangersoft text-clay'}`}
                            title={u.activo ? 'Clic para desactivar' : 'Clic para activar'}>
                            {u.activo ? 'ACTIVA' : 'INACTIVA'}
                          </button>
                        ) : (
                          <span className={`rounded-full px-3 py-1 text-[10px] font-bold ${u.activo ? 'bg-fern text-moss' : 'bg-dangersoft text-clay'}`}>
                            {u.activo ? 'ACTIVA' : 'INACTIVA'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ─── Roles ─── */}
        <section className="rounded-2xl border border-line bg-surface p-6 shadow-soft">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold"><ShieldCheck size={19} className="text-moss" /> Roles y alcance</h2>
          <ul className="mt-4 space-y-2">
            {ROLES.map((role) => (
              <li key={role} className="rounded-xl bg-paper p-3">
                <p className="flex items-center gap-2 text-sm font-bold"><UserCog size={14} className="text-faint" />{ROLE_LABELS[role]}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted">{ROLE_DESCRIPCION[role]}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {modalNuevo && (
        <NuevaCuentaModal
          onClose={() => setModalNuevo(false)}
          onCreada={() => {
            setModalNuevo(false);
            setMensaje('Cuenta creada ✓');
            fetch('/api/usuarios').then((r) => r.json()).then((d: { data?: UsuarioItem[] }) => setUsuarios(d.data ?? []));
          }}
        />
      )}
    </main>
  );
}

function NuevaCuentaModal({ onClose, onCreada }: { onClose: () => void; onCreada: () => void }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole]         = useState<Role>('SECCION');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password, role }),
      });
      const d = (await res.json()) as { error?: string };
      if (!res.ok) { setError(d.error ?? 'No se pudo crear la cuenta.'); return; }
      onCreada();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-panel/50 p-4" role="dialog" aria-modal aria-label="Nueva cuenta">
      <form onSubmit={(e) => void submit(e)} className="w-full max-w-md space-y-4 rounded-2xl bg-surface p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">Nueva cuenta de acceso</h3>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-lg p-2 text-faint hover:bg-paper"><X size={18} /></button>
        </div>
        {error && <p className="rounded-lg bg-dangersoft px-3 py-2 text-sm font-semibold text-clay">{error}</p>}
        <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@ejemplo.org *"
          className="w-full rounded-lg border border-linestrong p-3 text-sm outline-none focus:border-moss" />
        <input required type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña temporal (mín. 8) *"
          autoComplete="new-password"
          className="w-full rounded-lg border border-linestrong p-3 text-sm outline-none focus:border-moss" />
        <label className="block text-xs font-bold text-muted">Rol
          <select value={role} onChange={(e) => setRole(e.target.value as Role)}
            className="mt-1 w-full rounded-lg border border-linestrong p-3 text-sm outline-none focus:border-moss">
            {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
        </label>
        <p className="text-[11px] text-faint">Entrega la contraseña temporal en persona; el usuario debe cambiarla en Mi perfil.</p>
        <button type="submit" disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-moss py-3 text-sm font-bold text-white disabled:opacity-60">
          {loading && <Loader2 className="animate-spin" size={16} />} Crear cuenta
        </button>
      </form>
    </div>
  );
}
