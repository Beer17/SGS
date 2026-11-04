// src/lib/api.ts
// Utilidades compartidas para Route Handlers.
import { db } from '@/lib/db';

/** Registra una acción sensible en la bitácora de auditoría. Nunca lanza. */
export async function audit(params: {
  userId: string;
  accion: string; // ej. "CONSULTA_FICHA_MEDICA"
  entidad: string; // ej. "FichaMedica"
  entidadId: string;
  datosAntes?: unknown;
  datosDespues?: unknown;
}): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: params.userId,
        accion: params.accion,
        entidad: params.entidad,
        entidadId: params.entidadId,
        datosAntes: params.datosAntes === undefined ? undefined : (params.datosAntes as object),
        datosDespues: params.datosDespues === undefined ? undefined : (params.datosDespues as object),
      },
    });
  } catch (error) {
    console.error('[audit] no se pudo registrar:', error);
  }
}

/** Enmascara un CURP para listados: GODE•••010101HDF•••••01 */
export function maskCurp(curp: string | null | undefined): string | null {
  if (!curp) return null;
  if (curp.length < 8) return '•••••';
  return `${curp.slice(0, 4)}••••••${curp.slice(-4)}`;
}

/** Serializa montos Decimal de Prisma a number para JSON. */
export function toNumber(value: unknown): number {
  return value == null ? 0 : Number(value);
}
