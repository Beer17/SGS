// src/app/api/finanzas/cuotas/generar/route.ts
// Genera cuotas del ciclo para todos los miembros ACTIVOS que aún no la tengan.
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireApiRole, canManageFinances } from '@/lib/auth';
import { audit } from '@/lib/api';

const GenerarSchema = z.object({
  ciclo: z.string().min(1).max(20),
  concepto: z.string().min(1).max(200),
  monto: z.number().positive(),
  tipo: z.enum(['MEMBRESIA', 'EVENTO', 'OTRO']).default('MEMBRESIA'),
  grupoId: z.string().uuid().optional(),
  seccion: z.enum(['MANADA', 'TROPA', 'COMUNIDAD', 'CLAN', 'JEFATURA']).optional(),
  diasVencimiento: z.number().int().positive().max(365).default(30),
});

export async function POST(request: Request) {
  const { session, error } = await requireApiRole();
  if (error) return error;
  if (!canManageFinances(session)) {
    return NextResponse.json({ error: 'Sin permisos para generar cuotas' }, { status: 403 });
  }

  try {
    const parsed = GenerarSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 });
    }
    const { ciclo, concepto, monto, tipo, grupoId, seccion, diasVencimiento } = parsed.data;

    const candidatos = await db.scoutProfile.findMany({
      where: {
        estatusRegistro: 'ACTIVO',
        ...(grupoId && { grupoId }),
        ...(seccion && { seccion }),
        // excluir quienes ya tienen una cuota del mismo tipo y ciclo
        NOT: { cuotas: { some: { ciclo, tipo } } },
      },
      select: { id: true },
    });

    if (candidatos.length === 0) {
      return NextResponse.json({ created: 0, message: 'Todos los miembros ya tienen esta cuota (o no hay activos con el filtro dado).' });
    }

    const vencimiento = new Date();
    vencimiento.setDate(vencimiento.getDate() + diasVencimiento);

    const result = await db.cuota.createMany({
      data: candidatos.map((c) => ({
        scoutProfileId: c.id,
        tipo,
        concepto,
        monto,
        ciclo,
        estatus: 'PENDIENTE' as const,
        fechaVencimiento: vencimiento,
        registradoPorId: session.id,
      })),
    });

    await audit({ userId: session.id, accion: 'GENERAR_CUOTAS', entidad: 'Cuota', entidadId: ciclo });
    return NextResponse.json({ created: result.count, ciclo, tipo });
  } catch (error) {
    console.error('[POST /api/finanzas/cuotas/generar]', error);
    return NextResponse.json({ error: 'Error al generar cuotas' }, { status: 500 });
  }
}
