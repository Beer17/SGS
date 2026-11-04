// src/app/api/progresion/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireApiRole, canOperate } from '@/lib/auth';
import { ProgresionSchema } from '@/lib/validations';

export async function GET(request: Request) {
  const { session, error } = await requireApiRole();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const scoutId = searchParams.get('scoutId');
  if (!scoutId) return NextResponse.json({ error: 'scoutId requerido' }, { status: 400 });

  // Tutor: solo puede consultar el expediente vinculado a su cuenta
  if (session.role === 'MIEMBRO_TUTOR') {
    const owned = await db.scoutProfile.findFirst({ where: { id: scoutId, userId: session.id }, select: { id: true } });
    if (!owned) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const progresiones = await db.progresionScout.findMany({
    where: { scoutProfileId: scoutId },
    include: { aprobadaPor: { select: { email: true } } },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json({ data: progresiones });
}

export async function POST(request: Request) {
  const { session, error } = await requireApiRole();
  if (error) return error;
  if (!canOperate(session)) {
    return NextResponse.json({ error: 'Sin permisos para registrar etapas' }, { status: 403 });
  }

  try {
    const body: unknown = await request.json();
    const parsed = ProgresionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 });
    }

    const prog = await db.progresionScout.create({ data: parsed.data });
    return NextResponse.json({ data: prog }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/progresion]', error);
    return NextResponse.json({ error: 'Error al registrar progresión' }, { status: 500 });
  }
}

