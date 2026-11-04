// src/app/api/miembros/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireApiRole, canManageMembers } from '@/lib/auth';
import { audit } from '@/lib/api';
import { ScoutProfileSchema } from '@/lib/validations';
import type { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  const { session, error } = await requireApiRole();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const page     = Math.max(1, Number(searchParams.get('page')  ?? 1));
  const limit    = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 20)));
  const busqueda = (searchParams.get('q') ?? '').trim();
  const seccion  = searchParams.get('seccion') ?? undefined;
  const estatus  = searchParams.get('estatus') ?? undefined;
  const grupoId  = searchParams.get('grupoId') ?? undefined;

  // Un tutor solo ve los expedientes vinculados a su cuenta
  const tutorScope = session.role === 'MIEMBRO_TUTOR' ? { userId: session.id } : {};

  const where: Prisma.ScoutProfileWhereInput = {
    ...tutorScope,
    ...(busqueda && {
      OR: [
        { nombres:   { contains: busqueda, mode: 'insensitive' } },
        { apellidos: { contains: busqueda, mode: 'insensitive' } },
        { curp:      { contains: busqueda, mode: 'insensitive' } },
      ],
    }),
    ...(seccion && { seccion: seccion as Prisma.ScoutProfileWhereInput['seccion'] }),
    ...(estatus && { estatusRegistro: estatus as Prisma.ScoutProfileWhereInput['estatusRegistro'] }),
    ...(grupoId && { grupoId }),
  };

  try {
    const [data, total] = await Promise.all([
      db.scoutProfile.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ apellidos: 'asc' }, { nombres: 'asc' }],
        select: {
          id: true, nombres: true, apellidos: true, seccion: true,
          estatusRegistro: true, cicloActivo: true, updatedAt: true,
          grupo: { select: { nombre: true, numeroGrupo: true } },
          provincia: { select: { nombre: true } },
        },
      }),
      db.scoutProfile.count({ where }),
    ]);

    return NextResponse.json({ data, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('[GET /api/miembros]', error);
    return NextResponse.json({ error: 'Error al obtener miembros' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { session, error } = await requireApiRole();
  if (error) return error;
  if (!canManageMembers(session)) {
    return NextResponse.json({ error: 'Sin permisos para dar de alta miembros' }, { status: 403 });
  }

  try {
    const body: unknown = await request.json();
    const parsed = ScoutProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 });
    }

    const { curp, fechaNacimiento, ...rest } = parsed.data;
    const scout = await db.scoutProfile.create({
      data: {
        ...rest,
        ...(curp ? { curp: curp.toUpperCase() } : {}),
        fechaNacimiento: new Date(fechaNacimiento),
      },
    });

    await audit({ userId: session.id, accion: 'CREAR_MIEMBRO', entidad: 'ScoutProfile', entidadId: scout.id });

    return NextResponse.json({ data: scout }, { status: 201 });
  } catch (error: unknown) {
    if ((error as { code?: string }).code === 'P2002') {
      return NextResponse.json({ error: 'CURP ya registrada' }, { status: 409 });
    }
    console.error('[POST /api/miembros]', error);
    return NextResponse.json({ error: 'Error al crear miembro' }, { status: 500 });
  }
}
