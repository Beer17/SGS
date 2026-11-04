'use client';
// src/components/eventos/InscribirMiembro.tsx
// Busca un miembro en el censo y lo inscribe al evento.
import { useEffect, useRef, useState } from 'react';
import { Loader2, Search, UserPlus } from 'lucide-react';
import { estatusRegistroColor } from '@/lib/utils';
import type { RegistroStatus, Seccion } from '@/types';
import { SECTION_LABELS } from '@/types';

interface MiembroRow {
  id: string;
  nombres: string;
  apellidos: string;
  seccion: Seccion;
  estatusRegistro: RegistroStatus;
  grupo: { numeroGrupo: number };
}

export function InscribirMiembro({ eventoId, requiereAutorizacion, onInscrito }: {
  eventoId: string;
  requiereAutorizacion: boolean;
  onInscrito: () => void;
}) {
  const [q, setQ]               = useState('');
  const [results, setResults]   = useState<MiembroRow[]>([]);
  const [buscado, setBuscado]   = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [mensaje, setMensaje]   = useState('');
  const [error, setError]       = useState('');
  const [inscribiendo, setInscribiendo] = useState<string | null>(null);
  const [confirmAuth, setConfirmAuth]   = useState<string | null>(null); // id de miembro pendiente de confirmar autorización
  const debounce = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!q.trim()) { setResults([]); setBuscado(false); return; }
    setBuscando(true);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      fetch(`/api/miembros?q=${encodeURIComponent(q.trim())}&limit=6&estatus=ACTIVO`)
        .then((r) => r.json())
        .then((d: { data?: MiembroRow[] }) => { setResults(d.data ?? []); setBuscado(true); })
        .catch(() => setResults([]))
        .finally(() => setBuscando(false));
    }, 300);
    return () => clearTimeout(debounce.current);
  }, [q]);

  async function inscribir(scoutProfileId: string, autorizacionParental: boolean) {
    setInscribiendo(scoutProfileId);
    setMensaje(''); setError('');
    try {
      const res = await fetch(`/api/eventos/${eventoId}/inscribir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scoutProfileId, autorizacionParental }),
      });
      const d = (await res.json()) as { error?: string };
      if (!res.ok) { setError(d.error ?? 'No se pudo inscribir.'); return; }
      setMensaje('Inscripción registrada ✓');
      setConfirmAuth(null);
      onInscrito();
    } finally {
      setInscribiendo(null);
    }
  }

  function intentarInscribir(id: string) {
    if (requiereAutorizacion) { setConfirmAuth(id); return; }
    void inscribir(id, false);
  }

  return (
    <div className="rounded-xl border border-[#e2e9df] bg-paper p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-[#5c6f63]">Inscribir miembro</p>
      <div className="relative mt-2">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#91a097]" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre o CURP…"
          aria-label="Buscar miembro para inscribir"
          className="w-full rounded-lg border border-[#dfe7dc] bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-moss" />
        {buscando && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-moss" />}
      </div>

      {error && <p className="mt-2 rounded-lg bg-[#fdecea] px-3 py-2 text-xs font-semibold text-clay">{error}</p>}
      {mensaje && <p className="mt-2 rounded-lg bg-fern px-3 py-2 text-xs font-bold text-moss">{mensaje}</p>}

      <ul className="mt-2 divide-y divide-[#e6ece4]">
        {results.map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-2 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{m.nombres} {m.apellidos}</p>
              <p className="text-[11px] text-[#829087]">{SECTION_LABELS[m.seccion]} · Grupo {m.grupo.numeroGrupo} · <span className={estatusRegistroColor(m.estatusRegistro)}>{m.estatusRegistro}</span></p>
            </div>
            {confirmAuth === m.id ? (
              <div className="flex shrink-0 items-center gap-1">
                <span className="mr-1 text-[10px] font-bold text-[#7a5a06]">¿Responsiva firmada?</span>
                <button onClick={() => void inscribir(m.id, true)} disabled={inscribiendo === m.id}
                  className="rounded-md bg-moss px-2 py-1.5 text-[11px] font-bold text-white">Sí</button>
                <button onClick={() => setConfirmAuth(null)}
                  className="rounded-md border border-[#dfe7dc] px-2 py-1.5 text-[11px] font-bold text-[#718078]">No</button>
              </div>
            ) : (
              <button onClick={() => intentarInscribir(m.id)} disabled={inscribiendo === m.id}
                className="shrink-0 rounded-lg bg-moss p-2 text-white disabled:opacity-60"
                aria-label={`Inscribir a ${m.nombres}`}>
                {inscribiendo === m.id ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
              </button>
            )}
          </li>
        ))}
      </ul>
      {buscado && results.length === 0 && <p className="mt-2 text-xs text-[#829087]">Sin resultados activos para “{q}”.</p>}
    </div>
  );
}
