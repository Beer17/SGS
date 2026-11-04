// src/app/api/inventario/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireApiRole, canOperate } from '@/lib/auth';
import { InventarioItemSchema } from '@/lib/validations';

export async function GET(request: Request) {
  const { session, error } = await requireApiRole();
  if (error) return error;
  if (!canOperate(session)) {
    return NextResponse.json({ error: 'Sin permisos para ver inventario' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const grupoId  = searchParams.get('grupoId');
  const estado   = searchParams.get('estado') ?? undefined;
  const categoria= searchParams.get('categoria') ?? undefined;

  if (!grupoId) return NextResponse.json({ error: 'grupoId requerido' }, { status: 400 });

  try {
    const items = await db.itemInventario.findMany({
      where: {
        grupoId,
        ...(estado    && { estado: estado as never }),
        ...(categoria && { categoria }),
      },
      include: { prestamos: { where: { devuelto: false } } },
      orderBy: { nombre: 'asc' },
    });

    return NextResponse.json({ data: items });
  } catch (error) {
    console.error('[GET /api/inventario]', error);
    return NextResponse.json({ error: 'Error al obtener inventario' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { session, error } = await requireApiRole();
  if (error) return error;
  if (!['ADMIN','NACIONAL','GRUPO'].includes(session.role)) {
    return NextResponse.json({ error: 'Sin permisos para agregar inventario' }, { status: 403 });
  }

  try {
    const body: unknown = await request.json();
    const parsed = InventarioItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 });
    }

    const { fechaAdquisicion, ...rest } = parsed.data;
    const item = await db.itemInventario.create({
      data: {
        ...rest,
        ...(fechaAdquisicion ? { fechaAdquisicion: new Date(fechaAdquisicion) } : {}),
      },
    });

    return NextResponse.json({ data: item }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/inventario]', error);
    return NextResponse.json({ error: 'Error al crear ítem' }, { status: 500 });
  }
}

