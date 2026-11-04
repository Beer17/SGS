// src/app/api/miembros/import/plantilla/route.ts
// Descarga la plantilla CSV para importar el censo.
import { NextResponse } from 'next/server';
import { requireApiRole } from '@/lib/auth';

const PLANTILLA = [
  'nombres,apellidos,curp,fecha_nacimiento,seccion,grupo,provincia,telefono,direccion',
  'Diego,Martínez López,MARD950101HDFXYZ01,2012-05-14,TROPA,12,Querétaro,4421234567,"Calle Hidalgo #120, Centro"',
  'Sofía,Hernández García,,2014-09-02,MANADA_GACELAS,12,Querétaro,,',
  'Mateo,García Ruiz,,2010-03-27,MANADA_LOBATOS,4,Puebla,,',
  '',
].join('\r\n');

export async function GET() {
  const { error } = await requireApiRole();
  if (error) return error;

  return new NextResponse('﻿' + PLANTILLA, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="plantilla-censo.csv"',
    },
  });
}
