// src/app/api/insignias/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireApiRole } from '@/lib/auth';
import { InsigniaSchema } from '@/lib/validations';

export async function GET(request: Request) {
  const { error } = await requireApiRole();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const seccion = searchParams.get('seccion') ?? undefined;

  const insignias = await db.insignia.findMany({
    where: { ...(seccion && { OR: [{ seccion: seccion as never }, { seccion: null }] }) },
    orderBy: [{ seccion: 'asc' }, { nombre: 'asc' }],
  });

  return NextResponse.json({ data: insignias });
}

export async function POST(request: Request) {
  const { error } = await requireApiRole(['ADMIN','NACIONAL']);
  if (error) return error;

  const body: unknown = await request.json();
  const parsed = InsigniaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 });
  }

  const insignia = await db.insignia.create({ data: parsed.data });
  return NextResponse.json({ data: insignia }, { status: 201 });
}

