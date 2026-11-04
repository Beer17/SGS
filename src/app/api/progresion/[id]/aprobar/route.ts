// src/app/api/progresion/[id]/aprobar/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireApiRole, canOperate } from '@/lib/auth';
import { audit } from '@/lib/api';

type Params = { params: { id: string } };

export async function POST(_request: Request, { params }: Params) {
  const { session, error } = await requireApiRole();
  if (error) return error;
  if (!canOperate(session)) {
    return NextResponse.json({ error: 'Sin permisos para aprobar etapas' }, { status: 403 });
  }
  const { id } = params;

  try {
    const progresion = await db.progresionScout.findUnique({
      where: { id },
      include: {
        scoutProfile: { select: { id: true, nombres: true, apellidos: true, userId: true } },
      },
    });
    if (!progresion) return NextResponse.json({ error: 'Etapa no encontrada' }, { status: 404 });
    if (progresion.completada) {
      return NextResponse.json({ error: 'La etapa ya estaba aprobada' }, { status: 409 });
    }

    const updated = await db.progresionScout.update({
      where: { id },
      data: { completada: true, aprobadaPorId: session.id, fechaAprobacion: new Date() },
    });

    // Notificar al tutor/miembro vinculado, si existe cuenta
    if (progresion.scoutProfile.userId) {
      await db.notificacion.create({
        data: {
          destinatarioId: progresion.scoutProfile.userId,
          tipo: 'PROGRESION_APROBADA',
          titulo: 'Etapa de progresión aprobada',
          mensaje: `Se aprobó la etapa "${progresion.etapaNombre}" para ${progresion.scoutProfile.nombres} ${progresion.scoutProfile.apellidos}.`,
          accionUrl: '/progresion',
          dedupeKey: `progresion:${progresion.id}:aprobada`,
        },
      });
    }

    await audit({ userId: session.id, accion: 'APROBAR_PROGRESION', entidad: 'ProgresionScout', entidadId: id });
    return NextResponse.json({ data: updated });
  } catch (error) {
    if ((error as { code?: string }).code === 'P2002') {
      // dedupeKey ya existía: la aprobación quedó registrada de todos modos
      return NextResponse.json({ ok: true, nota: 'Notificación duplicada omitida' });
    }
    console.error('[POST /api/progresion/[id]/aprobar]', error);
    return NextResponse.json({ error: 'Error al aprobar la etapa' }, { status: 500 });
  }
}
