'use client';
// src/components/members/MemberForm.tsx
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Save, X } from 'lucide-react';
import { SECTION_LABELS, SECTIONS } from '@/types';

interface GrupoOption {
  id: string;
  numeroGrupo: number;
  nombre: string;
  provinciaId: string;
  provincia: { nombre: string };
}

interface ScoutApiResponse {
  data: {
    id: string;
    nombres: string;
    apellidos: string;
    curp: string | null;
    fechaNacimiento: string;
    telefono: string | null;
    direccion: string | null;
    seccion: string;
    grupoId: string;
    estatusRegistro: string;
    cicloActivo: string | null;
    rama: string | null;
  };
}

export function MemberForm({ mode, scoutId }: { mode: 'create' | 'edit'; scoutId?: string }) {
  const router = useRouter();
  const [grupos, setGrupos] = useState<GrupoOption[]>([]);
  const [loading, setLoading]   = useState(false);
  const [loadingData, setLoadingData] = useState(mode === 'edit');
  const [error, setError]       = useState('');

  const [nombres, setNombres]     = useState('');
  const [apellidos, setApellidos] = useState('');
  const [curp, setCurp]           = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [telefono, setTelefono]   = useState('');
  const [direccion, setDireccion] = useState('');
  const [seccion, setSeccion]     = useState<string>('TROPA');
  const [grupoId, setGrupoId]     = useState('');
  const [cicloActivo, setCicloActivo] = useState('2026-2027');
  const [estatusRegistro, setEstatusRegistro] = useState('PENDIENTE');
  const [rama, setRama]           = useState('');

  useEffect(() => {
    fetch('/api/grupos')
      .then((r) => r.json())
      .then((data: { data: GrupoOption[] }) => setGrupos(data.data ?? []))
      .catch(() => setError('No se pudo cargar la lista de grupos.'));
  }, []);

  useEffect(() => {
    if (mode !== 'edit' || !scoutId) return;
    fetch(`/api/miembros/${scoutId}`)
      .then((r) => {
        if (!r.ok) throw new Error('No se pudo cargar el expediente');
        return r.json() as Promise<ScoutApiResponse>;
      })
      .then(({ data }) => {
        setNombres(data.nombres);
        setApellidos(data.apellidos);
        setCurp(data.curp ?? '');
        setFechaNacimiento(data.fechaNacimiento.slice(0, 10));
        setTelefono(data.telefono ?? '');
        setDireccion(data.direccion ?? '');
        setSeccion(data.seccion);
        setGrupoId(data.grupoId);
        setCicloActivo(data.cicloActivo ?? '');
        setEstatusRegistro(data.estatusRegistro);
        setRama(data.rama ?? '');
      })
      .catch(() => setError('No se pudo cargar el expediente del miembro.'))
      .finally(() => setLoadingData(false));
  }, [mode, scoutId]);

  const grupoSeleccionado = useMemo(() => grupos.find((g) => g.id === grupoId), [grupos, grupoId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!grupoSeleccionado) { setError('Selecciona un grupo.'); return; }
    setLoading(true);

    const payload = {
      nombres: nombres.trim(),
      apellidos: apellidos.trim(),
      curp: curp.trim() ? curp.trim().toUpperCase() : undefined,
      fechaNacimiento: new Date(`${fechaNacimiento}T00:00:00`).toISOString(),
      telefono: telefono.trim() || undefined,
      direccion: direccion.trim() || undefined,
      seccion,
      grupoId: grupoSeleccionado.id,
      provinciaId: grupoSeleccionado.provinciaId,
      cicloActivo: cicloActivo.trim() || undefined,
      rama: rama === '' ? null : rama,
      ...(mode === 'edit' ? { estatusRegistro } : {}),
    };

    try {
      const res = await fetch(mode === 'create' ? '/api/miembros' : `/api/miembros/${scoutId}`, {
        method: mode === 'create' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { data?: { id: string }; error?: string };
      if (!res.ok) { setError(data.error ?? 'No se pudo guardar. Revisa los datos.'); return; }
      router.push(`/ficha/${mode === 'create' ? data.data!.id : scoutId}`);
      router.refresh();
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  if (loadingData) {
    return (
      <div className="grid min-h-64 place-items-center text-sm text-[#829087]">
        Cargando expediente…
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="max-w-3xl space-y-5">
      {error && (
        <div role="alert" className="rounded-lg bg-[#fdecea] px-4 py-3 text-sm font-semibold text-clay">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-bold">
          Nombres *
          <input required value={nombres} onChange={(e) => setNombres(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-[#dfe7dc] p-3 text-sm outline-none focus:border-moss" />
        </label>
        <label className="block text-sm font-bold">
          Apellidos *
          <input required value={apellidos} onChange={(e) => setApellidos(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-[#dfe7dc] p-3 text-sm outline-none focus:border-moss" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-bold">
          CURP (18 caracteres)
          <input value={curp} maxLength={18} onChange={(e) => setCurp(e.target.value.toUpperCase())}
            placeholder="GODL950101HDFXYZ01"
            className="mt-1.5 w-full rounded-lg border border-[#dfe7dc] p-3 font-mono text-sm uppercase outline-none focus:border-moss" />
        </label>
        <label className="block text-sm font-bold">
          Fecha de nacimiento *
          <input required type="date" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-[#dfe7dc] p-3 text-sm outline-none focus:border-moss" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-bold">
          Sección *
          <select required value={seccion} onChange={(e) => { setSeccion(e.target.value); if (e.target.value !== 'TROPA') setRama(''); }}
            className="mt-1.5 w-full rounded-lg border border-[#dfe7dc] p-3 text-sm outline-none focus:border-moss">
            {SECTIONS.map((s) => <option key={s} value={s}>{SECTION_LABELS[s]}</option>)}
          </select>
        </label>
        <label className="block text-sm font-bold">
          Grupo *
          <select required value={grupoId} onChange={(e) => setGrupoId(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-[#dfe7dc] p-3 text-sm outline-none focus:border-moss">
            <option value="">Selecciona…</option>
            {grupos.map((g) => (
              <option key={g.id} value={g.id}>
                Grupo {g.numeroGrupo} — {g.nombre} ({g.provincia.nombre})
              </option>
            ))}
          </select>
        </label>
      </div>

      {seccion === 'TROPA' && (
        <label className="block text-sm font-bold">
          Rama de la Tropa (opcional)
          <select value={rama} onChange={(e) => setRama(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-[#dfe7dc] p-3 text-sm outline-none focus:border-moss">
            <option value="">Tropa regular (11–14 años)</option>
            <option value="COMUNIDAD">Comunidad (15–17 años)</option>
          </select>
        </label>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-bold">
          Teléfono de contacto
          <input value={telefono} onChange={(e) => setTelefono(e.target.value)} inputMode="tel"
            placeholder="55 1234 5678"
            className="mt-1.5 w-full rounded-lg border border-[#dfe7dc] p-3 text-sm outline-none focus:border-moss" />
        </label>
        <label className="block text-sm font-bold">
          Ciclo activo
          <input value={cicloActivo} onChange={(e) => setCicloActivo(e.target.value)}
            placeholder="2026-2027"
            className="mt-1.5 w-full rounded-lg border border-[#dfe7dc] p-3 text-sm outline-none focus:border-moss" />
        </label>
      </div>

      <label className="block text-sm font-bold">
        Dirección
        <input value={direccion} onChange={(e) => setDireccion(e.target.value)}
          placeholder="Calle y número, colonia, municipio"
          className="mt-1.5 w-full rounded-lg border border-[#dfe7dc] p-3 text-sm outline-none focus:border-moss" />
      </label>

      {mode === 'edit' && (
        <label className="block text-sm font-bold">
          Estatus de registro
          <select value={estatusRegistro} onChange={(e) => setEstatusRegistro(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-[#dfe7dc] p-3 text-sm outline-none focus:border-moss">
            <option value="ACTIVO">ACTIVO</option>
            <option value="PENDIENTE">PENDIENTE</option>
            <option value="VENCIDO">VENCIDO</option>
            <option value="BAJA">BAJA</option>
          </select>
        </label>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button type="submit" disabled={loading}
          className="flex w-fit items-center gap-2 rounded-lg bg-moss px-5 py-3 text-sm font-bold text-white disabled:opacity-60">
          {loading ? <Loader2 className="animate-spin" size={17} /> : <Save size={17} />}
          {mode === 'create' ? 'Registrar miembro' : 'Guardar cambios'}
        </button>
        <Link href={mode === 'create' ? '/censo' : `/ficha/${scoutId}`}
          className="flex w-fit items-center gap-2 rounded-lg border border-[#dfe7dc] px-5 py-3 text-sm font-bold text-[#5c6f63] hover:bg-paper">
          <X size={17} /> Cancelar
        </Link>
      </div>
    </form>
  );
}
