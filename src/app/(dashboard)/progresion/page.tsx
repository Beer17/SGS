'use client';
// src/app/(dashboard)/progresion/page.tsx — Seguimiento real por miembro
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Award, BadgeCheck, CheckCircle2, ChevronRight, Loader2, Medal, Plus, Search, ShieldCheck, X,
} from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import { SECTION_LABELS } from '@/types';
import type { Seccion } from '@/types';

interface MiembroRow {
  id: string;
  nombres: string;
  apellidos: string;
  seccion: Seccion;
  grupo: { numeroGrupo: number; nombre: string };
}
interface ProgresionItem {
  id: string;
  etapaNombre: string;
  descripcion: string | null;
  completada: boolean;
  fechaAprobacion: string | null;
  aprobadaPor: { email: string } | null;
}
interface InsigniaObtenidaItem {
  id: string;
  fechaObtencion: string;
  insignia: { id: string; nombre: string; categoria: string | null };
}
interface CatalogoItem {
  id: string;
  nombre: string;
  categoria: string | null;
  seccion: Seccion | null;
}
interface DetalleMiembro {
  id: string;
  nombres: string;
  apellidos: string;
  seccion: Seccion;
  grupo: { numeroGrupo: number; nombre: string };
  progresiones: ProgresionItem[];
  insigniasObtenidas: InsigniaObtenidaItem[];
}

export default function ProgresionPage() {
  const { user } = useSession();
  const esTutor = user?.role === 'MIEMBRO_TUTOR';

  const [q, setQ]               = useState('');
  const [results, setResults]   = useState<MiembroRow[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [buscado, setBuscado]   = useState(false);
  const [seleccionado, setSeleccionado] = useState<DetalleMiembro | null>(null);
  const [cargando, setCargando] = useState(false);
  const [catalogo, setCatalogo] = useState<CatalogoItem[]>([]);
  const [error, setError]       = useState('');
  const [mensaje, setMensaje]   = useState('');
  const [modalEtapa, setModalEtapa] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!q.trim()) { setResults([]); setBuscado(false); return; }
    setBuscando(true);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      fetch(`/api/miembros?q=${encodeURIComponent(q.trim())}&limit=8`)
        .then((r) => r.json())
        .then((d: { data?: MiembroRow[] }) => { setResults(d.data ?? []); setBuscado(true); })
        .catch(() => setResults([]))
        .finally(() => setBuscando(false));
    }, 300);
    return () => clearTimeout(debounce.current);
  }, [q]);

  const cargarDetalle = async (id: string) => {
    setCargando(true);
    setError('');
    setMensaje('');
    try {
      const res = await fetch(`/api/miembros/${id}`);
      const d = (await res.json()) as { data?: DetalleMiembro; error?: string };
      if (!res.ok) { setError(d.error ?? 'No se pudo cargar el expediente.'); return; }
      setSeleccionado(d.data ?? null);
    } finally {
      setCargando(false);
    }
  };

  const seccionSel = seleccionado?.seccion;
  const idSel = seleccionado?.id;
  useEffect(() => {
    if (!idSel || !seccionSel) { setCatalogo([]); return; }
    fetch(`/api/insignias?seccion=${seccionSel}`)
      .then((r) => r.json())
      .then((d: { data?: CatalogoItem[] }) => setCatalogo(d.data ?? []))
      .catch(() => setCatalogo([]));
  }, [idSel, seccionSel]);

  const aprobar = async (progresionId: string) => {
    setError(''); setMensaje('');
    const res = await fetch(`/api/progresion/${progresionId}/aprobar`, { method: 'POST' });
    const d = (await res.json()) as { error?: string };
    if (!res.ok) { setError(d.error ?? 'No se pudo aprobar.'); return; }
    setMensaje('Etapa aprobada ✓');
    if (seleccionado) await cargarDetalle(seleccionado.id);
  };

  const otorgar = async (insigniaId: string) => {
    if (!seleccionado) return;
    setError(''); setMensaje('');
    const res = await fetch('/api/insignias/otorgar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scoutProfileId: seleccionado.id, insigniaId }),
    });
    const d = (await res.json()) as { error?: string };
    if (!res.ok) { setError(d.error ?? 'No se pudo otorgar (¿ya la tiene?).'); return; }
    setMensaje('Insignia otorgada ✓');
    await cargarDetalle(seleccionado.id);
  };

  const obtenidasIds = useMemo(() => new Set(seleccionado?.insigniasObtenidas.map((io) => io.insignia.id) ?? []), [seleccionado]);
  const total = seleccionado?.progresiones.length ?? 0;
  const completadas = seleccionado?.progresiones.filter((p) => p.completada).length ?? 0;
  const pct = total ? Math.round((completadas / total) * 100) : 0;

  return (
    <main className="max-w-7xl p-5 lg:p-8">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[.2em] text-clay">Desarrollo</p>
        <h1 className="mt-2 font-display text-3xl font-bold">Progresión scout</h1>
        <p className="mt-1 text-sm text-muted">Busca un miembro, revisa sus etapas y aprueba avances; otorga insignias del catálogo.</p>
      </div>

      {error && <div role="alert" className="mb-4 rounded-lg bg-dangersoft px-4 py-3 text-sm font-semibold text-clay">{error}</div>}
      {mensaje && <div role="status" className="mb-4 rounded-lg bg-fern px-4 py-3 text-sm font-bold text-moss">{mensaje}</div>}

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* ─── Buscador ─── */}
        <section className="rounded-2xl border border-line bg-surface p-5 shadow-soft">
          <label className="text-xs font-bold uppercase tracking-wide text-muted" htmlFor="buscar-miembro">Buscar miembro</label>
          <div className="relative mt-2">
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
            <input id="buscar-miembro" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nombre o CURP…"
              className="w-full rounded-lg border border-linestrong bg-surface py-2.5 pl-10 pr-3 text-sm outline-none focus:border-moss" />
            {buscando && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-moss" />}
          </div>
          <ul className="mt-3 divide-y divide-line">
            {results.map((m) => (
              <li key={m.id}>
                <button onClick={() => void cargarDetalle(m.id)}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-paper ${seleccionado?.id === m.id ? 'bg-fern/50' : ''}`}>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{m.apellidos}, {m.nombres}</span>
                    <span className="text-[11px] text-faint">{SECTION_LABELS[m.seccion]} · Grupo {m.grupo.numeroGrupo}</span>
                  </span>
                  <ChevronRight size={16} className="shrink-0 text-faint" />
                </button>
              </li>
            ))}
          </ul>
          {buscado && results.length === 0 && <p className="mt-2 text-xs text-faint">Sin resultados para “{q}”.</p>}
          {!esTutor && (
            <p className="mt-4 rounded-lg bg-paper p-3 text-[11px] text-muted">
              La aprobación de etapas queda registrada en la bitácora con tu cuenta y notifica al expediente vinculado.
            </p>
          )}
        </section>

        {/* ─── Detalle ─── */}
        <section>
          {cargando ? (
            <div className="grid min-h-64 place-items-center"><Loader2 className="animate-spin text-moss" size={30} /></div>
          ) : !seleccionado ? (
            <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-line bg-surface/50 p-8 text-center">
              <div>
                <ShieldCheck className="mx-auto text-moss" size={34} />
                <p className="mt-3 font-bold">Selecciona un miembro</p>
                <p className="mt-1 text-sm text-faint">Aquí verás su ruta de progresión, etapas aprobadas e insignias.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Encabezado */}
              <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-line bg-surface p-5 shadow-soft">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[.18em] text-clay">{SECTION_LABELS[seleccionado.seccion]} · Grupo {seleccionado.grupo.numeroGrupo}</p>
                  <h2 className="mt-1 font-display text-2xl font-bold">{seleccionado.nombres} {seleccionado.apellidos}</h2>
                  <Link href={`/ficha/${seleccionado.id}`} className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-moss">
                    Ver expediente completo <ChevronRight size={13} />
                  </Link>
                </div>
                <div className="text-right">
                  <div className="font-display text-3xl font-bold text-moss">{pct}%</div>
                  <div className="text-[10px] font-bold uppercase text-faint">{completadas}/{total} etapas</div>
                </div>
              </div>

              <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr]">
                {/* Etapas */}
                <div className="rounded-2xl border border-line bg-surface p-5 shadow-soft">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-bold">Ruta de progresión</h3>
                    {!esTutor && (
                      <button onClick={() => setModalEtapa(true)}
                        className="flex items-center gap-1 rounded-lg border border-moss px-2.5 py-1.5 text-[11px] font-bold text-moss hover:bg-fern">
                        <Plus size={13} /> Etapa
                      </button>
                    )}
                  </div>
                  <ol className="mt-3 space-y-2">
                    {seleccionado.progresiones.length === 0 && (
                      <li className="rounded-lg bg-paper p-3 text-sm text-faint">Sin etapas registradas. Agrega la primera con “+ Etapa”.</li>
                    )}
                    {seleccionado.progresiones.map((p) => (
                      <li key={p.id} className={`flex items-center gap-3 rounded-xl p-3 ${p.completada ? 'bg-fern/40' : 'bg-paper'}`}>
                        {p.completada
                          ? <CheckCircle2 size={21} className="shrink-0 text-moss" />
                          : <div className="h-[21px] w-[21px] shrink-0 rounded-full border-2 border-[#b9cbbb]" />}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold">{p.etapaNombre}</p>
                          <p className="text-[10px] text-faint">
                            {p.completada && p.fechaAprobacion
                              ? `Aprobada ${new Date(p.fechaAprobacion).toLocaleDateString('es-MX')}${p.aprobadaPor ? ` · ${p.aprobadaPor.email}` : ''}`
                              : 'En curso'}
                          </p>
                        </div>
                        {!esTutor && !p.completada && (
                          <button onClick={() => void aprobar(p.id)}
                            className="shrink-0 rounded-lg bg-moss px-3 py-2 text-[11px] font-bold text-white">
                            Aprobar
                          </button>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Insignias */}
                <div className="rounded-2xl border border-line bg-surface p-5 shadow-soft">
                  <h3 className="flex items-center gap-2 font-display font-bold"><Medal size={17} className="text-[#c9a227]" /> Insignias</h3>
                  <p className="mt-2 text-[10px] font-bold uppercase text-faint">Obtenidas ({seleccionado.insigniasObtenidas.length})</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {seleccionado.insigniasObtenidas.length === 0 && <span className="text-xs text-faint">Ninguna todavía.</span>}
                    {seleccionado.insigniasObtenidas.map((io) => (
                      <span key={io.id} className="rounded-full bg-warnsoft px-2.5 py-1 text-[11px] font-bold text-warn" title={io.insignia.categoria ?? ''}>
                        🏅 {io.insignia.nombre}
                      </span>
                    ))}
                  </div>

                  {!esTutor && (
                    <>
                      <p className="mt-4 text-[10px] font-bold uppercase text-faint">Otorgar del catálogo</p>
                      <ul className="mt-1.5 max-h-64 divide-y divide-line overflow-y-auto">
                        {catalogo.map((ins) => {
                          const yaLaTiene = obtenidasIds.has(ins.id);
                          return (
                            <li key={ins.id} className="flex items-center justify-between gap-2 py-2">
                              <span className="min-w-0">
                                <span className="block truncate text-xs font-semibold">{ins.nombre}</span>
                                <span className="text-[10px] text-faint">{ins.categoria ?? 'General'}</span>
                              </span>
                              <button onClick={() => void otorgar(ins.id)} disabled={yaLaTiene}
                                className="flex shrink-0 items-center gap-1 rounded-lg border border-linestrong px-2 py-1.5 text-[10px] font-bold text-moss hover:bg-fern disabled:opacity-40">
                                {yaLaTiene ? <BadgeCheck size={12} /> : <Award size={12} />}
                                {yaLaTiene ? 'Tiene' : 'Otorgar'}
                              </button>
                            </li>
                          );
                        })}
                        {catalogo.length === 0 && <li className="py-2 text-xs text-faint">Catálogo vacío para esta sección.</li>}
                      </ul>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {modalEtapa && seleccionado && (
        <NuevaEtapaModal
          scoutProfileId={seleccionado.id}
          seccion={seleccionado.seccion}
          onClose={() => setModalEtapa(false)}
          onCreada={() => { setModalEtapa(false); void cargarDetalle(seleccionado.id); }}
        />
      )}
    </main>
  );
}

/* ─── Modal: nueva etapa ─────────────────────────────────────────────────── */
function NuevaEtapaModal({ scoutProfileId, seccion, onClose, onCreada }: {
  scoutProfileId: string;
  seccion: Seccion;
  onClose: () => void;
  onCreada: () => void;
}) {
  const [etapaNombre, setEtapaNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/progresion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scoutProfileId, seccion, etapaNombre: etapaNombre.trim(), descripcion: descripcion.trim() || undefined }),
      });
      const d = (await res.json()) as { error?: string };
      if (!res.ok) { setError(d.error ?? 'No se pudo crear la etapa.'); return; }
      onCreada();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-panel/50 p-4" role="dialog" aria-modal aria-label="Nueva etapa">
      <form onSubmit={(e) => void submit(e)} className="w-full max-w-md space-y-4 rounded-2xl bg-surface p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">Nueva etapa · {SECTION_LABELS[seccion]}</h3>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-lg p-2 text-faint hover:bg-paper"><X size={18} /></button>
        </div>
        {error && <p className="rounded-lg bg-dangersoft px-3 py-2 text-sm font-semibold text-clay">{error}</p>}
        <input required autoFocus value={etapaNombre} onChange={(e) => setEtapaNombre(e.target.value)} placeholder="Nombre de la etapa *"
          className="w-full rounded-lg border border-linestrong p-3 text-sm outline-none focus:border-moss" />
        <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={2} placeholder="Descripción y criterios de logro…"
          className="w-full rounded-lg border border-linestrong p-3 text-sm outline-none focus:border-moss" />
        <button type="submit" disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-moss py-3 text-sm font-bold text-white disabled:opacity-60">
          {loading && <Loader2 className="animate-spin" size={16} />} Crear etapa
        </button>
      </form>
    </div>
  );
}
