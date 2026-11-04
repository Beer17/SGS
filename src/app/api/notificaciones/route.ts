// src/app/api/notificaciones/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireApiRole } from '@/lib/auth';
import { ensureReminders } from '@/lib/reminders';

export async function GET() {
  const { session, error } = await requireApiRole();
  if (error) return error;

  try {
    await ensureReminders(session);

    const notificaciones = await db.notificacion.findMany({
      where: { destinatarioId: session.id },
      orderBy: [{ leida: 'asc' }, { createdAt: 'desc' }],
      take: 50,
    });

    const noLeidas = notificaciones.filter((n) => !n.leida).length;
    return NextResponse.json({ data: notificaciones, noLeidas });
  } catch (error) {
    console.error('[GET /api/notificaciones]', error);
    return NextResponse.json({ error: 'Error al obtener notificaciones' }, { status: 500 });
  }
}
