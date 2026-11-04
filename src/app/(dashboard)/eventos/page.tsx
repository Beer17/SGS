'use client';
// src/app/(dashboard)/eventos/page.tsx — Gestión de eventos con datos reales
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Ban, CalendarDays, ChevronDown, ChevronUp, Download, FileText, Loader2,
  MapPin, Plus, Tent, Users, X,
} from 'lucide-react';
import { TIPO_EVENTO_LABELS } from '@/lib/labels';
import type { TipoEvento } from '@/types';
import { NuevoEventoModal } from '@/components/eventos/NuevoEventoModal';
import { InscribirMiembro } from '@/components/eventos/InscribirMiembro';

interface EventoRow {
  id: string;
  nombre: string;
  descripcion: string | null;
  tipo: TipoEvento;
  fechaInicio: string;
  fechaFin: string;
  lugar: string | null;
  cupoMaximo: number | null;
  requiereAutorizacion: boolean;
  cancelado: boolean;
  grupo: { nombre: string; numeroGrupo: number } | null;
  _count: { asistencias: number; inscripciones: number };
}

interface EventoDetalle extends EventoRow {
  cupoDisponible: number | null;
  logistica: {
    transporteInfo: string | null;
    lugarCampamento: string | null;
    equipoRequerido: string | null;
    presupuesto: string | null;
    notas: string | null;
  } | null;
  inscripciones: Array<{
    id: string;
    autorizacionParental: boolean;
    pagoCuota: boolean;
    scoutProfile: { id: string; nombres: string; apellidos: string; seccion: string };
  }>;
}

export default function EventosPage() {
  const [eventos, setEventos]   = useState<EventoRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [mostrarPasados, setMostrarPasados] = useState(false);
  const [modalNuevo, setModalNuevo] = useState(false);
  const [expandido, setExpandido]   = useState<string | null>(null);
  const [detalle, setDetalle]       = useState<EventoDetalle | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [cancelando, setCancelando] = useState<string | null>(null);
  const [error, setError]           = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/eventos');
      const d = (await res.json()) as { data?: EventoRow[] };
      setEventos(d.data ?? []);
    } catch {
      setError('No se pudieron cargar los eventos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const loadDetalle = useCallback(async (id: string) => {
    setDetalle(null);
    setCargandoDetalle(true);
    try {
      const res = await fetch(`/api/eventos/${id}`);
      const d = (await res.json()) as { data?: EventoDetalle };
      setDetalle(d.data ?? null);
    } finally {
      setCargandoDetalle(false);
    }
  }, []);

  const abrirDetalle = useCallback(async (id: string) => {
    if (expandido === id) { setExpandido(null); setDetalle(null); return; }
    setExpandido(id);
    await loadDetalle(id);
  }, [expandido, loadDetalle]);

  async function cancelarEvento(id: string) {
    if (!window.confirm('¿Cancelar este evento? Los inscritos verán el estatus actualizado.')) return;
    setCancelando(id);
    try {
      const res = await fetch(`/api/eventos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancelado: true }),
      });
      if (!res.ok) { const d = (await res.json()) as { error?: string }; setError(d.error ?? 'No se pudo cancelar.'); return; }
      await load();
      setExpandido(null); setDetalle(null);
    } finally {
      setCancelando(null);
    }
  }

  const ahora = Date.now();
  const proximos = eventos.filter((e) => new Date(e.fechaFin).getTime() >= ahora && !e.cancelado)
    .sort((a, b) => +new Date(a.fechaInicio) - +new Date(b.fechaInicio));
  const pasados = eventos.filter((e) => new Date(e.fechaFin).getTime() < ahora || e.cancelado)
    .sort((a, b) => +new Date(b.fechaInicio) - +new Date(a.fechaInicio));
  const visibles = mostrarPasados ? [...proximos, ...pasados] : proximos;

  return (
    <main className="max-w-6xl p-5 lg:p-8">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-clay">Agenda</p>
          <h1 className="mt-2 font-display text-3xl font-bold">Eventos y logística</h1>
          <p className="mt-1 text-sm text-[#718078]">Campamentos, reuniones, capacitaciones e inscripciones con cupo y autorización.</p>
        </div>
        <button onClick={() => setModalNuevo(true)}
          className="flex w-fit items-center gap-2 rounded-lg bg-moss px-4 py-2.5 text-sm font-bold text-white">
          <Plus size={17} /> Nuevo evento
        </button>
      </div>

      {error && <div role="alert" className="mb-4 rounded-lg bg-[#fdecea] px-4 py-3 text-sm font-semibold text-clay">{error}</div>}

      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wide text-[#829087]">{proximos.length} próximo(s) · {pasados.length} pasado(s)/cancelado(s)</p>
        <button onClick={() => setMostrarPasados((v) => !v)} className="text-xs font-bold text-moss">
          {mostrarPasados ? 'Solo próximos' : 'Incluir pasados/cancelados'}
        </button>
      </div>

      {loading ? (
        <div className="grid min-h-48 place-items-center"><Loader2 className="animate-spin text-moss" /></div>
      ) : visibles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#cbd8ca] bg-white p-12 text-center">
          <Tent className="mx-auto mb-3 text-moss" size={30} />
          <p className="font-bold">No hay eventos próximos</p>
          <p className="mt-1 text-sm text-[#829087]">Crea el primero con el botón “Nuevo evento”.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibles.map((ev) => {
            const abierto = expandido === ev.id;
            const inicio = new Date(ev.fechaInicio);
            return (
              <article key={ev.id} className={`overflow-hidden rounded-2xl border bg-white shadow-soft ${ev.cancelado ? 'border-[#f0d9d0] opacity-75' : 'border-[#e2e9df]'}`}>
                {/* Fila principal */}
                <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                  <div className="flex w-16 shrink-0 flex-col items-center rounded-xl bg-paper py-3">
                    <span className="font-display text-2xl font-bold leading-none text-moss">{inicio.getDate()}</span>
                    <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-clay">
                      {inicio.toLocaleString('es-MX', { month: 'short' })}
                    </span>
                    <span className="text-[10px] font-semibold text-[#829087]">{inicio.getFullYear()}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-lg font-bold leading-snug">{ev.nombre}</h2>
                      <span className="rounded-full bg-fern px-2.5 py-0.5 text-[10px] font-bold uppercase text-moss">{TIPO_EVENTO_LABELS[ev.tipo]}</span>
                      {ev.cancelado && <span className="rounded-full bg-[#fdecea] px-2.5 py-0.5 text-[10px] font-bold uppercase text-clay">Cancelado</span>}
                      {ev.requiereAutorizacion && <span className="rounded-full bg-[#fff5d9] px-2.5 py-0.5 text-[10px] font-bold uppercase text-[#a9790a]">Responsiva</span>}
                    </div>
                    <p className="mt-1 text-xs text-[#718078]">
                      {ev.lugar && <span className="mr-3 inline-flex items-center gap-1"><MapPin size={12} />{ev.lugar}</span>}
                      {ev.grupo ? `Grupo ${ev.grupo.numeroGrupo}` : 'Nacional / abierto'}
                      {' · '}{new Date(ev.fechaInicio).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })} → {new Date(ev.fechaFin).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-[#5c6f63]">
                      <Users size={12} className="mr-1 inline" />{ev._count.inscripciones}{ev.cupoMaximo ? `/${ev.cupoMaximo}` : ''} inscritos · {ev._count.asistencias} asistencias
                    </p>
                  </div>
                  <button onClick={() => void abrirDetalle(ev.id)}
                    className="flex shrink-0 items-center gap-1 rounded-lg border border-[#dfe7dc] px-3 py-2 text-xs font-bold text-moss"
                    aria-expanded={abierto}>
                    Gestionar {abierto ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>

                {/* Panel de gestión */}
                {abierto && (
                  <div className="border-t border-[#edf0ea] bg-paper/40 p-5">
                    {cargandoDetalle || !detalle || detalle.id !== ev.id ? (
                      <div className="grid min-h-24 place-items-center"><Loader2 className="animate-spin text-moss" /></div>
                    ) : (
                      <div className="grid gap-4 lg:grid-cols-2">
                        <div className="space-y-4">
                          {/* Autorizaciones y asistencia */}
                          <div className="rounded-xl border border-[#e2e9df] bg-white p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-xs font-bold uppercase tracking-wide text-[#5c6f63]">Asistencia</p>
                              <div className="flex gap-2">
                                <a href={`/api/eventos/${ev.id}/asistencia?format=csv`}
                                  className="flex items-center gap-1 rounded-lg border border-[#dfe7dc] px-3 py-1.5 text-[11px] font-bold text-[#5c6f63] hover:bg-paper">
                                  <Download size={12} /> CSV
                                </a>
                                <a href={`/api/eventos/${ev.id}/asistencia?format=pdf`} target="_blank" rel="noopener"
                                  className="flex items-center gap-1 rounded-lg border border-[#dfe7dc] px-3 py-1.5 text-[11px] font-bold text-[#5c6f63] hover:bg-paper">
                                  <FileText size={12} /> PDF
                                </a>
                                <Link href="/eventos/escaner"
                                  className="flex items-center gap-1 rounded-lg bg-ink px-3 py-1.5 text-[11px] font-bold text-white">
                                  Escáner
                                </Link>
                              </div>
                            </div>
                          </div>

                          <InscribirMiembro
                            eventoId={ev.id}
                            requiereAutorizacion={ev.requiereAutorizacion}
                            onInscrito={() => { void loadDetalle(ev.id); void load(); }}
                          />

                          {/* Lista de inscritos */}
                          {detalle.inscripciones.length > 0 && (
                            <div className="rounded-xl border border-[#e2e9df] bg-white p-4">
                              <p className="text-xs font-bold uppercase tracking-wide text-[#5c6f63]">Inscritos ({detalle.inscripciones.length}{detalle.cupoDisponible != null ? ` · quedan ${detalle.cupoDisponible} lugares` : ''})</p>
                              <ul className="mt-2 max-h-56 divide-y divide-[#f0f4ef] overflow-y-auto text-sm">
                                {detalle.inscripciones.map((i) => (
                                  <li key={i.id} className="flex items-center justify-between gap-2 py-2">
                                    <span className="min-w-0 truncate">{i.scoutProfile.apellidos}, {i.scoutProfile.nombres}</span>
                                    <span className="flex shrink-0 gap-1 text-[9px] font-bold uppercase">
                                      {ev.requiereAutorizacion && (
                                        i.autorizacionParental
                                          ? <span className="rounded bg-fern px-1.5 py-0.5 text-moss">Responsiva ✓</span>
                                          : <span className="rounded bg-[#fdecea] px-1.5 py-0.5 text-clay">Sin firma</span>
                                      )}
                                      {i.pagoCuota
                                        ? <span className="rounded bg-fern px-1.5 py-0.5 text-moss">Pagó</span>
                                        : <span className="rounded bg-[#fff5d9] px-1.5 py-0.5 text-[#a9790a]">Adeudo</span>}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        <div className="space-y-4">
                          {/* Logística */}
                          <LogisticaPanel eventoId={ev.id} logistica={detalle.logistica} />

                          {!ev.cancelado && (
                            <button onClick={() => void cancelarEvento(ev.id)} disabled={cancelando === ev.id}
                              className="flex items-center gap-2 rounded-lg border border-[#f0d9d0] px-4 py-2.5 text-xs font-bold text-clay hover:bg-[#fdf0ec] disabled:opacity-60">
                              {cancelando === ev.id ? <Loader2 className="animate-spin" size={14} /> : <Ban size={14} />} Cancelar evento
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {modalNuevo && <NuevoEventoModal onClose={() => setModalNuevo(false)} onCreated={() => { setModalNuevo(false); void load(); }} />}
    </main>
  );
}

/* ─── Panel de logística (ver / editar) ────────────────────────────────────── */
function LogisticaPanel({ eventoId, logistica }: {
  eventoId: string;
  logistica: EventoDetalle['logistica'];
}) {
  const [editando, setEditando] = useState(false);
  const [transporteInfo, setTransporteInfo] = useState(logistica?.transporteInfo ?? '');
  const [lugarCampamento, setLugarCampamento] = useState(logistica?.lugarCampamento ?? '');
  const [equipoRequerido, setEquipoRequerido] = useState(logistica?.equipoRequerido ?? '');
  const [presupuesto, setPresupuesto] = useState(logistica?.presupuesto ? String(Number(logistica.presupuesto)) : '');
  const [notas, setNotas]             = useState(logistica?.notas ?? '');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch(`/api/eventos/${eventoId}/logistica`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transporteInfo: transporteInfo.trim() || undefined,
          lugarCampamento: lugarCampamento.trim() || undefined,
          equipoRequerido: equipoRequerido.trim() || undefined,
          presupuesto: presupuesto ? Number(presupuesto) : undefined,
          notas: notas.trim() || undefined,
        }),
      });
      const d = (await res.json()) as { error?: string };
      if (!res.ok) { setError(d.error ?? 'No se pudo guardar.'); return; }
      setEditando(false);
    } finally {
      setLoading(false);
    }
  }

  if (!editando) {
    return (
      <div className="rounded-xl border border-[#e2e9df] bg-white p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wide text-[#5c6f63]">Logística y transporte</p>
          <button onClick={() => setEditando(true)} className="text-xs font-bold text-moss">{logistica ? 'Editar' : 'Completar'}</button>
        </div>
        {!logistica ? (
          <p className="mt-2 text-sm text-[#829087]">Sin información logística. Agrega transporte, lugar y equipo requerido.</p>
        ) : (
          <dl className="mt-3 space-y-2 text-sm">
            {logistica.transporteInfo && <div><dt className="text-[10px] font-bold uppercase text-[#a3b0a8]">Transporte</dt><dd>{logistica.transporteInfo}</dd></div>}
            {logistica.lugarCampamento && <div><dt className="text-[10px] font-bold uppercase text-[#a3b0a8]">Campamento</dt><dd>{logistica.lugarCampamento}</dd></div>}
            {logistica.equipoRequerido && <div><dt className="text-[10px] font-bold uppercase text-[#a3b0a8]">Equipo requerido</dt><dd className="font-mono text-xs">{logistica.equipoRequerido}</dd></div>}
            {logistica.presupuesto && <div><dt className="text-[10px] font-bold uppercase text-[#a3b0a8]">Presupuesto</dt><dd>${Number(logistica.presupuesto).toLocaleString('es-MX')}</dd></div>}
            {logistica.notas && <div><dt className="text-[10px] font-bold uppercase text-[#a3b0a8]">Notas</dt><dd className="text-[#5c6f63]">{logistica.notas}</dd></div>}
          </dl>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void guardar(e)} className="rounded-xl border border-[#e2e9df] bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wide text-[#5c6f63]">Editar logística</p>
        <button type="button" onClick={() => setEditando(false)} aria-label="Cerrar" className="rounded-lg p-1.5 text-[#829087] hover:bg-paper"><X size={16} /></button>
      </div>
      {error && <p className="mt-2 rounded-lg bg-[#fdecea] px-3 py-2 text-xs font-semibold text-clay">{error}</p>}
      <div className="mt-3 space-y-3 text-sm">
        <textarea value={transporteInfo} onChange={(e) => setTransporteInfo(e.target.value)} rows={2} placeholder="Transporte (autobuses, salidas, costos)…"
          className="w-full rounded-lg border border-[#dfe7dc] p-3 outline-none focus:border-moss" />
        <input value={lugarCampamento} onChange={(e) => setLugarCampamento(e.target.value)} placeholder="Lugar de campamento"
          className="w-full rounded-lg border border-[#dfe7dc] p-3 outline-none focus:border-moss" />
        <textarea value={equipoRequerido} onChange={(e) => setEquipoRequerido(e.target.value)} rows={2} placeholder='Equipo requerido (ej. ["Sleeping","Botiquín"])'
          className="w-full rounded-lg border border-[#dfe7dc] p-3 font-mono text-xs outline-none focus:border-moss" />
        <input type="number" min="0" step="0.01" value={presupuesto} onChange={(e) => setPresupuesto(e.target.value)} placeholder="Presupuesto MXN"
          className="w-full rounded-lg border border-[#dfe7dc] p-3 outline-none focus:border-moss" />
        <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} placeholder="Notas internas…"
          className="w-full rounded-lg border border-[#dfe7dc] p-3 outline-none focus:border-moss" />
        <button type="submit" disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-moss py-2.5 text-sm font-bold text-white disabled:opacity-60">
          {loading && <Loader2 className="animate-spin" size={15} />} Guardar logística
        </button>
      </div>
    </form>
  );
}
