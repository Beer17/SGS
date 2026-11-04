'use client';
// src/app/(dashboard)/inventario/page.tsx — Inventario real del grupo
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, CheckCircle2, HandHeart, Loader2, Package, Plus, Search, Undo2, X,
} from 'lucide-react';
import { estadoItemColor, formatCurrency } from '@/lib/utils';
import type { EstadoItem } from '@/types';

interface PrestamoAbierto {
  id: string;
  prestatarioNombre: string;
  fechaPrestamo: string;
  observaciones: string | null;
}
interface ItemRow {
  id: string;
  nombre: string;
  categoria: string | null;
  cantidad: number;
  estado: EstadoItem;
  ubicacion: string | null;
  valorUnitario: string | null;
  prestamos: PrestamoAbierto[];
}
interface GrupoOption { id: string; numeroGrupo: number; nombre: string }

const DIAS_PRESTAMO_ALERTA = 7;

export default function InventarioPage() {
  const [grupos, setGrupos]       = useState<GrupoOption[]>([]);
  const [grupoId, setGrupoId]     = useState('');
  const [items, setItems]         = useState<ItemRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [q, setQ]                 = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<'' | EstadoItem>('');
  const [modalAgregar, setModalAgregar] = useState(false);
  const [prestarItem, setPrestarItem]   = useState<ItemRow | null>(null);
  const [devolverItem, setDevolverItem] = useState<ItemRow | null>(null);

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
      const res = await fetch(`/api/inventario?grupoId=${grupoId}`);
      const d = (await res.json()) as { data?: ItemRow[] };
      setItems(d.data ?? []);
    } catch {
      setError('No se pudo cargar el inventario.');
    } finally {
      setLoading(false);
    }
  }, [grupoId]);

  useEffect(() => { void load(); }, [load]);

  const itemsFiltrados = useMemo(() => items.filter((i) => {
    if (estadoFiltro && i.estado !== estadoFiltro) return false;
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      return i.nombre.toLowerCase().includes(needle) || (i.categoria ?? '').toLowerCase().includes(needle);
    }
    return true;
  }), [items, q, estadoFiltro]);

  const valorTotal = useMemo(
    () => items.reduce((s, i) => s + Number(i.valorUnitario ?? 0) * i.cantidad, 0),
    [items],
  );
  const conteo = useMemo(() => {
    const map = new Map<EstadoItem, number>();
    for (const i of items) map.set(i.estado, (map.get(i.estado) ?? 0) + 1);
    return map;
  }, [items]);
  const prestamosVencidos = useMemo(() => items.flatMap((i) =>
    i.prestamos.filter((p) => (Date.now() - +new Date(p.fechaPrestamo)) / 86_400_000 > DIAS_PRESTAMO_ALERTA)
  ).length, [items]);

  return (
    <main className="max-w-7xl p-5 lg:p-8">
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-clay">Administración</p>
          <h1 className="mt-2 font-display text-3xl font-bold">Inventario del grupo</h1>
          <p className="mt-1 text-sm text-muted">Equipo, materiales y préstamos. Valor total: <span className="font-bold text-ink">{formatCurrency(valorTotal)}</span></p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select aria-label="Grupo" value={grupoId} onChange={(e) => setGrupoId(e.target.value)}
            className="rounded-lg border border-linestrong bg-surface px-3 py-2.5 text-sm font-semibold outline-none focus:border-moss">
            {grupos.map((g) => <option key={g.id} value={g.id}>Grupo {g.numeroGrupo} — {g.nombre}</option>)}
          </select>
          <button onClick={() => setModalAgregar(true)}
            className="flex items-center gap-2 rounded-lg bg-moss px-4 py-2.5 text-sm font-bold text-white">
            <Plus size={17} /> Agregar ítem
          </button>
        </div>
      </div>

      {error && <div role="alert" className="mb-4 rounded-lg bg-dangersoft px-4 py-3 text-sm font-semibold text-clay">{error}</div>}
      {prestamosVencidos > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-warnsoft px-4 py-3 text-sm font-semibold text-warn">
          <AlertTriangle size={17} /> {prestamosVencidos} préstamo(s) con más de {DIAS_PRESTAMO_ALERTA} días sin devolver.
        </div>
      )}

      {/* Resumen por estado */}
      <div className="mb-4 flex flex-wrap gap-2 text-xs font-bold">
        {(['DISPONIBLE', 'PRESTADO', 'MANTENIMIENTO', 'DANADO', 'BAJA'] as const).map((estado) => (
          <button key={estado}
            onClick={() => setEstadoFiltro((prev) => (prev === estado ? '' : estado))}
            className={`rounded-full px-3 py-1.5 transition-shadow ${estadoItemColor(estado)} ${estadoFiltro === estado ? 'ring-2 ring-ink/20' : ''}`}
            aria-pressed={estadoFiltro === estado}>
            {estado} ({conteo.get(estado) ?? 0})
          </button>
        ))}
      </div>

      {/* Buscador */}
      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" size={17} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre o categoría…"
          aria-label="Buscar en inventario"
          className="w-full rounded-lg border border-linestrong bg-surface py-2.5 pl-10 pr-4 text-sm outline-none focus:border-moss" />
      </div>

      {/* Tabla */}
      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-soft">
        {loading ? (
          <div className="grid min-h-48 place-items-center"><Loader2 className="animate-spin text-moss" /></div>
        ) : itemsFiltrados.length === 0 ? (
          <div className="grid min-h-48 place-items-center p-8 text-center">
            <div>
              <Package className="mx-auto mb-3 text-moss" size={30} />
              <p className="font-bold">Sin ítems{q || estadoFiltro ? ' con ese filtro' : ''}</p>
              <p className="mt-1 text-sm text-faint">Agrega el primer elemento con “Agregar ítem”.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[11px] font-bold uppercase tracking-wider text-faint">
                  <th className="px-5 py-3">Nombre</th>
                  <th className="hidden px-5 py-3 md:table-cell">Categoría</th>
                  <th className="px-5 py-3">Cant.</th>
                  <th className="hidden px-5 py-3 lg:table-cell">Valor unitario</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3">Préstamo abierto</th>
                  <th className="px-5 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {itemsFiltrados.map((item) => {
                  const prestamo = item.prestamos[0];
                  const dias = prestamo ? Math.floor((Date.now() - +new Date(prestamo.fechaPrestamo)) / 86_400_000) : null;
                  const vencido = dias != null && dias > DIAS_PRESTAMO_ALERTA;
                  return (
                    <tr key={item.id} className="transition-colors hover:bg-paper">
                      <td className="px-5 py-3">
                        <div className="font-semibold">{item.nombre}</div>
                        {item.ubicacion && <div className="text-[11px] text-faint">📍 {item.ubicacion}</div>}
                      </td>
                      <td className="hidden px-5 py-3 text-muted md:table-cell">{item.categoria ?? '—'}</td>
                      <td className="px-5 py-3 font-mono">{item.cantidad}</td>
                      <td className="hidden px-5 py-3 text-muted lg:table-cell">
                        {item.valorUnitario != null ? formatCurrency(Number(item.valorUnitario)) : '—'}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${estadoItemColor(item.estado)}`}>{item.estado}</span>
                      </td>
                      <td className="px-5 py-3 text-xs">
                        {prestamo ? (
                          <>
                            <span className="font-semibold">{prestamo.prestatarioNombre}</span>
                            <span className={`block ${vencido ? 'font-bold text-clay' : 'text-faint'}`}>hace {dias} día(s)</span>
                          </>
                        ) : '—'}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {item.estado === 'DISPONIBLE' && (
                          <button onClick={() => setPrestarItem(item)}
                            className="inline-flex items-center gap-1 rounded-lg border border-moss px-3 py-2 text-[11px] font-bold text-moss hover:bg-fern">
                            <HandHeart size={13} /> Prestar
                          </button>
                        )}
                        {item.estado === 'PRESTADO' && (
                          <button onClick={() => setDevolverItem(item)}
                            className="inline-flex items-center gap-1 rounded-lg bg-moss px-3 py-2 text-[11px] font-bold text-white">
                            <Undo2 size={13} /> Devolver
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalAgregar && grupoId && (
        <AgregarItemModal grupoId={grupoId} onClose={() => setModalAgregar(false)} onSaved={() => { setModalAgregar(false); void load(); }} />
      )}
      {prestarItem && (
        <PrestarModal item={prestarItem} onClose={() => setPrestarItem(null)} onSaved={() => { setPrestarItem(null); void load(); }} />
      )}
      {devolverItem && (
        <DevolverModal item={devolverItem} onClose={() => setDevolverItem(null)} onSaved={() => { setDevolverItem(null); void load(); }} />
      )}
    </main>
  );
}

/* ─── Modal shell ─────────────────────────────────────────────────────────── */
function ModalShell({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-panel/50 p-4" role="dialog" aria-modal aria-label={title}>
      <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">{title}</h3>
          <button onClick={onClose} aria-label="Cerrar" className="rounded-lg p-2 text-faint hover:bg-paper"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ─── Agregar ítem ────────────────────────────────────────────────────────── */
function AgregarItemModal({ grupoId, onClose, onSaved }: { grupoId: string; onClose: () => void; onSaved: () => void }) {
  const [nombre, setNombre]         = useState('');
  const [categoria, setCategoria]   = useState('');
  const [cantidad, setCantidad]     = useState('1');
  const [valorUnitario, setValorUnitario] = useState('');
  const [ubicacion, setUbicacion]   = useState('');
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/inventario', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grupoId, nombre: nombre.trim(),
          categoria: categoria.trim() || undefined,
          cantidad: Number(cantidad),
          valorUnitario: valorUnitario ? Number(valorUnitario) : undefined,
          ubicacion: ubicacion.trim() || undefined,
        }),
      });
      const d = (await res.json()) as { error?: string };
      if (!res.ok) { setError(d.error ?? 'No se pudo guardar.'); return; }
      onSaved();
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalShell title="Agregar ítem" onClose={onClose}>
      <form onSubmit={(e) => void submit(e)} className="space-y-3">
        {error && <p className="rounded-lg bg-dangersoft px-3 py-2 text-sm font-semibold text-clay">{error}</p>}
        <input required value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre del ítem *"
          className="w-full rounded-lg border border-linestrong p-3 text-sm outline-none focus:border-moss" />
        <input value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="Categoría (Camping, Cocina…)"
          className="w-full rounded-lg border border-linestrong p-3 text-sm outline-none focus:border-moss" />
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs font-bold text-muted">Cantidad
            <input required type="number" min="1" value={cantidad} onChange={(e) => setCantidad(e.target.value)}
              className="mt-1 w-full rounded-lg border border-linestrong p-3 text-sm outline-none focus:border-moss" />
          </label>
          <label className="text-xs font-bold text-muted">Valor unitario MXN
            <input type="number" min="0" step="0.01" value={valorUnitario} onChange={(e) => setValorUnitario(e.target.value)} placeholder="0.00"
              className="mt-1 w-full rounded-lg border border-linestrong p-3 text-sm outline-none focus:border-moss" />
          </label>
        </div>
        <input value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} placeholder="Ubicación (Bodega parroquia…)"
          className="w-full rounded-lg border border-linestrong p-3 text-sm outline-none focus:border-moss" />
        <button type="submit" disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-moss py-3 text-sm font-bold text-white disabled:opacity-60">
          {loading && <Loader2 className="animate-spin" size={16} />} Guardar ítem
        </button>
      </form>
    </ModalShell>
  );
}

/* ─── Prestar ─────────────────────────────────────────────────────────────── */
function PrestarModal({ item, onClose, onSaved }: { item: ItemRow; onClose: () => void; onSaved: () => void }) {
  const [prestatarioNombre, setPrestatarioNombre] = useState('');
  const [observaciones, setObservaciones]         = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch(`/api/inventario/${item.id}/prestar`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prestatarioNombre: prestatarioNombre.trim(), observaciones: observaciones.trim() || undefined }),
      });
      const d = (await res.json()) as { error?: string };
      if (!res.ok) { setError(d.error ?? 'No se pudo prestar.'); return; }
      onSaved();
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalShell title={`Prestar: ${item.nombre}`} onClose={onClose}>
      <form onSubmit={(e) => void submit(e)} className="space-y-3">
        {error && <p className="rounded-lg bg-dangersoft px-3 py-2 text-sm font-semibold text-clay">{error}</p>}
        <input required autoFocus value={prestatarioNombre} onChange={(e) => setPrestatarioNombre(e.target.value)}
          placeholder="¿Quién lo recibe? (nombre y grupo) *"
          className="w-full rounded-lg border border-linestrong p-3 text-sm outline-none focus:border-moss" />
        <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} rows={2}
          placeholder="Observaciones (para qué, fecha de devolución estimada…)"
          className="w-full rounded-lg border border-linestrong p-3 text-sm outline-none focus:border-moss" />
        <button type="submit" disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-moss py-3 text-sm font-bold text-white disabled:opacity-60">
          {loading && <Loader2 className="animate-spin" size={16} />} Registrar préstamo
        </button>
      </form>
    </ModalShell>
  );
}

/* ─── Devolver ────────────────────────────────────────────────────────────── */
function DevolverModal({ item, onClose, onSaved }: { item: ItemRow; onClose: () => void; onSaved: () => void }) {
  const [estadoFinal, setEstadoFinal] = useState<'DISPONIBLE' | 'MANTENIMIENTO' | 'DANADO'>('DISPONIBLE');
  const [observaciones, setObservaciones] = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const prestamo = item.prestamos[0];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch(`/api/inventario/${item.id}/devolver`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estadoFinal, observaciones: observaciones.trim() || undefined }),
      });
      const d = (await res.json()) as { error?: string };
      if (!res.ok) { setError(d.error ?? 'No se pudo devolver.'); return; }
      onSaved();
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalShell title={`Devolver: ${item.nombre}`} onClose={onClose}>
      <form onSubmit={(e) => void submit(e)} className="space-y-3">
        {error && <p className="rounded-lg bg-dangersoft px-3 py-2 text-sm font-semibold text-clay">{error}</p>}
        {prestamo && (
          <p className="rounded-lg bg-paper px-3 py-2 text-xs text-muted">
            Prestado a <span className="font-bold">{prestamo.prestatarioNombre}</span> el{' '}
            {new Date(prestamo.fechaPrestamo).toLocaleDateString('es-MX')}.
          </p>
        )}
        <fieldset>
          <legend className="text-xs font-bold uppercase text-faint">Estado al devolver</legend>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            {([
              ['DISPONIBLE', 'Buen estado'],
              ['MANTENIMIENTO', 'Requiere servicio'],
              ['DANADO', 'Dañado'],
            ] as const).map(([valor, label]) => (
              <label key={valor}
                className={`cursor-pointer rounded-lg border p-2.5 text-center text-[11px] font-bold ${estadoFinal === valor ? 'border-moss bg-fern text-moss' : 'border-linestrong text-muted'}`}>
                <input type="radio" name="estadoFinal" value={valor} checked={estadoFinal === valor}
                  onChange={() => setEstadoFinal(valor)} className="sr-only" />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} rows={2}
          placeholder="Observaciones de la devolución…"
          className="w-full rounded-lg border border-linestrong p-3 text-sm outline-none focus:border-moss" />
        <button type="submit" disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-moss py-3 text-sm font-bold text-white disabled:opacity-60">
          {loading ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />} Confirmar devolución
        </button>
      </form>
    </ModalShell>
  );
}
