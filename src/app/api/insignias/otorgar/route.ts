// src/app/api/insignias/otorgar/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireApiRole } from '@/lib/auth';
import { InsigniaOtorgarSchema } from '@/lib/validations';

export async function POST(request: Request) {
  const { session, error } = await requireApiRole();
  if (error) return error;
  if (!['ADMIN','NACIONAL','PROVINCIA','GRUPO','SECCION'].includes(session.role)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }

  try {
    const body: unknown = await request.json();
    const parsed = InsigniaOtorgarSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 });
    }

    const obtenida = await db.insigniaObtenida.create({
      data: { ...parsed.data, otorgadaPorId: session.id },
      include: { scoutProfile: { select: { userId: true, nombres: true, apellidos: true } }, insignia: { select: { nombre: true } } },
    });

    if (obtenida.scoutProfile.userId) {
      await db.notificacion.create({
        data: {
          destinatarioId: obtenida.scoutProfile.userId,
          tipo: 'SISTEMA',
          titulo: 'Nueva insignia obtenida',
          mensaje: `${obtenida.scoutProfile.nombres} ${obtenida.scoutProfile.apellidos} obtuvo la insignia "${obtenida.insignia.nombre}".`,
          accionUrl: '/progresion',
          dedupeKey: `insignia:${obtenida.id}`,
        },
      });
    }

    return NextResponse.json({ data: obtenida }, { status: 201 });
  } catch (error: unknown) {
    if ((error as { code?: string }).code === 'P2002') {
      return NextResponse.json({ error: 'El scout ya tiene esta insignia' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Error al otorgar insignia' }, { status: 500 });
  }
}

