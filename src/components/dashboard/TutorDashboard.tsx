// src/components/dashboard/TutorDashboard.tsx
// Vista de padre/tutor: solo sus expedientes vinculados.
import Link from 'next/link';
import { CalendarDays, ChevronRight, IdCard, Tent, UserRound, Wallet } from 'lucide-react';
import { db } from '@/lib/db';
import { estatusRegistroColor, formatCurrency } from '@/lib/utils';
import { SECTION_LABELS } from '@/types';

export async function TutorDashboard({ userId, email }: { userId: string; email: string }) {
  const hijos = await db.scoutProfile.findMany({
    where: { userId },
    include: {
      grupo: { select: { numeroGrupo: true, nombre: true } },
      progresiones: { select: { completada: true } },
      cuotas: { where: { estatus: { in: ['PENDIENTE', 'VENCIDA'] } }, select: { monto: true, concepto: true, estatus: true } },
      inscripciones: {
        where: { evento: { cancelado: false, fechaInicio: { gte: new Date() } } },
        include: { evento: { select: { nombre: true, fechaInicio: true, lugar: true } } },
        orderBy: { evento: { fechaInicio: 'asc' } },
        take: 2,
      },
    },
  });

  return (
    <main className="mx-auto max-w-5xl px-5 py-8 lg:px-9">
      <p className="text-xs font-bold uppercase tracking-[.2em] text-clay">
        {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      </p>
      <h1 className="mt-2 font-display text-3xl font-bold">Hola, {email.split('@')[0]} 👋</h1>
      <p className="mt-2 text-sm text-[#718078]">Resumen de los expedientes vinculados a tu cuenta.</p>

      {hijos.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-[#dfe7dc] p-10 text-center text-sm text-[#829087]">
          <UserRound className="mx-auto mb-3 text-moss" size={32} />
          <p className="font-bold text-ink">Aún no hay expedientes vinculados</p>
          <p className="mt-1">Pide a jefatura de tu grupo que vincule tu cuenta al expediente de tu hijo/a.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          {hijos.map((h) => {
            const totalEtapas = h.progresiones.length;
            const completadas = h.progresiones.filter((p) => p.completada).length;
            const pct = totalEtapas ? Math.round((completadas / totalEtapas) * 100) : 0;
            const deuda = h.cuotas.reduce((s, c) => s + Number(c.monto), 0);

            return (
              <section key={h.id} className="rounded-2xl border border-[#e2e9df] bg-white p-6 shadow-soft">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[.18em] text-clay">Expediente scout</p>
                    <h2 className="mt-1 font-display text-2xl font-bold">{h.nombres} {h.apellidos}</h2>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full bg-fern px-3 py-1 font-bold text-moss">{SECTION_LABELS[h.seccion]}</span>
                      <span className="rounded-full bg-paper px-3 py-1 font-bold text-[#5c6f63]">Grupo {h.grupo.numeroGrupo} · {h.grupo.nombre}</span>
                      <span className={`rounded-full px-3 py-1 font-bold ${estatusRegistroColor(h.estatusRegistro)}`}>{h.estatusRegistro}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/ficha/${h.id}`} className="flex items-center gap-2 rounded-lg border border-[#dfe7dc] px-4 py-2 text-xs font-bold text-[#5c6f63] hover:bg-paper">
                      Ver expediente <ChevronRight size={14} />
                    </Link>
                    <Link href={`/credencial/${h.id}`} className="flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-xs font-bold text-white hover:opacity-90">
                      <IdCard size={14} /> Credencial
                    </Link>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  {/* Progresión */}
                  <Link href="/progresion" className="rounded-xl bg-paper p-4 hover:bg-fern/40">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#829087]">Progresión</p>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white">
                      <div className="h-full bg-moss" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-2 text-sm font-bold">{completadas}/{totalEtapas} etapas · {pct}%</p>
                  </Link>

                  {/* Cuotas */}
                  <div className="rounded-xl bg-paper p-4">
                    <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-[#829087]"><Wallet size={12} /> Cuotas pendientes</p>
                    <p className="mt-2 font-display text-2xl font-bold">{h.cuotas.length}</p>
                    <p className="text-xs text-[#718078]">{deuda > 0 ? `${formatCurrency(deuda)} por pagar` : 'Sin adeudos 🎉'}</p>
                  </div>

                  {/* Próximos eventos */}
                  <div className="rounded-xl bg-paper p-4">
                    <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-[#829087]"><Tent size={12} /> Inscrito a</p>
                    {h.inscripciones.length === 0 ? (
                      <p className="mt-2 text-sm text-[#718078]">Sin eventos próximos.</p>
                    ) : (
                      <ul className="mt-2 space-y-1 text-xs">
                        {h.inscripciones.map((i) => (
                          <li key={i.evento.nombre} className="flex items-start gap-1.5">
                            <CalendarDays size={12} className="mt-0.5 shrink-0 text-moss" />
                            <span className="font-semibold leading-snug">{i.evento.nombre}
                              <span className="block text-[10px] font-normal text-[#829087]">
                                {i.evento.fechaInicio.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                              </span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
