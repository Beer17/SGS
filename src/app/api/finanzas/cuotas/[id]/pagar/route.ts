// src/app/api/finanzas/cuotas/[id]/pagar/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireApiRole, canManageFinances } from '@/lib/auth';
import { audit } from '@/lib/api';

type Params = { params: { id: string } };

export async function POST(_request: Request, { params }: Params) {
  const { session, error } = await requireApiRole();
  if (error) return error;
  if (!canManageFinances(session)) {
    return NextResponse.json({ error: 'Sin permisos para cobrar' }, { status: 403 });
  }
  const { id } = params;

  try {
    const cuota = await db.cuota.findUnique({
      where: { id },
      select: { id: true, estatus: true, concepto: true },
    });
    if (!cuota) return NextResponse.json({ error: 'Cuota no encontrada' }, { status: 404 });
    if (cuota.estatus === 'PAGADA') {
      return NextResponse.json({ error: 'La cuota ya estaba pagada' }, { status: 409 });
    }

    const updated = await db.cuota.update({
      where: { id },
      data: { estatus: 'PAGADA', fechaPago: new Date(), registradoPorId: session.id },
      include: {
        scoutProfile: {
          select: { nombres: true, apellidos: true, grupo: { select: { numeroGrupo: true, nombre: true } } },
        },
      },
    });

    await audit({ userId: session.id, accion: 'COBRAR_CUOTA', entidad: 'Cuota', entidadId: id });
    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('[POST /api/finanzas/cuotas/[id]/pagar]', error);
    return NextResponse.json({ error: 'Error al registrar el pago' }, { status: 500 });
  }
}
