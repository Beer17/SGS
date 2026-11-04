// src/app/api/asistencia/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireApiRole, canOperate } from '@/lib/auth';
import { AsistenciaSchema } from '@/lib/validations';
import { extractCredentialCode } from '@/lib/attendance';

export async function POST(request: Request) {
  const { session, error } = await requireApiRole();
  if (error) return error;

  try {
    const body: unknown = await request.json();
    const parsed = AsistenciaSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 });
    }

    const { records } = parsed.data;

    // Verificar que los eventos existen antes de escribir nada
    const eventIds = [...new Set(records.map((r) => r.eventId))];
    const eventos = await db.evento.findMany({
      where: { id: { in: eventIds } },
      select: { id: true, cancelado: true },
    });
    const eventosValidos = new Map(eventos.map((e) => [e.id, e]));

    const results = await Promise.allSettled(
      records.map(async (rec) => {
        const evento = eventosValidos.get(rec.eventId);
        if (!evento) throw new Error(`Evento no encontrado: ${rec.eventId}`);
        if (evento.cancelado) throw new Error(`Evento cancelado: ${rec.eventId}`);

        const code = extractCredentialCode(rec.credentialCode);
        if (!code) throw new Error('Código de credencial inválido o ilegible');

        const scout = await db.scoutProfile.findUnique({
          where: { codigoCredencialQR: code },
          select: { id: true, nombres: true, apellidos: true, estatusRegistro: true },
        });
        if (!scout) throw new Error('Credencial no reconocida');
        if (scout.estatusRegistro === 'BAJA') throw new Error(`${scout.nombres} ${scout.apellidos} está dado de baja`);

        return db.asistencia.upsert({
          where: { eventoId_scoutProfileId: { eventoId: rec.eventId, scoutProfileId: scout.id } },
          create: {
            eventoId: rec.eventId,
            scoutProfileId: scout.id,
            horaEscaneo: new Date(rec.scannedAt),
            sincronizadoOffline: rec.synchronizedOffline,
            registradoPorId: session.id,
          },
          update: { horaEscaneo: new Date(rec.scannedAt) },
        });
      }),
    );

    const accepted = results.filter((r) => r.status === 'fulfilled').length;
    const rejected = results.length - accepted;
    const errores = results
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .map((r) => String(r.reason?.message ?? r.reason));

    return NextResponse.json({ accepted, rejected, total: records.length, errores });
  } catch (error) {
    console.error('[POST /api/asistencia]', error);
    return NextResponse.json({ error: 'Error al registrar asistencia' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { session, error } = await requireApiRole();
  if (error) return error;
  if (!canOperate(session)) {
    return NextResponse.json({ error: 'Sin permisos para ver la lista de asistencia' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const eventoId = searchParams.get('eventoId');
  if (!eventoId) return NextResponse.json({ error: 'eventoId requerido' }, { status: 400 });

  const asistencias = await db.asistencia.findMany({
    where: { eventoId },
    include: { scoutProfile: { select: { nombres: true, apellidos: true, seccion: true } } },
    orderBy: { horaEscaneo: 'asc' },
  });

  return NextResponse.json({ data: asistencias, total: asistencias.length });
}
