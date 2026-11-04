// src/app/api/usuarios/route.ts
// Gestión de cuentas. Solo ADMIN (lectura también NACIONAL). Las altas requieren
// contraseña temporal; el usuario deberá cambiarla en su primer ingreso.
import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { requireApiRole } from '@/lib/auth';
import { audit } from '@/lib/api';

export async function GET() {
  const { session, error } = await requireApiRole(['ADMIN', 'NACIONAL']);
  if (error) return error;
  void session;

  const users = await db.user.findMany({
    select: {
      id: true, email: true, role: true, activo: true, lastLogin: true, createdAt: true,
      scoutProfile: { select: { nombres: true, apellidos: true } },
    },
    orderBy: [{ activo: 'desc' }, { email: 'asc' }],
  });

  return NextResponse.json({ data: users });
}

const CrearUsuarioSchema = z.object({
  email: z.string().email().max(200).transform((e) => e.toLowerCase().trim()),
  password: z.string().min(8, 'Mínimo 8 caracteres').max(100),
  role: z.enum(['ADMIN', 'NACIONAL', 'PROVINCIA', 'GRUPO', 'SECCION', 'MIEMBRO_TUTOR']),
});

export async function POST(request: Request) {
  const { session, error } = await requireApiRole(['ADMIN']);
  if (error) return error;

  try {
    const parsed = CrearUsuarioSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 });
    }

    const { password, ...rest } = parsed.data;
    const user = await db.user.create({
      data: { ...rest, passwordHash: await bcrypt.hash(password, 10) },
      select: { id: true, email: true, role: true, activo: true },
    });

    await audit({ userId: session.id, accion: 'CREAR_USUARIO', entidad: 'User', entidadId: user.id });
    return NextResponse.json({ data: user }, { status: 201 });
  } catch (error: unknown) {
    if ((error as { code?: string }).code === 'P2002') {
      return NextResponse.json({ error: 'Ya existe una cuenta con ese correo' }, { status: 409 });
    }
    console.error('[POST /api/usuarios]', error);
    return NextResponse.json({ error: 'Error al crear la cuenta' }, { status: 500 });
  }
}

const ActualizarUsuarioSchema = z.object({
  id: z.string().uuid(),
  activo: z.boolean().optional(),
  role: z.enum(['ADMIN', 'NACIONAL', 'PROVINCIA', 'GRUPO', 'SECCION', 'MIEMBRO_TUTOR']).optional(),
});

export async function PATCH(request: Request) {
  const { session, error } = await requireApiRole(['ADMIN']);
  if (error) return error;

  try {
    const parsed = ActualizarUsuarioSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 });
    }
    const { id, ...data } = parsed.data;

    if (id === session.id && data.activo === false) {
      return NextResponse.json({ error: 'No puedes desactivar tu propia cuenta' }, { status: 400 });
    }

    const user = await db.user.update({
      where: { id },
      data,
      select: { id: true, email: true, role: true, activo: true },
    });

    await audit({ userId: session.id, accion: 'EDITAR_USUARIO', entidad: 'User', entidadId: id, datosDespues: data });
    return NextResponse.json({ data: user });
  } catch (error) {
    if ((error as { code?: string }).code === 'P2025') {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }
    console.error('[PATCH /api/usuarios]', error);
    return NextResponse.json({ error: 'Error al actualizar la cuenta' }, { status: 500 });
  }
}
