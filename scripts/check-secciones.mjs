// scripts/check-secciones.mjs — conteo por sección tras la migración
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
const bySection = await db.scoutProfile.groupBy({ by: ['seccion'], _count: { _all: true } });
console.log('scouts:', bySection.map((s) => `${s.seccion}=${s._count._all}`).join(', '));
const rama = await db.scoutProfile.groupBy({ by: ['rama'], _count: { _all: true } });
console.log('ramas:', rama.map((s) => `${s.rama ?? 'null'}=${s._count._all}`).join(', '));
const prog = await db.progresionScout.groupBy({ by: ['seccion'], _count: { _all: true } });
console.log('progresiones:', prog.map((s) => `${s.seccion}=${s._count._all}`).join(', '));
await db.$disconnect();
