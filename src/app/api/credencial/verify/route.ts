// src/app/api/credencial/verify/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get('code');
  if (!code) return NextResponse.json({ valid: false, message: 'Código requerido' }, { status: 400 });

  try {
    const scout = await db.scoutProfile.findUnique({
      where: { codigoCredencialQR: code },
      select: {
        nombres: true,
        apellidos: true,
        seccion: true,
        estatusRegistro: true,
        grupo: { select: { nombre: true, numeroGrupo: true } },
        provincia: { select: { nombre: true } },
      },
    });

    if (!scout) {
      return NextResponse.json({ valid: false, message: 'Credencial no encontrada' }, { status: 404 });
    }

    const valid = scout.estatusRegistro === 'ACTIVO';
    // Sin datos médicos: la verificación pública solo confirma identidad y estatus
    return NextResponse.json({
      valid,
      code,
      scout: {
        nombres: scout.nombres,
        apellidos: scout.apellidos,
        seccion: scout.seccion,
        grupo: `Grupo ${scout.grupo.numeroGrupo} - ${scout.grupo.nombre}`,
        provincia: scout.provincia.nombre,
        estatusRegistro: scout.estatusRegistro,
      },
    });
  } catch (error) {
    console.error('[GET /api/credencial/verify]', error);
    return NextResponse.json({ valid: false, message: 'Error al verificar' }, { status: 500 });
  }
}
