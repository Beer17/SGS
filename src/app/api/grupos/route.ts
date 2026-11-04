// src/app/api/grupos/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireApiRole } from '@/lib/auth';
import { GrupoScoutSchema } from '@/lib/validations';

export async function GET(request: Request) {
  const { error } = await requireApiRole();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const provinciaId = searchParams.get('provinciaId') ?? undefined;

  const grupos = await db.grupoScout.findMany({
    where: { ...(provinciaId && { provinciaId }) },
    include: {
      provincia: { select: { nombre: true, region: true } },
      _count: { select: { scouts: true } },
    },
    orderBy: [{ provincia: { nombre: 'asc' } }, { numeroGrupo: 'asc' }],
  });

  return NextResponse.json({ data: grupos });
}

export async function POST(request: Request) {
  const { session, error } = await requireApiRole(['ADMIN','NACIONAL','PROVINCIA']);
  if (error) return error;

  try {
    const body: unknown = await request.json();
    const parsed = GrupoScoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 });
    }

    const grupo = await db.grupoScout.create({ data: parsed.data });
    return NextResponse.json({ data: grupo }, { status: 201 });
  } catch (error: unknown) {
    if ((error as { code?: string }).code === 'P2002') {
      return NextResponse.json({ error: 'Número de grupo ya existe en esa provincia' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Error al crear grupo' }, { status: 500 });
  }
}

