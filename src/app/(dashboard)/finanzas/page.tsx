'use client';
// src/app/(dashboard)/finanzas/page.tsx — Dashboard financiero real
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownCircle, ArrowUpCircle, CalendarClock, CheckCircle2, Download, Loader2,
  Plus, Receipt, TrendingUp, Users, Wallet, X,
} from 'lucide-react';
import { estatusCuotaColor, formatCurrency, formatDate, tipoMovimientoColor, tipoMovimientoPrefix } from '@/lib/utils';
import type { CuotaItem, MovimientoItem, TipoMovimiento } from '@/types';

interface CuotaApiItem extends Omit<CuotaItem, 'scoutId' | 'scoutNombre'> {
  id: string;
  concepto: string;
  scoutProfile: {
    id: string;
    nombres: string;
    apellidos: string;
    seccion: string;
    grupo: { nombre: string; numeroGrupo: number };
  };
}
interface MovimientosData {
  data: MovimientoItem[];
  resumen: { ingresos: number; egresos: number; balance: number };
}
interface GrupoOption { id: string; numeroGrupo: number; nombre: string }

const CICLO_ACTUAL = '2026-2027';

export default function FinanzasPage() {
  const [grupos, setGrupos]         = useState<GrupoOption[]>([]);
  const [grupoId, setGrupoId]       = useState('');
  const [cuotas, setCuotas]         = useState<CuotaApiItem[]>([]);
  const [totalRecaudado, setTotalRecaudado] = useState(0);
  const [pendientes, setPendientes] = useState(0);
  const [movData, setMovData]       = useState<MovimientosData | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [filtro, setFiltro]         = useState<'TODOS' | 'PENDIENTE' | 'VENCIDA' | 'PAGADA'>('TODOS');
  const [cobrando, setCobrando]     = useState<string | null>(null);
  const [modalMov, setModalMov]     = useState(false);
  const [modalGenerar, setModalGenerar] = useState(false);

  useEffect(() => {
    fetch('/api/grupos')
      .then((r) => r.json())
      .then((d: { data?: GrupoOption[] }) => {
        const list = d.data ?? [];
        setGrupos(list);
        setGrupoId((prev) => prev || list[0]?.id || '');
      })
      .catch(() => setError('No se pudieron cargar los grupos.'));
  }, []);

  const load = useCallback(async () => {
    if (!grupoId) return;
    setLoading(true);
    setError('');
    try {
      const [c, m] = await Promise.all([
        fetch(`/api/finanzas/cuotas?grupoId=${grupoId}&ciclo=${CICLO_ACTUAL}`).then((r) => r.json()),
        fetch(`/api/finanzas/movimientos?grupoId=${grupoId}`).then((r) => r.json()),
      ]);
      setCuotas(c.data ?? []);
      setTotalRecaudado(c.totalRecaudado ?? 0);
      setPendientes(c.pendientes ?? 0);
      setMovData(m);
    } catch {
      setError('Error al cargar los datos financieros.');
    } finally {
      setLoading(false);
    }
  }, [grupoId]);

  useEffect(() => { void load(); }, [load]);

  const cuotasFiltradas = useMemo(
    () => cuotas.filter((c) => (filtro === 'TODOS' ? true : c.estatus === filtro)),
    [cuotas, filtro],
  );

  async function cobrar(id: string) {
    setCobrando(id);
    try {
      const res = await fetch(`/api/finanzas/cuotas/${id}/pagar`, { method: 'POST' });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        setError(d.error ?? 'No se pudo registrar el pago.');
      } else {
        window.open(`/api/finanzas/cuotas/${id}/comprobante`, '_blank', 'noopener');
        await load();
      }
    } finally {
      setCobrando(null);
    }
  }

  const resumen = movData?.resumen;
  const balance = resumen?.balance ?? 0;

  return (
    <main className="max-w-7xl p-5 lg:p-8">
      {/* Encabezado + selector de grupo */}
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-clay">Administración</p>
          <h1 className="mt-2 font-display text-3xl font-bold">Finanzas y Cuotas</h1>
          <p className="mt-1 text-sm text-[#718078]">Ciclo {CICLO_ACTUAL} · pagos, cobros, ingresos y egresos del grupo.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Grupo"
            value={grupoId}
            onChange={(e) => setGrupoId(e.target.value)}
            className="rounded-lg border border-[#dfe7dc] bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-moss"
          >
            {grupos.map((g) => <option key={g.id} value={g.id}>Grupo {g.numeroGrupo} — {g.nombre}</option>)}
          </select>
          <button onClick={() => setModalGenerar(true)}
            className="flex items-center gap-2 rounded-lg border border-moss px-4 py-2.5 text-sm font-bold text-moss hover:bg-fern">
            <Users size={17} /> Generar cuotas del ciclo
          </button>
          <button onClick={() => setModalMov(true)}
            className="flex items-center gap-2 rounded-lg bg-moss px-4 py-2.5 text-sm font-bold text-white">
            <Plus size={17} /> Registrar movimiento
          </button>
        </div>
      </div>

      {error && <div role="alert" className="mb-4 rounded-lg bg-[#fdecea] px-4 py-3 text-sm font-semibold text-clay">{error}</div>}

      {/* Resumen */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Recaudado (ciclo)', value: formatCurrency(totalRecaudado), icon: TrendingUp, tone: 'text-moss bg-fern' },
          { label: 'Cuotas pendientes/vencidas', value: String(pendientes), icon: CalendarClock, tone: 'text-[#a9790a] bg-[#fff5d9]' },
          { label: 'Balance del grupo', value: formatCurrency(balance), icon: Wallet, tone: balance >= 0 ? 'text-moss bg-fern' : 'text-clay bg-[#fdecea]' },
          { label: 'Movimientos registrados', value: String(movData?.data.length ?? 0), icon: Receipt, tone: 'text-[#3a5aa8] bg-[#e8f0ff]' },
        ].map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="rounded-2xl border border-[#e2e9df] bg-white p-5 shadow-soft">
            <div className={`mb-4 grid h-10 w-10 place-items-center rounded-xl ${tone}`}><Icon size={19} /></div>
            <div className="font-display text-2xl font-bold">{value}</div>
            <div className="mt-1 text-xs text-[#718078]">{label}</div>
          </div>
        ))}
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        {/* Tabla de cuotas */}
        <section className="overflow-hidden rounded-2xl border border-[#e2e9df] bg-white shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf0ea] px-5 py-4">
            <h2 className="font-display font-bold">Estado de cuenta por miembro</h2>
            <div className="flex gap-1 rounded-lg bg-paper p-1 text-xs font-bold">
              {(['TODOS', 'PENDIENTE', 'VENCIDA', 'PAGADA'] as const).map((f) => (
                <button key={f} onClick={() => setFiltro(f)}
                  className={`rounded-md px-3 py-1.5 ${filtro === f ? 'bg-white text-moss shadow-sm' : 'text-[#718078]'}`}>
                  {f === 'TODOS' ? 'Todas' : f}
                </button>
              ))}
            </div>
          </div>
          {loading ? (
            <div className="grid min-h-48 place-items-center text-sm text-[#829087]"><Loader2 className="animate-spin" /></div>
          ) : cuotasFiltradas.length === 0 ? (
            <p className="p-6 text-sm text-[#829087]">No hay cuotas con este filtro. Usa “Generar cuotas del ciclo” para crearlas.</p>
          ) : (
            <div className="max-h-[560px] overflow-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="sticky top-0 bg-white text-left text-[11px] uppercase tracking-wider text-[#829087]">
                  <tr className="border-b border-[#edf0ea]">
                    <th className="px-5 py-3">Miembro</th>
                    <th className="px-5 py-3">Concepto</th>
                    <th className="px-5 py-3 text-right">Monto</th>
                    <th className="px-5 py-3">Estatus</th>
                    <th className="px-5 py-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f4ef]">
                  {cuotasFiltradas.map((c) => (
                    <tr key={c.id} className="hover:bg-paper/60">
                      <td className="px-5 py-3">
                        <div className="font-semibold">{c.scoutProfile.apellidos}, {c.scoutProfile.nombres}</div>
                        <div className="text-[11px] text-[#829087]">{c.scoutProfile.seccion} · Grupo {c.scoutProfile.grupo.numeroGrupo}</div>
                      </td>
                      <td className="max-w-44 truncate px-5 py-3 text-[#5c6f63]" title={c.concepto}>{c.concepto}</td>
                      <td className="px-5 py-3 text-right font-mono font-semibold">{formatCurrency(Number(c.monto))}</td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${estatusCuotaColor(c.estatus)}`}>{c.estatus}</span>
                        {c.fechaVencimiento && c.estatus !== 'PAGADA' && (
                          <span className="mt-1 block text-[10px] text-[#829087]">Vence {formatDate(c.fechaVencimiento)}</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {c.estatus === 'PAGADA' ? (
                          <a href={`/api/finanzas/cuotas/${c.id}/comprobante`} target="_blank" rel="noopener"
                            className="inline-flex items-center gap-1 text-xs font-bold text-moss hover:underline">
                            <Download size={13} /> Comprobante
                          </a>
                        ) : (
                          <button onClick={() => void cobrar(c.id)} disabled={cobrando === c.id}
                            className="inline-flex items-center gap-1 rounded-lg bg-moss px-3 py-2 text-xs font-bold text-white disabled:opacity-60">
                            {cobrando === c.id ? <Loader2 className="animate-spin" size={13} /> : <CheckCircle2 size={13} />} Cobrar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Movimientos */}
        <section className="rounded-2xl border border-[#e2e9df] bg-white p-6 shadow-soft">
          <h2 className="font-display font-bold">Ingresos y egresos</h2>
          {resumen && (
            <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
              <div className="rounded-xl bg-fern/60 p-3">
                <ArrowDownCircle className="mx-auto text-moss" size={18} />
                <p className="mt-1 font-bold text-moss">{formatCurrency(resumen.ingresos)}</p>
                <p className="text-[10px] uppercase text-[#5c6f63]">Ingresos</p>
              </div>
              <div className="rounded-xl bg-[#fdecea]/70 p-3">
                <ArrowUpCircle className="mx-auto text-clay" size={18} />
                <p className="mt-1 font-bold text-clay">{formatCurrency(resumen.egresos)}</p>
                <p className="text-[10px] uppercase text-[#7a4a3a]">Egresos</p>
              </div>
            </div>
          )}
          <ul className="mt-4 divide-y divide-[#f0f4ef]">
            {movData?.data.length === 0 && <li className="py-4 text-sm text-[#829087]">Sin movimientos registrados.</li>}
            {movData?.data.slice(0, 12).map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-semibold" title={m.concepto}>{m.concepto}</p>
                  <p className="text-[10px] uppercase tracking-wide text-[#a3b0a8]">{m.categoria ?? 'General'} · {formatDate(m.fecha)}</p>
                </div>
                <span className={`shrink-0 font-mono font-bold ${tipoMovimientoColor(m.tipo)}`}>
                  {tipoMovimientoPrefix(m.tipo)}{formatCurrency(m.monto)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {modalMov && <MovimientoModal grupoId={grupoId} onClose={() => setModalMov(false)} onSaved={() => { setModalMov(false); void load(); }} />}
      {modalGenerar && <GenerarCuotasModal onClose={() => setModalGenerar(false)} onSaved={() => { setModalGenerar(false); void load(); }} />}
    </main>
  );
}

/* ─── Modal: registrar movimiento ─────────────────────────────────────────── */
function MovimientoModal({ grupoId, onClose, onSaved }: { grupoId: string; onClose: () => void; onSaved: () => void }) {
  const [tipo, setTipo]         = useState<TipoMovimiento>('INGRESO');
  const [concepto, setConcepto] = useState('');
  const [monto, setMonto]       = useState('');
  const [categoria, setCategoria] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/finanzas/movimientos', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grupoId, tipo, concepto: concepto.trim(), monto: Number(monto), categoria: categoria.trim() || undefined }),
      });
      const d = (await res.json()) as { error?: string };
      if (!res.ok) { setError(d.error ?? 'No se pudo guardar.'); return; }
      onSaved();
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalShell title="Registrar movimiento" onClose={onClose}>
      <form onSubmit={(e) => void submit(e)} className="space-y-4">
        {error && <p className="rounded-lg bg-[#fdecea] px-3 py-2 text-sm font-semibold text-clay">{error}</p>}
        <div className="grid grid-cols-2 gap-2">
          {(['INGRESO', 'EGRESO'] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTipo(t)}
              className={`rounded-lg border px-3 py-2.5 text-sm font-bold ${tipo === t ? (t === 'INGRESO' ? 'border-moss bg-fern text-moss' : 'border-clay bg-[#fdecea] text-clay') : 'border-[#dfe7dc] text-[#718078]'}`}>
              {t === 'INGRESO' ? '↓ Ingreso' : '↑ Egreso'}
            </button>
          ))}
        </div>
        <input required value={concepto} onChange={(e) => setConcepto(e.target.value)} placeholder="Concepto (ej. Venta de artesanías)"
          className="w-full rounded-lg border border-[#dfe7dc] p-3 text-sm outline-none focus:border-moss" />
        <input required type="number" min="1" step="0.01" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="Monto (MXN)"
          className="w-full rounded-lg border border-[#dfe7dc] p-3 text-sm outline-none focus:border-moss" />
        <input value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="Categoría (Cuotas, Materiales, Transporte…)"
          className="w-full rounded-lg border border-[#dfe7dc] p-3 text-sm outline-none focus:border-moss" />
        <button type="submit" disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-moss py-3 text-sm font-bold text-white disabled:opacity-60">
          {loading && <Loader2 className="animate-spin" size={17} />} Guardar movimiento
        </button>
      </form>
    </ModalShell>
  );
}

/* ─── Modal: generar cuotas masivas ───────────────────────────────────────── */
function GenerarCuotasModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [concepto, setConcepto] = useState(`Membresía ciclo ${CICLO_ACTUAL}`);
  const [monto, setMonto]       = useState('850');
  const [dias, setDias]         = useState('30');
  const [error, setError]       = useState('');
  const [ok, setOk]             = useState('');
  const [loading, setLoading]   = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setOk(''); setLoading(true);
    try {
      const res = await fetch('/api/finanzas/cuotas/generar', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ciclo: CICLO_ACTUAL, concepto: concepto.trim(), monto: Number(monto), tipo: 'MEMBRESIA', diasVencimiento: Number(dias) }),
      });
      const d = (await res.json()) as { created?: number; message?: string; error?: string };
      if (!res.ok) { setError(d.error ?? 'No se pudo generar.'); return; }
      setOk(d.message ?? `Se generaron ${d.created ?? 0} cuotas pendientes.`);
      setTimeout(onSaved, 1200);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalShell title="Generar cuotas del ciclo" onClose={onClose}>
      <form onSubmit={(e) => void submit(e)} className="space-y-4">
        {error && <p className="rounded-lg bg-[#fdecea] px-3 py-2 text-sm font-semibold text-clay">{error}</p>}
        {ok && <p className="rounded-lg bg-fern px-3 py-2 text-sm font-bold text-moss">{ok}</p>}
        <p className="text-xs text-[#718078]">
          Crea una cuota PENDIENTE para cada miembro ACTIVO que aún no tenga una de MEMBRESÍA en el ciclo {CICLO_ACTUAL}. No duplica existentes.
        </p>
        <input required value={concepto} onChange={(e) => setConcepto(e.target.value)} placeholder="Concepto"
          className="w-full rounded-lg border border-[#dfe7dc] p-3 text-sm outline-none focus:border-moss" />
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs font-bold text-[#5c6f63]">Monto MXN
            <input required type="number" min="1" value={monto} onChange={(e) => setMonto(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#dfe7dc] p-3 text-sm outline-none focus:border-moss" />
          </label>
          <label className="text-xs font-bold text-[#5c6f63]">Vence en (días)
            <input required type="number" min="1" value={dias} onChange={(e) => setDias(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#dfe7dc] p-3 text-sm outline-none focus:border-moss" />
          </label>
        </div>
        <button type="submit" disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-moss py-3 text-sm font-bold text-white disabled:opacity-60">
          {loading && <Loader2 className="animate-spin" size={17} />} Generar cuotas
        </button>
      </form>
    </ModalShell>
  );
}

/* ─── Modal shell ─────────────────────────────────────────────────────────── */
function ModalShell({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4" role="dialog" aria-modal aria-label={title}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">{title}</h3>
          <button onClick={onClose} aria-label="Cerrar" className="rounded-lg p-2 text-[#829087] hover:bg-paper"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
