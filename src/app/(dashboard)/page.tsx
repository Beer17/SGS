// src/app/(dashboard)/page.tsx
import Link from 'next/link';
import {
  ArrowRight, ArrowUpRight, CalendarDays, CircleCheck, ClipboardList, HeartPulse,
  Tent, Users, Wallet, AlertCircle,
} from 'lucide-react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { TIPO_EVENTO_LABELS } from '@/lib/labels';
import { formatCurrency } from '@/lib/utils';
import { TutorDashboard } from '@/components/dashboard/TutorDashboard';

const ACCION_LABELS: Record<string, string> = {
  CREAR_MIEMBRO: 'dio de alta un miembro',
  EDITAR_MIEMBRO: 'editó un expediente',
  BAJA_MIEMBRO: 'dio de baja a un miembro',
  CONSULTA_FICHA_MEDICA: 'consultó una ficha médica',
  EDITAR_FICHA_MEDICA: 'actualizó una ficha médica',
  CREAR_EVENTO: 'creó un evento',
  EDITAR_EVENTO: 'editó un evento',
  CANCELAR_EVENTO: 'canceló un evento',
  COBRAR_CUOTA: 'registró un pago',
  CREAR_CUOTA: 'registró una cuota',
  GENERAR_CUOTAS: 'generó cuotas del ciclo',
  APROBAR_PROGRESION: 'aprobó una etapa de progresión',
  IMPORTAR_CENSO: 'importó censo masivo',
  CAMBIO_PASSWORD: 'cambió su contraseña',
  PRESTAR_ITEM: 'prestó equipo',
  DEVOLVER_ITEM: 'devolvió equipo',
};

async function staffDashboard(session: { id: string; email: string; role: string }) {
  const ahora = new Date();
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

  const [
    miembrosActivos,
    gruposRegistrados,
    alertasMedicas,
    proximosEventos,
    ingresosMes,
    egresosMes,
    proximoEvento,
    actividad,
  ] = await Promise.all([
    db.scoutProfile.count({ where: { estatusRegistro: 'ACTIVO' } }),
    db.grupoScout.count(),
    db.fichaMedica.count({
      where: { OR: [{ alergias: { not: null } }, { padecimientos: { not: null } }, { restriccionesActividad: { not: null } }] },
    }),
    db.evento.count({ where: { cancelado: false, fechaInicio: { gte: ahora } } }),
    db.movimientoFinanciero.aggregate({ where: { tipo: 'INGRESO', fecha: { gte: inicioMes } }, _sum: { monto: true } }),
    db.movimientoFinanciero.aggregate({ where: { tipo: 'EGRESO', fecha: { gte: inicioMes } }, _sum: { monto: true } }),
    db.evento.findFirst({
      where: { cancelado: false, fechaInicio: { gte: ahora } },
      orderBy: { fechaInicio: 'asc' },
      select: { id: true, nombre: true, tipo: true, fechaInicio: true, lugar: true },
    }),
    db.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: { id: true, accion: true, entidad: true, createdAt: true, user: { select: { email: true } } },
    }),
  ]);

  const ingresos = Number(ingresosMes._sum.monto ?? 0);
  const egresos = Number(egresosMes._sum.monto ?? 0);
  const balance = ingresos - egresos;
  const diasParaEvento = proximoEvento
    ? Math.ceil((proximoEvento.fechaInicio.getTime() - ahora.getTime()) / 86_400_000)
    : null;

  const metrics = [
    { label: 'Miembros activos', value: String(miembrosActivos), icon: Users, href: '/censo?estatus=ACTIVO', tone: 'moss' as const },
    { label: 'Grupos registrados', value: String(gruposRegistrados), icon: CircleCheck, href: '/grupos', tone: 'moss' as const },
    { label: 'Alertas médicas', value: String(alertasMedicas), icon: HeartPulse, href: '/censo', tone: alertasMedicas > 0 ? ('clay' as const) : ('moss' as const) },
    { label: 'Próximos eventos', value: String(proximosEventos), icon: CalendarDays, href: '/calendario', tone: 'moss' as const },
  ];

  return (
    <main className="mx-auto max-w-[1480px] px-5 py-8 lg:px-9">
      {/* Encabezado */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[.2em] text-clay">
            {ahora.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight lg:text-4xl">Resumen nacional</h1>
          <p className="mt-2 text-sm text-muted">El pulso de la asociación, en vivo desde la base de datos.</p>
        </div>
        <Link href="/censo/nuevo"
          className="flex w-fit items-center gap-2 rounded-lg bg-moss px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-moss">
          <Users size={17} />Registrar miembro
        </Link>
      </div>

      {/* Métricas */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon, href, tone }) => (
          <Link key={label} href={href}
            className="rounded-2xl border border-line bg-surface p-5 shadow-soft transition-colors hover:border-moss">
            <div className="mb-5 flex items-center justify-between">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-fern text-moss">
                <Icon size={19} />
              </span>
            </div>
            <div className="text-3xl font-bold tracking-tight">{value}</div>
            <div className="mt-1 text-sm text-muted">{label}</div>
          </Link>
        ))}
      </section>

      {/* Balance del mes */}
      <section className="mt-4 grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Ingresos del mes', value: ingresos, tone: 'text-moss' },
          { label: 'Egresos del mes', value: egresos, tone: 'text-clay' },
          { label: 'Balance', value: balance, tone: balance >= 0 ? 'text-moss' : 'text-clay' },
        ].map(({ label, value, tone }) => (
          <Link key={label} href="/finanzas"
            className="flex items-center justify-between rounded-2xl border border-line bg-surface p-5 shadow-soft transition-colors hover:border-moss">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-faint">{label}</p>
              <p className={`mt-1 font-display text-2xl font-bold ${tone}`}>{formatCurrency(value)}</p>
            </div>
            <Wallet className="text-faint" size={26} />
          </Link>
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        {/* Actividad reciente (auditoría real) */}
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-soft">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold">Actividad reciente</h2>
              <p className="mt-0.5 text-xs text-faint">Últimas acciones registradas en la bitácora</p>
            </div>
            <ClipboardList size={18} className="text-faint" />
          </div>
          <ul className="divide-y divide-line">
            {actividad.length === 0 && <li className="py-4 text-sm text-faint">Aún no hay acciones registradas.</li>}
            {actividad.map((a) => (
              <li key={a.id} className="flex items-center gap-3 py-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-fern text-[11px] font-bold text-moss">
                  {a.user.email.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">
                    <span className="font-semibold">{a.user.email.split('@')[0]}</span>{' '}
                    {ACCION_LABELS[a.accion] ?? a.accion.toLowerCase().replace(/_/g, ' ')}
                  </p>
                  <p className="text-[11px] text-faint">{a.createdAt.toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Próximo evento */}
        {proximoEvento ? (
          <div className="rounded-2xl bg-panel p-6 text-white shadow-soft">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-citrus text-ink">
                  <Tent size={19} />
                </div>
                <h2 className="font-display text-lg font-bold">Próximo evento</h2>
              </div>
              <span className="rounded-full bg-surface/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#d4e6d7]">
                {TIPO_EVENTO_LABELS[proximoEvento.tipo]}
              </span>
            </div>
            <p className="text-2xl font-bold leading-snug">{proximoEvento.nombre}</p>
            <p className="mt-1 text-sm text-[#aabeb0]">{proximoEvento.lugar ?? 'Por confirmar'}</p>
            <div className="my-5 h-px bg-surface/10" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#aabeb0]">
                {proximoEvento.fechaInicio.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <span className="font-bold text-citrus">
                {diasParaEvento === 0 ? '¡Hoy!' : diasParaEvento === 1 ? 'Mañana' : `${diasParaEvento} días`}
              </span>
            </div>
            <Link href="/eventos"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-surface/10 py-3 text-sm font-bold transition-colors hover:bg-surface/20">
              Ver detalles <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-linestrong bg-surface/50 p-8 text-center">
            <AlertCircle className="text-faint" size={32} />
            <p className="mt-3 font-bold">Sin eventos próximos</p>
            <p className="mt-1 text-sm text-faint">Crea el siguiente evento del calendario.</p>
            <Link href="/eventos" className="mt-4 flex items-center gap-2 rounded-lg bg-moss px-4 py-2.5 text-sm font-bold text-white">
              Ir a eventos <ArrowUpRight size={16} />
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  // Vista de padre/tutor: resumen de sus expedientes vinculados
  if (session.role === 'MIEMBRO_TUTOR') {
    return <TutorDashboard userId={session.id} email={session.email} />;
  }
  return staffDashboard(session);
}
