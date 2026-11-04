// src/app/api/finanzas/movimientos/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireApiRole, canManageFinances, canOperate } from '@/lib/auth';
import { MovimientoSchema } from '@/lib/validations';

export async function GET(request: Request) {
  const { session, error } = await requireApiRole();
  if (error) return error;
  if (!canOperate(session)) {
    return NextResponse.json({ error: 'Sin permisos para ver movimientos' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const grupoId = searchParams.get('grupoId');
  const tipo    = searchParams.get('tipo') ?? undefined;
  const desde   = searchParams.get('desde') ?? undefined;
  const hasta   = searchParams.get('hasta') ?? undefined;

  if (!grupoId) return NextResponse.json({ error: 'grupoId requerido' }, { status: 400 });

  try {
    const movimientos = await db.movimientoFinanciero.findMany({
      where: {
        grupoId,
        ...(tipo  && { tipo: tipo as never }),
        ...(desde && { fecha: { gte: new Date(desde) } }),
        ...(hasta && { fecha: { lte: new Date(hasta) } }),
      },
      orderBy: { fecha: 'desc' },
    });

    const ingresos = movimientos.filter((m) => m.tipo === 'INGRESO').reduce((s, m) => s + Number(m.monto), 0);
    const egresos  = movimientos.filter((m) => m.tipo === 'EGRESO' ).reduce((s, m) => s + Number(m.monto), 0);

    return NextResponse.json({ data: movimientos, resumen: { ingresos, egresos, balance: ingresos - egresos } });
  } catch (error) {
    console.error('[GET /api/finanzas/movimientos]', error);
    return NextResponse.json({ error: 'Error al obtener movimientos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { session, error } = await requireApiRole();
  if (error) return error;
  if (!canManageFinances(session)) {
    return NextResponse.json({ error: 'Sin permisos para registrar movimientos' }, { status: 403 });
  }

  try {
    const body: unknown = await request.json();
    const parsed = MovimientoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 });
    }

    const { fecha, ...rest } = parsed.data;
    const movimiento = await db.movimientoFinanciero.create({
      data: {
        ...rest,
        registradoPorId: session.id,
        ...(fecha ? { fecha: new Date(fecha) } : {}),
      },
    });

    return NextResponse.json({ data: movimiento }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/finanzas/movimientos]', error);
    return NextResponse.json({ error: 'Error al registrar movimiento' }, { status: 500 });
  }
}

