'use client';
// src/app/(dashboard)/censo/page.tsx
import { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronRight, Plus, Search, Users } from 'lucide-react';
import { estatusRegistroColor } from '@/lib/utils';
import type { RegistroStatus, Seccion } from '@/types';
import { SECTION_LABELS, SECTIONS } from '@/types';

interface MiembroRow {
  id: string;
  nombres: string;
  apellidos: string;
  seccion: Seccion;
  estatusRegistro: RegistroStatus;
  grupo: { nombre: string; numeroGrupo: number };
  provincia: { nombre: string };
}

interface ApiResponse {
  data: MiembroRow[];
  total: number;
  pages: number;
}

function CensoContent() {
  const searchParams = useSearchParams();
  const [miembros, setMiembros] = useState<MiembroRow[]>([]);
  const [total, setTotal]       = useState(0);
  const [pages, setPages]       = useState(1);
  const [page, setPage]         = useState(1);
  const [q, setQ]               = useState(searchParams.get('q') ?? '');
  const [seccion, setSeccion]   = useState(searchParams.get('seccion') ?? '');
  const [estatus, setEstatus]   = useState(searchParams.get('estatus') ?? '');
  const [grupoId]               = useState(searchParams.get('grupoId') ?? '');
  const [loading, setLoading]   = useState(true);

  const fetchMiembros = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20', q });
      if (seccion) params.set('seccion', seccion);
      if (estatus) params.set('estatus', estatus);
      if (grupoId) params.set('grupoId', grupoId);
      const res = await fetch(`/api/miembros?${params.toString()}`);
      const data = (await res.json()) as ApiResponse;
      setMiembros(data.data ?? []);
      setTotal(data.total ?? 0);
      setPages(data.pages ?? 1);
    } catch {
      setMiembros([]);
    } finally {
      setLoading(false);
    }
  }, [page, q, seccion, estatus, grupoId]);

  useEffect(() => { void fetchMiembros(); }, [fetchMiembros]);

  return (
    <main className="p-5 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-clay">Administración</p>
          <h1 className="mt-2 font-display text-3xl font-bold">Censo scout</h1>
          <p className="mt-2 text-sm text-[#718078]">{total} miembros registrados en el sistema.</p>
        </div>
        <Link href="/censo/nuevo"
          className="flex w-fit items-center gap-2 rounded-lg bg-moss px-4 py-2.5 text-sm font-bold text-white">
          <Plus size={17} />Nuevo miembro
        </Link>
      </div>

      {/* Buscador y filtros */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#91a097]" size={17} />
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            placeholder="Buscar por nombre o CURP…"
            className="w-full rounded-lg border border-[#dfe7dc] bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-moss"
          />
        </div>
        <select
          aria-label="Filtrar por sección"
          value={seccion}
          onChange={(e) => { setSeccion(e.target.value); setPage(1); }}
          className="rounded-lg border border-[#dfe7dc] bg-white px-3 py-2.5 text-sm outline-none focus:border-moss"
        >
          <option value="">Todas las secciones</option>
          {SECTIONS.map((s) => <option key={s} value={s}>{SECTION_LABELS[s]}</option>)}
        </select>
        <select
          aria-label="Filtrar por estatus"
          value={estatus}
          onChange={(e) => { setEstatus(e.target.value); setPage(1); }}
          className="rounded-lg border border-[#dfe7dc] bg-white px-3 py-2.5 text-sm outline-none focus:border-moss"
        >
          <option value="">Todos los estatus</option>
          <option value="ACTIVO">Activo</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="VENCIDO">Vencido</option>
          <option value="BAJA">Baja</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="overflow-hidden rounded-2xl border border-[#e2e9df] bg-white shadow-soft">
        {loading ? (
          <div className="grid min-h-64 place-items-center">
            <div className="text-sm text-[#829087]">Cargando…</div>
          </div>
        ) : miembros.length === 0 ? (
          <div className="grid min-h-64 place-items-center">
            <div className="text-center">
              <Users className="mx-auto mb-3 text-moss" size={30} />
              <p className="font-bold">Sin resultados</p>
              <p className="mt-1 text-sm text-[#829087]">
                {q ? 'Intenta con otro término de búsqueda.' : 'Agrega el primer miembro.'}
              </p>
            </div>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#edf0ea] text-left text-xs font-bold uppercase tracking-wider text-[#829087]">
                <th className="px-5 py-3">Nombre</th>
                <th className="hidden px-5 py-3 md:table-cell">Sección</th>
                <th className="hidden px-5 py-3 lg:table-cell">Grupo / Provincia</th>
                <th className="px-5 py-3">Estatus</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f4ef]">
              {miembros.map((m) => (
                <tr key={m.id} className="transition-colors hover:bg-paper">
                  <td className="px-5 py-3 font-semibold">{m.apellidos}, {m.nombres}</td>
                  <td className="hidden px-5 py-3 text-[#718078] md:table-cell">{SECTION_LABELS[m.seccion]}</td>
                  <td className="hidden px-5 py-3 text-[#718078] lg:table-cell">
                    Grupo {m.grupo.numeroGrupo} · {m.provincia.nombre}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${estatusRegistroColor(m.estatusRegistro)}`}>
                      {m.estatusRegistro}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link href={`/ficha/${m.id}`} className="inline-flex items-center gap-1 text-xs font-bold text-moss hover:underline">
                      Ver ficha <ChevronRight size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginación */}
      {pages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="rounded-lg border border-[#dfe7dc] px-3 py-2 text-sm font-bold disabled:opacity-40">
            ← Anterior
          </button>
          <span className="text-sm text-[#829087]">Página {page} de {pages}</span>
          <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}
            className="rounded-lg border border-[#dfe7dc] px-3 py-2 text-sm font-bold disabled:opacity-40">
            Siguiente →
          </button>
        </div>
      )}
    </main>
  );
}

export default function CensoPage() {
  return (
    <Suspense>
      <CensoContent />
    </Suspense>
  );
}
