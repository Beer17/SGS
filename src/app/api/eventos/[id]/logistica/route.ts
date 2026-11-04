// src/app/api/eventos/[id]/logistica/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireApiRole } from '@/lib/auth';
import { audit } from '@/lib/api';
import { LogisticaEventoSchema } from '@/lib/validations';

type Params = { params: { id: string } };
const LOGISTICA_ROLES = ['ADMIN', 'NACIONAL', 'PROVINCIA', 'GRUPO'];

export async function PUT(request: Request, { params }: Params) {
  const { session, error } = await requireApiRole();
  if (error) return error;
  if (!LOGISTICA_ROLES.includes(session.role)) {
    return NextResponse.json({ error: 'Sin permisos para editar logística' }, { status: 403 });
  }
  const { id: eventoId } = params;

  try {
    const body: unknown = await request.json();
    const parsed = LogisticaEventoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 });
    }

    const evento = await db.evento.findUnique({ where: { id: eventoId }, select: { id: true } });
    if (!evento) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });

    const logistica = await db.logisticaEvento.upsert({
      where: { eventoId },
      create: { eventoId, ...parsed.data },
      update: parsed.data,
    });

    await audit({ userId: session.id, accion: 'EDITAR_LOGISTICA', entidad: 'LogisticaEvento', entidadId: logistica.id });
    return NextResponse.json({ data: logistica });
  } catch (error) {
    console.error('[PUT /api/eventos/[id]/logistica]', error);
    return NextResponse.json({ error: 'Error al guardar la logística' }, { status: 500 });
  }
}
