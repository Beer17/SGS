// src/app/api/inventario/[id]/devolver/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireApiRole } from '@/lib/auth';
import { audit } from '@/lib/api';
import { z } from 'zod';

type Params = { params: { id: string } };
const INVENTARIO_ROLES = ['ADMIN', 'NACIONAL', 'PROVINCIA', 'GRUPO'];

const DevolverSchema = z.object({
  observaciones: z.string().max(500).optional(),
  estadoFinal: z.enum(['DISPONIBLE', 'MANTENIMIENTO', 'DANADO']).default('DISPONIBLE'),
});

export async function POST(request: Request, { params }: Params) {
  const { session, error } = await requireApiRole();
  if (error) return error;
  if (!INVENTARIO_ROLES.includes(session.role)) {
    return NextResponse.json({ error: 'Sin permisos para devolver equipo' }, { status: 403 });
  }
  const { id } = params;

  try {
    const parsed = DevolverSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 });
    }

    const prestamo = await db.prestamoInventario.findFirst({
      where: { itemId: id, devuelto: false },
      orderBy: { fechaPrestamo: 'desc' },
    });
    if (!prestamo) {
      return NextResponse.json({ error: 'No hay préstamo abierto para este ítem' }, { status: 409 });
    }

    const [devuelto] = await db.$transaction([
      db.prestamoInventario.update({
        where: { id: prestamo.id },
        data: { devuelto: true, fechaDevolucion: new Date(), observaciones: parsed.data.observaciones ?? prestamo.observaciones },
      }),
      db.itemInventario.update({
        where: { id },
        data: { estado: parsed.data.estadoFinal },
      }),
    ]);

    await audit({ userId: session.id, accion: 'DEVOLVER_ITEM', entidad: 'PrestamoInventario', entidadId: devuelto.id });
    return NextResponse.json({ data: devuelto });
  } catch (error) {
    console.error('[POST /api/inventario/[id]/devolver]', error);
    return NextResponse.json({ error: 'Error al registrar la devolución' }, { status: 500 });
  }
}
