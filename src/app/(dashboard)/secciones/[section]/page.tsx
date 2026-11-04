// src/app/(dashboard)/secciones/[section]/page.tsx
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ChevronRight, Users } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { estatusRegistroColor, getInitials } from '@/lib/utils';
import { SECTION_AGES, SECTION_LABELS, SECTIONS } from '@/types';
import type { Seccion } from '@/types';

export default async function SeccionDetallePage({ params }: { params: { section: string } }) {
  const session = await getSession();
  if (!session) redirect('/login');

  const slug = params.section.toUpperCase();
  if (!SECTIONS.includes(slug as Seccion)) notFound();
  const seccion = slug as Seccion;

  const where =
    session.role === 'MIEMBRO_TUTOR'
      ? { seccion, userId: session.id }
      : { seccion };

  const miembros = await db.scoutProfile.findMany({
    where,
    orderBy: [{ apellidos: 'asc' }, { nombres: 'asc' }],
    include: { grupo: { select: { numeroGrupo: true, nombre: true } } },
  });

  const activos = miembros.filter((m) => m.estatusRegistro === 'ACTIVO').length;

  return (
    <main className="p-5 lg:p-8">
      <Link href="/secciones" className="mb-6 inline-flex items-center gap-2 text-xs font-bold text-moss">
        <ArrowLeft size={14} /> Todas las secciones
      </Link>

      <p className="text-xs font-bold uppercase tracking-[.2em] text-clay">Sección</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">{SECTION_LABELS[seccion]}</h1>
          <p className="mt-1 text-sm text-muted">
            {SECTION_AGES[seccion]} · {miembros.length} miembro(s) · {activos} activo(s)
          </p>
        </div>
        <Link href={`/censo?seccion=${seccion}`} className="text-xs font-bold text-moss">
          Ver en censo →
        </Link>
      </div>

      {miembros.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-linestrong p-10 text-center text-sm text-faint">
          <Users className="mx-auto mb-3 text-moss" size={30} />
          No hay miembros en esta sección todavía.
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {miembros.map((m) => (
            <Link
              key={m.id}
              href={`/ficha/${m.id}`}
              className="group flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 shadow-soft transition-colors hover:border-moss"
            >
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-fern font-display text-lg font-bold text-moss">
                {getInitials(m.nombres, m.apellidos)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold group-hover:text-moss">{m.nombres} {m.apellidos}</p>
                <p className="mt-0.5 truncate text-xs text-faint">Grupo {m.grupo.numeroGrupo} · {m.grupo.nombre}</p>
                <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${estatusRegistroColor(m.estatusRegistro)}`}>
                  {m.estatusRegistro}
                </span>
              </div>
              <ChevronRight size={17} className="shrink-0 text-faint group-hover:text-moss" />
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
