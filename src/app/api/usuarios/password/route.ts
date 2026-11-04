// src/app/api/usuarios/password/route.ts
// Cambio de contraseña propia (requiere la contraseña actual).
import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { requireApiRole } from '@/lib/auth';
import { audit } from '@/lib/api';

const CambiarSchema = z.object({
  actual: z.string().min(1),
  nueva: z.string().min(8, 'Mínimo 8 caracteres').max(100),
});

export async function POST(request: Request) {
  const { session, error } = await requireApiRole();
  if (error) return error;

  try {
    const parsed = CambiarSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id: session.id }, select: { id: true, passwordHash: true } });
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

    const valid = await bcrypt.compare(parsed.data.actual, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'La contraseña actual es incorrecta' }, { status: 403 });
    }

    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(parsed.data.nueva, 10) },
    });

    await audit({ userId: session.id, accion: 'CAMBIO_PASSWORD', entidad: 'User', entidadId: user.id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[POST /api/usuarios/password]', error);
    return NextResponse.json({ error: 'Error al cambiar la contraseña' }, { status: 500 });
  }
}
