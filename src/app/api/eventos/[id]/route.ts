// src/app/api/eventos/[id]/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireApiRole, canOperate } from '@/lib/auth';
import { audit } from '@/lib/api';
import { EventoSchema } from '@/lib/validations';
import { z } from 'zod';

type Params = { params: { id: string } };
const EVENTO_ROLES = ['ADMIN', 'NACIONAL', 'PROVINCIA', 'GRUPO'] as const;

export async function GET(_request: Request, { params }: Params) {
  // Detalle incluye nombres de menores inscritos: solo jefatura/coordinación
  const { session, error } = await requireApiRole();
  if (error) return error;
  if (!canOperate(session)) {
    return NextResponse.json({ error: 'Sin permisos para ver el detalle del evento' }, { status: 403 });
  }
  const { id } = params;

  try {
    const evento = await db.evento.findUnique({
      where: { id },
      include: {
        grupo: { select: { nombre: true, numeroGrupo: true } },
        logistica: true,
        inscripciones: {
          include: {
            scoutProfile: {
              select: {
                id: true, nombres: true, apellidos: true, seccion: true, estatusRegistro: true,
                fichaMedica: { select: { autorizacionActividades: true, alergias: true, restriccionesActividad: true } },
              },
            },
          },
          orderBy: { fechaInscripcion: 'asc' },
        },
        _count: { select: { asistencias: true } },
      },
    });

    if (!evento) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });

    const cupoDisponible =
      evento.cupoMaximo == null ? null : Math.max(0, evento.cupoMaximo - evento.inscripciones.length);

    return NextResponse.json({ data: { ...evento, cupoDisponible } });
  } catch (error) {
    console.error('[GET /api/eventos/[id]]', error);
    return NextResponse.json({ error: 'Error al obtener el evento' }, { status: 500 });
  }
}

const EventoPatchSchema = EventoSchema.partial().extend({ cancelado: z.boolean().optional() });

export async function PATCH(request: Request, { params }: Params) {
  const { session, error } = await requireApiRole();
  if (error) return error;
  if (!(EVENTO_ROLES as readonly string[]).includes(session.role)) {
    return NextResponse.json({ error: 'Sin permisos para editar eventos' }, { status: 403 });
  }
  const { id } = params;

  try {
    const body: unknown = await request.json();
    const parsed = EventoPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 });
    }

    const { fechaInicio, fechaFin, ...rest } = parsed.data;
    const evento = await db.evento.update({
      where: { id },
      data: {
        ...rest,
        ...(fechaInicio ? { fechaInicio: new Date(fechaInicio) } : {}),
        ...(fechaFin ? { fechaFin: new Date(fechaFin) } : {}),
      },
    });

    await audit({
      userId: session.id,
      accion: parsed.data.cancelado === true ? 'CANCELAR_EVENTO' : 'EDITAR_EVENTO',
      entidad: 'Evento',
      entidadId: id,
    });

    return NextResponse.json({ data: evento });
  } catch (error) {
    if ((error as { code?: string }).code === 'P2025') {
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });
    }
    console.error('[PATCH /api/eventos/[id]]', error);
    return NextResponse.json({ error: 'Error al actualizar el evento' }, { status: 500 });
  }
}

/** Elimina un evento SIN inscripciones/asistencias; si las tiene, usa cancelar. */
export async function DELETE(_request: Request, { params }: Params) {
  const { session, error } = await requireApiRole();
  if (error) return error;
  if (session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Solo ADMIN puede eliminar eventos' }, { status: 403 });
  }
  const { id } = params;

  const [inscripciones, asistencias] = await Promise.all([
    db.inscripcionEvento.count({ where: { eventoId: id } }),
    db.asistencia.count({ where: { eventoId: id } }),
  ]);

  if (inscripciones > 0 || asistencias > 0) {
    return NextResponse.json(
      { error: 'El evento tiene inscripciones o asistencias; cancélalo en su lugar.' },
      { status: 409 },
    );
  }

  await db.evento.delete({ where: { id } });
  await audit({ userId: session.id, accion: 'ELIMINAR_EVENTO', entidad: 'Evento', entidadId: id });
  return NextResponse.json({ ok: true });
}
