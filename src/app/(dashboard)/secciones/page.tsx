// src/app/(dashboard)/secciones/page.tsx — Conteos reales por sección
import Link from 'next/link';
import {
  ArrowUpRight, Crown, Flame, PawPrint, Rabbit, TentTree,
} from 'lucide-react';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { SECTION_AGES, SECTION_LABELS, SECTIONS } from '@/types';
import type { Seccion } from '@/types';

const ICONS: Record<Seccion, typeof PawPrint> = {
  MANADA_GACELAS: Rabbit,
  MANADA_LOBATOS: PawPrint,
  TROPA: TentTree,
  CLAN: Flame,
  JEFATURA: Crown,
};

const COLORS: Record<Seccion, string> = {
  MANADA_GACELAS: 'bg-[#f6e6bd]',
  MANADA_LOBATOS: 'bg-[#efe0c8]',
  TROPA: 'bg-[#d8e9db]',
  CLAN: 'bg-[#f0d9d0]',
  JEFATURA: 'bg-[#d9e5ed]',
};

export default async function SeccionesPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const conteos = await db.scoutProfile.groupBy({
    by: ['seccion'],
    _count: { _all: true },
    where: session.role === 'MIEMBRO_TUTOR' ? { userId: session.id } : {},
  });
  const countMap = new Map(conteos.map((c) => [c.seccion, c._count._all]));

  return (
    <main className="p-5 lg:p-8">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[.2em] text-clay">Organización</p>
        <h1 className="mt-2 font-display text-3xl font-bold">Secciones</h1>
        <p className="mt-1 text-sm text-[#718078]">Miembros registrados por sección en este momento.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {SECTIONS.map((section) => {
          const Icon = ICONS[section];
          const total = countMap.get(section) ?? 0;
          return (
            <Link href={`/secciones/${section.toLowerCase()}`} key={section}
              className="rounded-2xl border border-[#e2e9df] bg-white p-5 shadow-soft transition-transform hover:-translate-y-0.5">
              <div className="flex items-start justify-between">
                <span className={`grid h-11 w-11 place-items-center rounded-xl ${COLORS[section]}`}><Icon size={21} /></span>
                <ArrowUpRight size={17} className="text-[#829087]" />
              </div>
              <h2 className="mt-5 font-display text-xl font-bold">{SECTION_LABELS[section]}</h2>
              <p className="mt-0.5 text-sm text-[#718078]">{SECTION_AGES[section]}</p>
              <div className="mt-5 text-3xl font-bold">{total}</div>
              <div className="text-xs font-semibold text-[#829087]">miembro(s) registrado(s)</div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
