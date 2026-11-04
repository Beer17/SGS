// scripts/db-check.mjs — verificación rápida de datos sembrados (solo lectura)
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

const [scout, miembros, usuarios, cuotas, eventos, insignias, inventario, movimientos, notificaciones, fichas] =
  await Promise.all([
    db.scoutProfile.findFirst({ select: { codigoCredencialQR: true, nombres: true, apellidos: true, seccion: true } }),
    db.scoutProfile.count(),
    db.user.count(),
    db.cuota.count(),
    db.evento.count(),
    db.insignia.count(),
    db.itemInventario.count(),
    db.movimientoFinanciero.count(),
    db.notificacion.count(),
    db.fichaMedica.count(),
  ]);

console.log('Credencial de prueba :', JSON.stringify(scout));
console.log('Miembros             :', miembros);
console.log('Usuarios             :', usuarios);
console.log('Fichas médicas       :', fichas);
console.log('Cuotas               :', cuotas);
console.log('Eventos              :', eventos);
console.log('Insignias catálogo   :', insignias);
console.log('Ítems inventario     :', inventario);
console.log('Movimientos financ.  :', movimientos);
console.log('Notificaciones       :', notificaciones);

await db.$disconnect();
