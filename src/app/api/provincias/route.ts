// src/app/api/provincias/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireApiRole } from '@/lib/auth';

export async function GET() {
  const { error } = await requireApiRole();
  if (error) return error;

  const provincias = await db.provincia.findMany({
    select: { id: true, nombre: true, region: true, _count: { select: { grupos: true } } },
    orderBy: { nombre: 'asc' },
  });
  return NextResponse.json({ data: provincias });
}
