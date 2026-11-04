// src/app/api/eventos/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireApiRole } from '@/lib/auth';
import { audit } from '@/lib/api';
import { EventoSchema } from '@/lib/validations';

export async function GET(request: Request) {
  const { error } = await requireApiRole();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const tipo    = searchParams.get('tipo') ?? undefined;
  const grupoId = searchParams.get('grupoId') ?? undefined;
  const desde   = searchParams.get('desde') ?? undefined;
  const hasta   = searchParams.get('hasta') ?? undefined;
  const incluirCancelados = searchParams.get('cancelados') === '1';

  try {
    const eventos = await db.evento.findMany({
      where: {
        ...(incluirCancelados ? {} : { cancelado: false }),
        ...(tipo    && { tipo: tipo as never }),
        ...(grupoId && { grupoId }),
        ...(desde   && { fechaInicio: { gte: new Date(desde) } }),
        ...(hasta   && { fechaFin:    { lte: new Date(hasta) } }),
      },
      include: {
        grupo: { select: { nombre: true, numeroGrupo: true } },
        logistica: true,
        _count: { select: { asistencias: true, inscripciones: true } },
      },
      orderBy: { fechaInicio: 'asc' },
    });

    return NextResponse.json({ data: eventos });
  } catch (error) {
    console.error('[GET /api/eventos]', error);
    return NextResponse.json({ error: 'Error al obtener eventos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { session, error } = await requireApiRole();
  if (error) return error;
  if (!['ADMIN','NACIONAL','PROVINCIA','GRUPO'].includes(session.role)) {
    return NextResponse.json({ error: 'Sin permisos para crear eventos' }, { status: 403 });
  }

  try {
    const body: unknown = await request.json();
    const parsed = EventoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 });
    }

    const { fechaInicio, fechaFin, ...rest } = parsed.data;
    if (new Date(fechaFin) < new Date(fechaInicio)) {
      return NextResponse.json({ error: 'La fecha de fin no puede ser anterior al inicio' }, { status: 400 });
    }
    const evento = await db.evento.create({
      data: { ...rest, fechaInicio: new Date(fechaInicio), fechaFin: new Date(fechaFin) },
    });

    await audit({ userId: session.id, accion: 'CREAR_EVENTO', entidad: 'Evento', entidadId: evento.id });
    return NextResponse.json({ data: evento }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/eventos]', error);
    return NextResponse.json({ error: 'Error al crear evento' }, { status: 500 });
  }
}

