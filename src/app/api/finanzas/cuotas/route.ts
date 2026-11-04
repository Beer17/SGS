// src/app/api/finanzas/cuotas/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireApiRole, canManageFinances } from '@/lib/auth';
import { audit } from '@/lib/api';
import { CuotaSchema } from '@/lib/validations';

export async function GET(request: Request) {
  const { session, error } = await requireApiRole();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const ciclo   = searchParams.get('ciclo') ?? undefined;
  const estatus = searchParams.get('estatus') ?? undefined;
  const grupoId = searchParams.get('grupoId') ?? undefined;
  const scoutProfileId = searchParams.get('scoutProfileId') ?? undefined;

  try {
    const cuotas = await db.cuota.findMany({
      // Tutor: SOLO las cuotas de sus expedientes vinculados
      where: session.role === 'MIEMBRO_TUTOR'
        ? { scoutProfile: { userId: session.id }, ...(ciclo && { ciclo }), ...(estatus && { estatus: estatus as never }), ...(scoutProfileId && { scoutProfileId }) }
        : {
            ...(ciclo   && { ciclo }),
            ...(estatus && { estatus: estatus as never }),
            ...(grupoId && { scoutProfile: { grupoId } }),
            ...(scoutProfileId && { scoutProfileId }),
          },
      include: {
        scoutProfile: {
          select: {
            id: true, nombres: true, apellidos: true, seccion: true,
            grupo: { select: { nombre: true, numeroGrupo: true } },
          },
        },
      },
      orderBy: [{ estatus: 'asc' }, { fechaVencimiento: 'asc' }],
      take: 500,
    });

    const totalRecaudado = cuotas
      .filter((c) => c.estatus === 'PAGADA')
      .reduce((sum, c) => sum + Number(c.monto), 0);
    const pendientes = cuotas.filter((c) => c.estatus === 'PENDIENTE' || c.estatus === 'VENCIDA').length;

    return NextResponse.json({ data: cuotas, totalRecaudado, pendientes });
  } catch (error) {
    console.error('[GET /api/finanzas/cuotas]', error);
    return NextResponse.json({ error: 'Error al obtener cuotas' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { session, error } = await requireApiRole();
  if (error) return error;
  if (!canManageFinances(session)) {
    return NextResponse.json({ error: 'Sin permisos para registrar cuotas' }, { status: 403 });
  }

  try {
    const body: unknown = await request.json();
    const parsed = CuotaSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 });
    }

    const { fechaVencimiento, fechaPago, ...rest } = parsed.data;
    const cuota = await db.cuota.create({
      data: {
        ...rest,
        registradoPorId: session.id,
        ...(fechaVencimiento ? { fechaVencimiento: new Date(fechaVencimiento) } : {}),
        ...(fechaPago        ? { fechaPago:        new Date(fechaPago)        } : {}),
      },
    });

    await audit({ userId: session.id, accion: 'CREAR_CUOTA', entidad: 'Cuota', entidadId: cuota.id });
    return NextResponse.json({ data: cuota }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/finanzas/cuotas]', error);
    return NextResponse.json({ error: 'Error al registrar cuota' }, { status: 500 });
  }
}
