// src/app/api/miembros/[id]/ficha-medica/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireApiRole, canViewMedical } from '@/lib/auth';
import { audit } from '@/lib/api';
import { FichaMedicaSchema } from '@/lib/validations';

type Params = { params: { id: string } };

export async function GET(_request: Request, { params }: Params) {
  const { session, error } = await requireApiRole();
  if (error) return error;
  if (!canViewMedical(session)) {
    return NextResponse.json({ error: 'No autorizado para ver fichas médicas' }, { status: 403 });
  }

  const ficha = await db.fichaMedica.findUnique({ where: { scoutProfileId: params.id } });
  if (!ficha) return NextResponse.json({ error: 'Ficha médica no registrada' }, { status: 404 });

  await audit({ userId: session.id, accion: 'CONSULTA_FICHA_MEDICA', entidad: 'FichaMedica', entidadId: ficha.id });
  return NextResponse.json({ data: ficha });
}

export async function PUT(request: Request, { params }: Params) {
  const { session, error } = await requireApiRole();
  if (error) return error;
  if (!canViewMedical(session)) {
    return NextResponse.json({ error: 'No autorizado para editar fichas médicas' }, { status: 403 });
  }

  try {
    const body: unknown = await request.json();
    const parsed = FichaMedicaSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 });
    }

    const scout = await db.scoutProfile.findUnique({ where: { id: params.id }, select: { id: true } });
    if (!scout) return NextResponse.json({ error: 'Miembro no encontrado' }, { status: 404 });

    const ficha = await db.fichaMedica.upsert({
      where: { scoutProfileId: params.id },
      create: { scoutProfileId: params.id, ...parsed.data },
      update: parsed.data,
    });

    await audit({ userId: session.id, accion: 'EDITAR_FICHA_MEDICA', entidad: 'FichaMedica', entidadId: ficha.id });
    return NextResponse.json({ data: ficha });
  } catch (error) {
    console.error('[PUT /api/miembros/[id]/ficha-medica]', error);
    return NextResponse.json({ error: 'Error al guardar la ficha médica' }, { status: 500 });
  }
}
