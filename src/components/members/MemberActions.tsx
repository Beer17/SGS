'use client';
// src/components/members/MemberActions.tsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { IdCard, Loader2, Pencil, UserX } from 'lucide-react';

export function MemberActions({ scoutId, canManage }: { scoutId: string; canManage: boolean }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  async function darDeBaja() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/miembros/${scoutId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? 'No se pudo dar de baja.');
        return;
      }
      router.push('/censo');
      router.refresh();
    } catch {
      setError('Error de conexión.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      <Link href={`/credencial/${scoutId}`}
        className="flex items-center gap-2 rounded-lg bg-panel px-4 py-2.5 text-sm font-bold text-white hover:opacity-90">
        <IdCard size={17} /> Credencial
      </Link>
      {canManage && (
        <Link href={`/censo/${scoutId}/editar`}
          className="flex items-center gap-2 rounded-lg border border-linestrong px-4 py-2.5 text-sm font-bold text-muted hover:bg-paper">
          <Pencil size={17} /> Editar
        </Link>
      )}
      {canManage && !confirming && (
        <button onClick={() => setConfirming(true)}
          className="flex items-center gap-2 rounded-lg border border-line px-4 py-2.5 text-sm font-bold text-clay hover:bg-dangersoft">
          <UserX size={17} /> Dar de baja
        </button>
      )}
      {canManage && confirming && (
        <div className="flex items-center gap-2 rounded-lg border border-line bg-dangersoft px-3 py-2">
          <span className="text-xs font-bold text-clay">¿Dar de baja definitiva?</span>
          <button onClick={() => void darDeBaja()} disabled={loading}
            className="flex items-center gap-1 rounded-md bg-clay px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60">
            {loading && <Loader2 className="animate-spin" size={13} />} Sí, dar de baja
          </button>
          <button onClick={() => setConfirming(false)} className="rounded-md border border-linestrong px-3 py-1.5 text-xs font-bold text-clay">
            Cancelar
          </button>
        </div>
      )}
      {error && <p className="w-full text-xs font-semibold text-clay">{error}</p>}
    </div>
  );
}
