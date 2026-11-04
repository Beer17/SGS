'use client';
// src/components/members/InsigniaGrant.tsx
// Otorgamiento directo de insignia desde el expediente (jefatura y scouters).
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Medal } from 'lucide-react';

interface CatalogoItem { id: string; nombre: string; categoria: string | null }

export function InsigniaGrant({ scoutId, seccion, obtainedIds }: {
  scoutId: string;
  seccion: string;
  obtainedIds: string[];
}) {
  const router = useRouter();
  const [catalog, setCatalog]   = useState<CatalogoItem[] | null>(null);
  const [choice, setChoice]     = useState('');
  const [loading, setLoading]   = useState(false);
  const [mensaje, setMensaje]   = useState('');
  const [error, setError]       = useState('');

  useEffect(() => {
    fetch(`/api/insignias?seccion=${seccion}`)
      .then((r) => r.json())
      .then((d: { data?: CatalogoItem[] }) => setCatalog(d.data ?? []))
      .catch(() => setCatalog([]));
  }, [seccion]);

  const disponibles = (catalog ?? []).filter((c) => !obtainedIds.includes(c.id));

  async function otorgar() {
    if (!choice) return;
    setLoading(true); setError(''); setMensaje('');
    try {
      const res = await fetch('/api/insignias/otorgar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scoutProfileId: scoutId, insigniaId: choice }),
      });
      const d = (await res.json()) as { error?: string };
      if (!res.ok) { setError(d.error ?? 'No se pudo otorgar.'); return; }
      setMensaje('Insignia otorgada ✓');
      setChoice('');
      router.refresh();
    } catch {
      setError('Error de conexión.');
    } finally {
      setLoading(false);
    }
  }

  if (catalog === null) {
    return <Loader2 className="animate-spin text-moss" size={18} aria-label="Cargando catálogo" />;
  }
  if (disponibles.length === 0) {
    return <p className="max-w-56 text-[11px] leading-snug text-faint">Tiene todas las insignias disponibles para su sección 🎉</p>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      <Medal size={17} className="text-[#c9a227]" aria-hidden />
      <select value={choice} onChange={(e) => setChoice(e.target.value)} aria-label="Elegir insignia para otorgar"
        className="max-w-56 rounded-lg border border-linestrong bg-surface px-3 py-2 text-xs font-semibold outline-none focus:border-moss">
        <option value="">Otorgar insignia…</option>
        {disponibles.map((c) => (
          <option key={c.id} value={c.id}>{c.nombre}{c.categoria ? ` · ${c.categoria}` : ''}</option>
        ))}
      </select>
      <button onClick={() => void otorgar()} disabled={!choice || loading}
        className="rounded-lg bg-moss px-3 py-2 text-xs font-bold text-white disabled:opacity-50">
        {loading ? 'Otorgando…' : 'Otorgar'}
      </button>
      {mensaje && <span role="status" className="text-xs font-bold text-moss">{mensaje}</span>}
      {error && <span role="alert" className="text-xs font-bold text-clay">{error}</span>}
    </div>
  );
}
