// src/app/api/miembros/import/route.ts
// Importación masiva de censo desde CSV. Crea miembros en estatus PENDIENTE
// (requieren validación de jefatura). No toca registros existentes.
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireApiRole, canManageMembers } from '@/lib/auth';
import { audit } from '@/lib/api';
import { parseCsv, rowToObject } from '@/lib/csv';

const MAX_ROWS = 500;
const SECCIONES = ['MANADA', 'TROPA', 'COMUNIDAD', 'CLAN', 'JEFATURA'] as const;

const FilaSchema = z.object({
  nombres: z.string().min(1).max(100),
  apellidos: z.string().min(1).max(100),
  curp: z.string().length(18, 'CURP debe tener 18 caracteres').optional().or(z.literal('')),
  fecha_nacimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Usa formato AAAA-MM-DD'),
  seccion: z.enum(SECCIONES),
  grupo: z.coerce.number().int().positive(),
  provincia: z.string().min(1).max(100),
  telefono: z.string().max(20).optional().or(z.literal('')),
  direccion: z.string().max(300).optional().or(z.literal('')),
});

export async function POST(request: Request) {
  const { session, error } = await requireApiRole();
  if (error) return error;
  if (!canManageMembers(session)) {
    return NextResponse.json({ error: 'Sin permisos para importar' }, { status: 403 });
  }

  try {
    const body = (await request.json()) as { csv?: string };
    const csv = body.csv;
    if (!csv || typeof csv !== 'string' || csv.length > 1_000_000) {
      return NextResponse.json({ error: 'CSV requerido (máx. 1 MB)' }, { status: 400 });
    }

    const { headers, rows } = parseCsv(csv);
    if (rows.length === 0) {
      return NextResponse.json({ error: 'El CSV no contiene filas de datos' }, { status: 400 });
    }
    if (rows.length > MAX_ROWS) {
      return NextResponse.json({ error: `Máximo ${MAX_ROWS} filas por importación` }, { status: 400 });
    }

    const required = ['nombres', 'apellidos', 'fecha_nacimiento', 'seccion', 'grupo', 'provincia'];
    const missing = required.filter((h) => !headers.includes(h));
    if (missing.length > 0) {
      return NextResponse.json({ error: `Faltan columnas: ${missing.join(', ')}`, headers }, { status: 400 });
    }

    // Resolver grupos por (provincia, numeroGrupo) una sola vez
    const provincias = await db.provincia.findMany({ select: { id: true, nombre: true } });
    const provinciaByNombre = new Map(provincias.map((p) => [p.nombre.trim().toLowerCase(), p.id]));
    const grupos = await db.grupoScout.findMany({ select: { id: true, numeroGrupo: true, provinciaId: true } });

    const resultados = { creados: 0, errores: [] as Array<{ fila: number; motivo: string }> };

    for (let i = 0; i < rows.length; i++) {
      const fila = i + 2; // +1 por header, +1 por índice 1-based
      const obj = rowToObject(headers, rows[i]);

      const parsed = FilaSchema.safeParse({ ...obj, seccion: obj.seccion?.toUpperCase() });
      if (!parsed.success) {
        resultados.errores.push({ fila, motivo: parsed.error.issues.map((e) => e.message).join('; ') });
        continue;
      }

      const data = parsed.data;
      const provinciaId = provinciaByNombre.get(data.provincia.trim().toLowerCase());
      if (!provinciaId) {
        resultados.errores.push({ fila, motivo: `Provincia no reconocida: ${data.provincia}` });
        continue;
      }
      const grupo = grupos.find((g) => g.provinciaId === provinciaId && g.numeroGrupo === data.grupo);
      if (!grupo) {
        resultados.errores.push({ fila, motivo: `Grupo ${data.grupo} no existe en ${data.provincia}` });
        continue;
      }

      try {
        await db.scoutProfile.create({
          data: {
            nombres: data.nombres.trim(),
            apellidos: data.apellidos.trim(),
            ...(data.curp ? { curp: data.curp.trim().toUpperCase() } : {}),
            fechaNacimiento: new Date(`${data.fecha_nacimiento}T00:00:00`),
            seccion: data.seccion,
            grupoId: grupo.id,
            provinciaId,
            telefono: data.telefono || null,
            direccion: data.direccion || null,
            estatusRegistro: 'PENDIENTE', // pendiente de validación de jefatura
            cicloActivo: '2026-2027',
          },
        });
        resultados.creados += 1;
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        resultados.errores.push({ fila, motivo: code === 'P2002' ? 'CURP duplicada' : 'Error al crear' });
      }
    }

    await audit({
      userId: session.id,
      accion: 'IMPORTAR_CENSO',
      entidad: 'ScoutProfile',
      entidadId: `import-${Date.now()}`,
      datosDespues: { creados: resultados.creados, errores: resultados.errores.length },
    });

    return NextResponse.json(resultados);
  } catch (error) {
    console.error('[POST /api/miembros/import]', error);
    return NextResponse.json({ error: 'Error al procesar el CSV' }, { status: 500 });
  }
}
