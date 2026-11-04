'use client';
// src/components/eventos/NuevoEventoModal.tsx
import { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { TIPO_EVENTO_LABELS } from '@/lib/labels';
import type { TipoEvento } from '@/types';

interface GrupoOption { id: string; numeroGrupo: number; nombre: string }

export function NuevoEventoModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [grupos, setGrupos] = useState<GrupoOption[]>([]);
  const [nombre, setNombre]       = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipo, setTipo]           = useState<TipoEvento>('GRUPO');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin]   = useState('');
  const [lugar, setLugar]         = useState('');
  const [cupoMaximo, setCupoMaximo] = useState('');
  const [requiereAutorizacion, setRequiereAutorizacion] = useState(false);
  const [alcance, setAlcance]     = useState<'NACIONAL' | 'GRUPO'>('NACIONAL');
  const [grupoId, setGrupoId]     = useState('');
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);

  useEffect(() => {
    fetch('/api/grupos').then((r) => r.json()).then((d: { data?: GrupoOption[] }) => setGrupos(d.data ?? [])).catch(() => {});
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (new Date(fechaFin) < new Date(fechaInicio)) { setError('La fecha de fin no puede ser anterior al inicio.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/eventos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || undefined,
          tipo,
          fechaInicio: new Date(fechaInicio).toISOString(),
          fechaFin: new Date(fechaFin).toISOString(),
          lugar: lugar.trim() || undefined,
          cupoMaximo: cupoMaximo ? Number(cupoMaximo) : undefined,
          requiereAutorizacion,
          grupoId: alcance === 'GRUPO' && grupoId ? grupoId : undefined,
        }),
      });
      const d = (await res.json()) as { error?: string };
      if (!res.ok) { setError(d.error ?? 'No se pudo crear el evento.'); return; }
      onCreated();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-panel/50 p-4" role="dialog" aria-modal aria-label="Nuevo evento">
      <form onSubmit={(e) => void submit(e)} className="my-6 w-full max-w-lg space-y-4 rounded-2xl bg-surface p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">Nuevo evento</h3>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-lg p-2 text-faint hover:bg-paper"><X size={18} /></button>
        </div>

        {error && <p className="rounded-lg bg-dangersoft px-3 py-2 text-sm font-semibold text-clay">{error}</p>}

        <input required value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre del evento *"
          className="w-full rounded-lg border border-linestrong p-3 text-sm outline-none focus:border-moss" />
        <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Descripción (objetivos, qué traer…)" rows={2}
          className="w-full rounded-lg border border-linestrong p-3 text-sm outline-none focus:border-moss" />

        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs font-bold text-muted">Tipo
            <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoEvento)}
              className="mt-1 w-full rounded-lg border border-linestrong p-3 text-sm outline-none focus:border-moss">
              {Object.entries(TIPO_EVENTO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label className="text-xs font-bold text-muted">Alcance
            <select value={alcance} onChange={(e) => setAlcance(e.target.value as 'NACIONAL' | 'GRUPO')}
              className="mt-1 w-full rounded-lg border border-linestrong p-3 text-sm outline-none focus:border-moss">
              <option value="NACIONAL">Nacional / Abierto</option>
              <option value="GRUPO">Solo mi grupo</option>
            </select>
          </label>
        </div>

        {alcance === 'GRUPO' && (
          <select required value={grupoId} onChange={(e) => setGrupoId(e.target.value)}
            className="w-full rounded-lg border border-linestrong p-3 text-sm outline-none focus:border-moss">
            <option value="">Selecciona el grupo…</option>
            {grupos.map((g) => <option key={g.id} value={g.id}>Grupo {g.numeroGrupo} — {g.nombre}</option>)}
          </select>
        )}

        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs font-bold text-muted">Inicia *
            <input required type="datetime-local" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)}
              className="mt-1 w-full rounded-lg border border-linestrong p-3 text-sm outline-none focus:border-moss" />
          </label>
          <label className="text-xs font-bold text-muted">Termina *
            <input required type="datetime-local" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)}
              className="mt-1 w-full rounded-lg border border-linestrong p-3 text-sm outline-none focus:border-moss" />
          </label>
        </div>

        <input value={lugar} onChange={(e) => setLugar(e.target.value)} placeholder="Lugar / sede"
          className="w-full rounded-lg border border-linestrong p-3 text-sm outline-none focus:border-moss" />

        <label className="flex items-center justify-between gap-4 text-sm font-bold">
          Cupo máximo (opcional)
          <input type="number" min="1" value={cupoMaximo} onChange={(e) => setCupoMaximo(e.target.value)} placeholder="∞"
            className="w-28 rounded-lg border border-linestrong p-3 text-sm outline-none focus:border-moss" />
        </label>

        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-linestrong p-3 text-sm font-bold">
          <span>Requiere autorización parental firmada</span>
          <input type="checkbox" checked={requiereAutorizacion} onChange={(e) => setRequiereAutorizacion(e.target.checked)}
            className="h-5 w-5 accent-[#2b6a50]" />
        </label>

        <button type="submit" disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-moss py-3 text-sm font-bold text-white disabled:opacity-60">
          {loading && <Loader2 className="animate-spin" size={17} />} Crear evento
        </button>
      </form>
    </div>
  );
}
