// src/app/api/notificaciones/[id]/leer/route.ts
// Nota Next 14: params es un objeto plano (en Next 15 sería Promise).
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireApiRole } from '@/lib/auth';

async function marcarLeida(id: string) {
  const { session, error } = await requireApiRole();
  if (error) return error;

  const result = await db.notificacion.updateMany({
    where: { id, destinatarioId: session.id }, // solo las propias
    data: { leida: true },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: 'Notificación no encontrada' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  return marcarLeida(params.id);
}

export async function PATCH(_request: Request, { params }: { params: { id: string } }) {
  return marcarLeida(params.id);
}
