'use client';
// src/app/(dashboard)/calendario/page.tsx — Agenda conectada a la base de datos
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, Tent } from 'lucide-react';
import { TIPO_EVENTO_LABELS } from '@/lib/labels';
import type { TipoEvento } from '@/types';

interface EventoRow {
  id: string;
  nombre: string;
  tipo: TipoEvento;
  fechaInicio: string;
  fechaFin: string;
  lugar: string | null;
  cancelado: boolean;
  grupo: { nombre: string; numeroGrupo: number } | null;
}

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function CalendarioPage() {
  const [cursor, setCursor]     = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [eventos, setEventos]   = useState<EventoRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [seleccionado, setSeleccionado] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/eventos')
      .then((r) => r.json())
      .then((d: { data?: EventoRow[] }) => setEventos(d.data ?? []))
      .catch(() => setEventos([]))
      .finally(() => setLoading(false));
  }, []);

  // Mapa día → eventos (un evento aparece en todos los días que abarca)
  const eventosPorDia = useMemo(() => {
    const map = new Map<string, EventoRow[]>();
    for (const ev of eventos) {
      const start = new Date(ev.fechaInicio);
      const end = new Date(ev.fechaFin);
      for (let d = new Date(start.getFullYear(), start.getMonth(), start.getDate()); d <= end; d.setDate(d.getDate() + 1)) {
        const key = dayKey(d);
        const arr = map.get(key) ?? [];
        arr.push(ev);
        map.set(key, arr);
      }
    }
    return map;
  }, [eventos]);

  const celdas = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // lunes = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: Array<{ key: string; day: number | null }> = [];
    for (let i = 0; i < firstWeekday; i++) cells.push({ key: `blank-${i}`, day: null });
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ key: dayKey(new Date(year, month, d)), day: d });
    }
    while (cells.length % 7 !== 0) cells.push({ key: `tail-${cells.length}`, day: null });
    return cells;
  }, [cursor]);

  const hoyKey = dayKey(new Date());
  const eventosSeleccionados = seleccionado ? eventosPorDia.get(seleccionado) ?? [] : [];

  const mesLabel = cursor.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });

  return (
    <main className="max-w-6xl p-5 lg:p-8">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-clay">Agenda nacional</p>
          <h1 className="mt-2 font-display text-3xl font-bold">Calendario</h1>
          <p className="mt-1 text-sm text-muted">Todos los eventos de la asociación en una sola vista.</p>
        </div>
        <Link href="/eventos" className="flex w-fit items-center gap-2 rounded-lg bg-moss px-4 py-2.5 text-sm font-bold text-white">
          <CalendarDays size={17} /> Nuevo evento
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        {/* ─── Mes ─── */}
        <section className="rounded-2xl border border-line bg-surface p-4 shadow-soft sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <button onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))}
              aria-label="Mes anterior" className="rounded-lg p-2 hover:bg-paper"><ChevronLeft size={19} /></button>
            <h2 className="font-display text-lg font-bold capitalize">{mesLabel}</h2>
            <button onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))}
              aria-label="Mes siguiente" className="rounded-lg p-2 hover:bg-paper"><ChevronRight size={19} /></button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-widest text-faint">
            {WEEKDAYS.map((d) => <div key={d} className="py-1">{d}</div>)}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {celdas.map(({ key, day }) => {
              if (day === null) return <div key={key} className="min-h-16 rounded-lg" />;
              const delDia = eventosPorDia.get(key) ?? [];
              const esHoy = key === hoyKey;
              const activo = seleccionado === key;
              return (
                <button
                  key={key}
                  onClick={() => setSeleccionado(activo ? null : key)}
                  aria-pressed={activo}
                  aria-label={`${day} — ${delDia.length} evento(s)`}
                  className={`min-h-16 rounded-lg border p-1.5 text-left align-top transition-colors ${
                    activo ? 'border-moss bg-fern/50' : delDia.length > 0 ? 'border-line bg-surface hover:border-moss' : 'border-transparent hover:bg-paper'
                  }`}
                >
                  <span className={`text-xs font-bold ${esHoy ? 'grid h-6 w-6 place-items-center rounded-full bg-moss text-white' : 'text-muted'}`}>
                    {day}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {delDia.slice(0, 2).map((ev) => (
                      <span key={ev.id}
                        className={`block truncate rounded px-1 py-0.5 text-[9px] font-bold leading-tight ${
                          ev.tipo === 'CAMPAMENTO' ? 'bg-[#fff3d6] text-warn' : 'bg-fern text-moss'
                        }`}>
                        {ev.nombre}
                      </span>
                    ))}
                    {delDia.length > 2 && (
                      <span className="block px-1 text-[9px] font-bold text-faint">+{delDia.length - 2} más</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ─── Detalle del día / próximos ─── */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-line bg-surface p-5 shadow-soft">
            <h2 className="font-display font-bold">
              {seleccionado
                ? new Date(`${seleccionado}T12:00:00`).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
                : 'Próximos eventos'}
            </h2>
            <div className="mt-3 space-y-2">
              {loading && <p className="text-sm text-faint">Cargando…</p>}
              {!loading && (seleccionado ? eventosSeleccionados : eventos.filter((e) => +new Date(e.fechaInicio) >= Date.now()).slice(0, 6)).map((ev) => (
                <Link key={ev.id} href="/eventos"
                  className="flex items-start gap-3 rounded-xl border border-line p-3 transition-colors hover:border-moss">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-fern text-moss">
                    <Tent size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold leading-snug">{ev.nombre}</p>
                    <p className="mt-0.5 text-[11px] text-faint">
                      {new Date(ev.fechaInicio).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}
                      {ev.lugar && <span className="block"><MapPin size={10} className="mr-0.5 inline" />{ev.lugar}</span>}
                    </p>
                    <span className="mt-1 inline-block rounded-full bg-paper px-2 py-0.5 text-[9px] font-bold uppercase text-muted">{TIPO_EVENTO_LABELS[ev.tipo]}</span>
                  </div>
                </Link>
              ))}
              {!loading && (seleccionado ? eventosSeleccionados : eventos.filter((e) => +new Date(e.fechaInicio) >= Date.now())).length === 0 && (
                <p className="rounded-xl bg-paper p-4 text-center text-sm text-faint">Nada programado.</p>
              )}
            </div>
          </div>
          <div className="rounded-2xl bg-panel p-5 text-sm text-[#c9d8cd]">
            <p className="font-bold uppercase tracking-widest text-[#8fb59e] text-[10px]">Tip de campo</p>
            <p className="mt-1.5">Los campamentos nacionales se programan con al menos 8 semanas de anticipación. Asegúrate de tener lista la responsiva firmada antes de abrir inscripciones.</p>
          </div>
        </aside>
      </div>
    </main>
  );
}
