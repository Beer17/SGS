// src/app/api/miembros/[id]/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireApiRole, canManageMembers, canViewMedical } from '@/lib/auth';
import { audit, maskCurp } from '@/lib/api';
import { ScoutProfileSchema } from '@/lib/validations';
import type { Prisma } from '@prisma/client';

type Params = { params: { id: string } };

export async function GET(_request: Request, { params }: Params) {
  const { session, error } = await requireApiRole();
  if (error) return error;
  const { id } = params;

  try {
    const scout = await db.scoutProfile.findUnique({
      where: { id },
      include: {
        grupo: { select: { id: true, nombre: true, numeroGrupo: true, provinciaId: true } },
        provincia: { select: { id: true, nombre: true, region: true } },
        // La ficha médica SOLO para jefatura; nunca para tutores ajenos
        ...(canViewMedical(session) ? { fichaMedica: true as const } : {}),
        progresiones: { orderBy: { createdAt: 'asc' } },
        insigniasObtenidas: { include: { insignia: true } },
        user: { select: { id: true, email: true } },
      },
    });

    if (!scout) return NextResponse.json({ error: 'Miembro no encontrado' }, { status: 404 });

    // Tutor: solo su expediente vinculado
    if (session.role === 'MIEMBRO_TUTOR' && scout.user?.id !== session.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    if (scout.fichaMedica) {
      await audit({ userId: session.id, accion: 'CONSULTA_FICHA_MEDICA', entidad: 'FichaMedica', entidadId: scout.fichaMedica.id });
    }

    return NextResponse.json({
      data: { ...scout, curp: maskCurp(scout.curp) },
    });
  } catch (error) {
    console.error('[GET /api/miembros/[id]]', error);
    return NextResponse.json({ error: 'Error al obtener el miembro' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const { session, error } = await requireApiRole();
  if (error) return error;
  if (!canManageMembers(session)) {
    return NextResponse.json({ error: 'Sin permisos para editar miembros' }, { status: 403 });
  }
  const { id } = params;

  try {
    const body: unknown = await request.json();
    const PartialSchema = ScoutProfileSchema.partial();
    const parsed = PartialSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 });
    }

    const { curp, fechaNacimiento, ...rest } = parsed.data;
    const data: Prisma.ScoutProfileUpdateInput = {
      ...rest,
      ...(curp !== undefined ? { curp: curp ? curp.toUpperCase() : null } : {}),
      ...(fechaNacimiento ? { fechaNacimiento: new Date(fechaNacimiento) } : {}),
    };

    const updated = await db.scoutProfile.update({ where: { id }, data });
    await audit({ userId: session.id, accion: 'EDITAR_MIEMBRO', entidad: 'ScoutProfile', entidadId: id });

    return NextResponse.json({ data: updated });
  } catch (error: unknown) {
    const code = (error as { code?: string }).code;
    if (code === 'P2025') return NextResponse.json({ error: 'Miembro no encontrado' }, { status: 404 });
    if (code === 'P2002') return NextResponse.json({ error: 'CURP ya registrada' }, { status: 409 });
    console.error('[PATCH /api/miembros/[id]]', error);
    return NextResponse.json({ error: 'Error al actualizar el miembro' }, { status: 500 });
  }
}

/** Baja lógica: marca estatusRegistro = BAJA. Nunca borra el expediente. */
export async function DELETE(_request: Request, { params }: Params) {
  const { session, error } = await requireApiRole();
  if (error) return error;
  if (!canManageMembers(session)) {
    return NextResponse.json({ error: 'Sin permisos para dar de baja' }, { status: 403 });
  }
  const { id } = params;

  try {
    await db.scoutProfile.update({ where: { id }, data: { estatusRegistro: 'BAJA' } });
    await audit({ userId: session.id, accion: 'BAJA_MIEMBRO', entidad: 'ScoutProfile', entidadId: id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if ((error as { code?: string }).code === 'P2025') {
      return NextResponse.json({ error: 'Miembro no encontrado' }, { status: 404 });
    }
    console.error('[DELETE /api/miembros/[id]]', error);
    return NextResponse.json({ error: 'Error al dar de baja' }, { status: 500 });
  }
}
