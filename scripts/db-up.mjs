// scripts/db-up.mjs
// Levanta un PostgreSQL embebido para desarrollo local (sin instalar nada en el sistema).
// Uso: npm run db:up   (dejar corriendo en una terminal; detener con Ctrl+C)
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import EmbeddedPostgres from 'embedded-postgres';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const databaseDir = path.join(root, '.postgres');
const PORT = Number(process.env.PGPORT ?? 5432);
const USER = 'postgres';
const PASSWORD = 'postgres';
const DATABASE = 'sisas_ansi';

const pg = new EmbeddedPostgres({
  databaseDir,
  user: USER,
  password: PASSWORD,
  port: PORT,
  persistent: true,
  autoRehydrateSymlinks: true,
});

async function main() {
  const marker = path.join(databaseDir, 'PG_VERSION');
  if (!fs.existsSync(marker)) {
    console.log('[db] Inicializando cluster PostgreSQL embebido (solo la primera vez)...');
    await pg.initialise();
  }

  console.log(`[db] Iniciando PostgreSQL en localhost:${PORT} ...`);
  await pg.start();

  try {
    await pg.createDatabase(DATABASE);
    console.log(`[db] Base de datos "${DATABASE}" creada.`);
  } catch (error) {
    const message = String(error?.message ?? error);
    if (message.toLowerCase().includes('already exists') || message.includes('42P04')) {
      console.log(`[db] Base de datos "${DATABASE}" ya existe.`);
    } else {
      throw error;
    }
  }

  console.log('');
  console.log('  PostgreSQL listo.');
  console.log(`  DATABASE_URL="postgresql://${USER}:${PASSWORD}@localhost:${PORT}/${DATABASE}?schema=public"`);
  console.log('  Deja esta terminal abierta. Ctrl+C para detener.');
  console.log('');

  const shutdown = async () => {
    console.log('\n[db] Deteniendo PostgreSQL...');
    try {
      await pg.stop();
      process.exit(0);
    } catch (error) {
      console.error('[db] Error al detener:', error);
      process.exit(1);
    }
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  console.error('[db] No se pudo iniciar PostgreSQL:', error);
  process.exit(1);
});
