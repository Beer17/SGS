// src/lib/reminders.ts
// Recordatorios perezosos: se generan al abrir el panel (no requiere cron).
// Idempotentes vía Notificacion.dedupeKey.
import { db } from '@/lib/db';
import type { SessionUser } from '@/lib/auth';
import type { TipoNotificacion } from '@prisma/client';

const MAX_CREATED_PER_CALL = 25;

/**
 * Crea notificaciones pendientes para el usuario (cuotas vencidas/por vencer,
 * eventos próximos). Solo roles operativos y admin. Silencioso ante errores.
 */
export async function ensureReminders(session: SessionUser): Promise<number> {
  const staff = ['ADMIN', 'NACIONAL', 'PROVINCIA', 'GRUPO'].includes(session.role);
  const operativos = staff || session.role === 'SECCION';
  if (!operativos) return 0;

  let created = 0;
  const pending: Array<{
    destinatarioId: string;
    tipo: TipoNotificacion;
    titulo: string;
    mensaje: string;
    accionUrl: string;
    dedupeKey: string;
  }> = [];

  // ─── Cuotas vencidas o por vencer (solo roles con visión financiera) ───────
  if (staff) {
    const hoy = new Date();
    const enSieteDias = new Date(hoy);
    enSieteDias.setDate(enSieteDias.getDate() + 7);

    const cuotas = await db.cuota.findMany({
      where: {
        OR: [
          { estatus: 'VENCIDA' },
          { estatus: 'PENDIENTE', fechaVencimiento: { lte: enSieteDias } },
        ],
      },
      select: {
        id: true,
        estatus: true,
        concepto: true,
        scoutProfile: { select: { nombres: true, apellidos: true, grupo: { select: { numeroGrupo: true } } } },
      },
      take: MAX_CREATED_PER_CALL,
      orderBy: { fechaVencimiento: 'asc' },
    });

    for (const cuota of cuotas) {
      const vencida = cuota.estatus === 'VENCIDA';
      pending.push({
        destinatarioId: session.id,
        tipo: 'CUOTA_VENCIMIENTO',
        titulo: vencida ? 'Cuota vencida' : 'Cuota por vencer',
        mensaje: `${cuota.scoutProfile.nombres} ${cuota.scoutProfile.apellidos} — ${cuota.concepto} (Grupo ${cuota.scoutProfile.grupo.numeroGrupo})`,
        accionUrl: '/finanzas',
        dedupeKey: `cuota:${cuota.id}:${session.id}`,
      });
    }
  }

  // ─── Eventos que inician en ≤ 7 días ────────────────────────────────────────
  const hoy = new Date();
  const enSieteDias = new Date(hoy);
  enSieteDias.setDate(enSieteDias.getDate() + 7);

  const eventos = await db.evento.findMany({
    where: { cancelado: false, fechaInicio: { gte: hoy, lte: enSieteDias } },
    select: { id: true, nombre: true, fechaInicio: true, lugar: true },
    take: MAX_CREATED_PER_CALL,
    orderBy: { fechaInicio: 'asc' },
  });

  for (const evento of eventos) {
    pending.push({
      destinatarioId: session.id,
      tipo: 'EVENTO_RECORDATORIO',
      titulo: `Próximo evento: ${evento.nombre}`,
      mensaje: `Inicia el ${evento.fechaInicio.toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}${evento.lugar ? ` · ${evento.lugar}` : ''}`,
      accionUrl: '/eventos',
      dedupeKey: `evento:${evento.id}:${session.id}`,
    });
  }

  const limited = pending.slice(0, MAX_CREATED_PER_CALL);
  if (limited.length > 0) {
    const result = await db.notificacion.createMany({ data: limited, skipDuplicates: true });
    created = result.count;
  }
  return created;
}
