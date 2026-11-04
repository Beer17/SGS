'use client';
// src/app/(dashboard)/grupos/page.tsx — Grupos reales desde la base de datos
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, Loader2, Plus, Users, X } from 'lucide-react';
import { useSession } from '@/hooks/useSession';

interface GrupoRow {
  id: string;
  numeroGrupo: number;
  nombre: string;
  provinciaId: string;
  provincia: { nombre: string; region: string };
  _count: { scouts: number };
}
interface ProvinciaRow {
  id: string;
  nombre: string;
  region: string;
  _count: { grupos: number };
}

export default function GruposPage() {
  const { user } = useSession();
  const puedeCrear = user ? ['ADMIN', 'NACIONAL', 'PROVINCIA'].includes(user.role) : false;

  const [grupos, setGrupos]         = useState<GrupoRow[]>([]);
  const [provincias, setProvincias] = useState<ProvinciaRow[]>([]);
  const [loading, setLoading]       = useState(true);
  const [modalNuevo, setModalNuevo] = useState(false);
  const [error, setError]           = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/grupos').then((r) => r.json()),
      fetch('/api/provincias').then((r) => r.json()),
    ]).then(([g, p]: [{ data?: GrupoRow[] }, { data?: ProvinciaRow[] }]) => {
      setGrupos(g.data ?? []);
      setProvincias(p.data ?? []);
    }).catch(() => setError('No se pudieron cargar grupos y provincias.'))
      .finally(() => setLoading(false));
  }, []);

  const porProvincia = provincias
    .map((p) => ({ provincia: p, grupos: grupos.filter((g) => g.provinciaId === p.id) }))
    .filter(({ grupos }) => grupos.length > 0);

  return (
    <main className="p-5 lg:p-8">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-clay">Estructura territorial</p>
          <h1 className="mt-2 font-display text-3xl font-bold">Grupos scout</h1>
          <p className="mt-1 text-sm text-[#718078]">{grupos.length} grupo(s) activos en {provincias.length} provincia(s).</p>
        </div>
        {puedeCrear && (
          <button onClick={() => setModalNuevo(true)}
            className="flex w-fit items-center gap-2 rounded-lg bg-moss px-4 py-2.5 text-sm font-bold text-white">
            <Plus size={17} /> Nuevo grupo
          </button>
        )}
      </div>

      {error && <div role="alert" className="mb-4 rounded-lg bg-[#fdecea] px-4 py-3 text-sm font-semibold text-clay">{error}</div>}

      {loading ? (
        <div className="grid min-h-48 place-items-center"><Loader2 className="animate-spin text-moss" /></div>
      ) : (
        <div className="space-y-8">
          {porProvincia.map(({ provincia, grupos: gs }) => (
            <section key={provincia.id}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-display text-lg font-bold">
                  <span className="h-2.5 w-2.5 rounded-full bg-moss" /> {provincia.nombre}
                  <span className="text-xs font-sans font-semibold text-[#829087]">· Región {provincia.region} · {gs.length} grupo(s)</span>
                </h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {gs.map((g) => (
                  <Link key={g.id} href={`/censo?grupoId=${g.id}`}
                    className="group rounded-2xl border border-[#e2e9df] bg-white p-5 shadow-soft transition-colors hover:border-moss">
                    <div className="flex items-start justify-between">
                      <span className="grid h-11 w-11 place-items-center rounded-xl bg-fern text-moss"><Building2 size={20} /></span>
                      <span className="rounded-full bg-paper px-2.5 py-1 text-[10px] font-bold uppercase text-[#5c6f63]">Grupo {g.numeroGrupo}</span>
                    </div>
                    <h3 className="mt-4 font-display text-lg font-bold leading-snug group-hover:text-moss">{g.nombre}</h3>
                    <p className="mt-4 flex items-center gap-2 text-xs font-bold text-[#718078]">
                      <Users size={14} /> {g._count.scouts} miembro(s) registrado(s)
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          ))}
          {porProvincia.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#cbd8ca] bg-white p-10 text-center text-sm text-[#829087]">
              Aún no hay grupos registrados.
            </div>
          )}
        </div>
      )}

      {modalNuevo && (
        <NuevoGrupoModal
          provincias={provincias}
          onClose={() => setModalNuevo(false)}
          onCreado={() => {
            setModalNuevo(false);
            setLoading(true);
            fetch('/api/grupos').then((r) => r.json()).then((d: { data?: GrupoRow[] }) => setGrupos(d.data ?? [])).finally(() => setLoading(false));
          }}
        />
      )}
    </main>
  );
}

function NuevoGrupoModal({ provincias, onClose, onCreado }: {
  provincias: ProvinciaRow[];
  onClose: () => void;
  onCreado: () => void;
}) {
  const [numeroGrupo, setNumeroGrupo] = useState('');
  const [nombre, setNombre]           = useState('');
  const [provinciaId, setProvinciaId] = useState('');
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/grupos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numeroGrupo: Number(numeroGrupo), nombre: nombre.trim(), provinciaId }),
      });
      const d = (await res.json()) as { error?: string };
      if (!res.ok) { setError(d.error ?? 'No se pudo crear el grupo.'); return; }
      onCreado();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4" role="dialog" aria-modal aria-label="Nuevo grupo">
      <form onSubmit={(e) => void submit(e)} className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">Nuevo grupo scout</h3>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-lg p-2 text-[#829087] hover:bg-paper"><X size={18} /></button>
        </div>
        {error && <p className="rounded-lg bg-[#fdecea] px-3 py-2 text-sm font-semibold text-clay">{error}</p>}
        <div className="grid grid-cols-[110px_1fr] gap-2">
          <label className="text-xs font-bold text-[#5c6f63]">Número
            <input required type="number" min="1" value={numeroGrupo} onChange={(e) => setNumeroGrupo(e.target.value)} placeholder="12"
              className="mt-1 w-full rounded-lg border border-[#dfe7dc] p-3 text-sm outline-none focus:border-moss" />
          </label>
          <label className="text-xs font-bold text-[#5c6f63]">Nombre del grupo
            <input required value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Halcones de…"
              className="mt-1 w-full rounded-lg border border-[#dfe7dc] p-3 text-sm outline-none focus:border-moss" />
          </label>
        </div>
        <label className="block text-xs font-bold text-[#5c6f63]">Provincia
          <select required value={provinciaId} onChange={(e) => setProvinciaId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[#dfe7dc] p-3 text-sm outline-none focus:border-moss">
            <option value="">Selecciona…</option>
            {provincias.map((p) => <option key={p.id} value={p.id}>{p.nombre} · {p.region}</option>)}
          </select>
        </label>
        <button type="submit" disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-moss py-3 text-sm font-bold text-white disabled:opacity-60">
          {loading && <Loader2 className="animate-spin" size={16} />} Crear grupo
        </button>
      </form>
    </div>
  );
}
