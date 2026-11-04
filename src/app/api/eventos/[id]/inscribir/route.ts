// src/app/api/eventos/[id]/inscribir/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireApiRole } from '@/lib/auth';
import { audit } from '@/lib/api';
import { InscripcionSchema } from '@/lib/validations';

type Params = { params: { id: string } };
const INSCRIBIR_ROLES = ['ADMIN', 'NACIONAL', 'PROVINCIA', 'GRUPO', 'SECCION'];

export async function POST(request: Request, { params }: Params) {
  const { session, error } = await requireApiRole();
  if (error) return error;
  if (!INSCRIBIR_ROLES.includes(session.role)) {
    return NextResponse.json({ error: 'Sin permisos para inscribir' }, { status: 403 });
  }
  const { id: eventoId } = params;

  try {
    const body: unknown = await request.json();
    const parsed = InscripcionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 });
    }
    const { scoutProfileId, autorizacionParental, observaciones } = parsed.data;

    const evento = await db.evento.findUnique({
      where: { id: eventoId },
      select: { id: true, nombre: true, cupoMaximo: true, requiereAutorizacion: true, cancelado: true },
    });
    if (!evento) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });
    if (evento.cancelado) return NextResponse.json({ error: 'El evento está cancelado' }, { status: 409 });

    if (evento.requiereAutorizacion && !autorizacionParental) {
      return NextResponse.json(
        { error: 'El evento requiere autorización parental firmada; confírmala al inscribir.' },
        { status: 400 },
      );
    }

    if (evento.cupoMaximo != null) {
      const inscritos = await db.inscripcionEvento.count({ where: { eventoId } });
      if (inscritos >= evento.cupoMaximo) {
        return NextResponse.json({ error: 'El evento alcanzó su cupo máximo' }, { status: 409 });
      }
    }

    const scout = await db.scoutProfile.findUnique({
      where: { id: scoutProfileId },
      select: { id: true, nombres: true, apellidos: true, estatusRegistro: true },
    });
    if (!scout) return NextResponse.json({ error: 'Miembro no encontrado' }, { status: 404 });
    if (scout.estatusRegistro === 'BAJA') {
      return NextResponse.json({ error: 'El miembro está dado de baja' }, { status: 409 });
    }

    const inscripcion = await db.inscripcionEvento.create({
      data: { eventoId, scoutProfileId, autorizacionParental, observaciones },
    });

    await audit({ userId: session.id, accion: 'INSCRIBIR_EVENTO', entidad: 'InscripcionEvento', entidadId: inscripcion.id });
    return NextResponse.json({ data: inscripcion }, { status: 201 });
  } catch (error: unknown) {
    if ((error as { code?: string }).code === 'P2002') {
      return NextResponse.json({ error: 'El miembro ya está inscrito en este evento' }, { status: 409 });
    }
    console.error('[POST /api/eventos/[id]/inscribir]', error);
    return NextResponse.json({ error: 'Error al inscribir' }, { status: 500 });
  }
}

const DesinscribirSchema = z.object({ scoutProfileId: z.string().uuid() });

export async function DELETE(request: Request, { params }: Params) {
  const { session, error } = await requireApiRole();
  if (error) return error;
  if (!INSCRIBIR_ROLES.includes(session.role)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }
  const { id: eventoId } = params;

  try {
    const parsed = DesinscribirSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'scoutProfileId inválido' }, { status: 400 });
    }
    const result = await db.inscripcionEvento.deleteMany({
      where: { eventoId, scoutProfileId: parsed.data.scoutProfileId },
    });
    if (result.count === 0) {
      return NextResponse.json({ error: 'No estaba inscrito' }, { status: 404 });
    }
    await audit({ userId: session.id, accion: 'DESINSCRIBIR_EVENTO', entidad: 'Evento', entidadId: eventoId });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[DELETE /api/eventos/[id]/inscribir]', error);
    return NextResponse.json({ error: 'Error al desinscribir' }, { status: 500 });
  }
}
