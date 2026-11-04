// src/app/api/inventario/[id]/prestar/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireApiRole } from '@/lib/auth';
import { audit } from '@/lib/api';
import { PrestamoSchema } from '@/lib/validations';

type Params = { params: { id: string } };
const INVENTARIO_ROLES = ['ADMIN', 'NACIONAL', 'PROVINCIA', 'GRUPO'];

export async function POST(request: Request, { params }: Params) {
  const { session, error } = await requireApiRole();
  if (error) return error;
  if (!INVENTARIO_ROLES.includes(session.role)) {
    return NextResponse.json({ error: 'Sin permisos para prestar equipo' }, { status: 403 });
  }
  const { id } = params;

  try {
    const body: unknown = await request.json();
    const parsed = PrestamoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 });
    }

    const item = await db.itemInventario.findUnique({ where: { id }, select: { id: true, estado: true, nombre: true } });
    if (!item) return NextResponse.json({ error: 'Ítem no encontrado' }, { status: 404 });
    if (item.estado !== 'DISPONIBLE') {
      return NextResponse.json({ error: `El ítem no está disponible (estado: ${item.estado})` }, { status: 409 });
    }

    const [prestamo] = await db.$transaction([
      db.prestamoInventario.create({
        data: { itemId: id, ...parsed.data },
      }),
      db.itemInventario.update({ where: { id }, data: { estado: 'PRESTADO' } }),
    ]);

    await audit({ userId: session.id, accion: 'PRESTAR_ITEM', entidad: 'PrestamoInventario', entidadId: prestamo.id });
    return NextResponse.json({ data: prestamo }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/inventario/[id]/prestar]', error);
    return NextResponse.json({ error: 'Error al registrar el préstamo' }, { status: 500 });
  }
}
