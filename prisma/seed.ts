// prisma/seed.ts
// Datos de demostración para SISAS ANSI. 100% ficticios.
// ⚠️ DESTRUCTIVO en desarrollo: borra y recrea todos los datos.
// Ejecutar: npm run db:seed   (requiere PostgreSQL embebido: npm run db:up)
import bcrypt from 'bcryptjs';
import { db } from '../src/lib/db';

// PRNG determinista para que el seed sea reproducible
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20261103);
const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const int = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;

const CYCLE = '2026-2027';
const now = new Date();
const daysFromNow = (days: number, hour = 9) => {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d;
};

const NOMBRES_H = ['Diego', 'Mateo', 'Santiago', 'Julián', 'Emilio', 'Emiliano', 'Leonardo', 'Gael', 'Benjamín', 'Maximiliano', 'Daniel', 'Ángel', 'Isaac', 'Joaquín', 'Tomás'];
const NOMBRES_M = ['Sofía', 'Regina', 'Valentina', 'María Fernanda', 'Ximena', 'Camila', 'Lucía', 'Paulina', 'Renata', 'Fernanda', 'Renata', 'Elena', 'Gabriela', 'Mariana', 'Andrea'];
const APELLIDOS = ['Martínez', 'Hernández', 'García', 'López', 'González', 'Rodríguez', 'Pérez', 'Sánchez', 'Ramírez', 'Torres', 'Flores', 'Rivera', 'Morales', 'Ortiz', 'Castillo', 'Vargas'];

function curpFalsa(fechaNac: Date, sexo: 'H' | 'M'): string {
  const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const L = () => letras[Math.floor(rand() * letras.length)];
  const yy = String(fechaNac.getFullYear()).slice(-2);
  const mm = String(fechaNac.getMonth() + 1).padStart(2, '0');
  const dd = String(fechaNac.getDate()).padStart(2, '0');
  return `${L()}${L()}${L()}${L()}${yy}${mm}${dd}${sexo}${L()}${L()}${L()}${L()}${L()}${L()}0${int(1, 9)}`;
}

type SeccionSeed = 'MANADA_GACELAS' | 'MANADA_LOBATOS' | 'TROPA' | 'CLAN';

function fechaNacParaSeccion(seccion: SeccionSeed, rama?: 'COMUNIDAD'): Date {
  const rangos: Record<SeccionSeed, [number, number]> = {
    MANADA_GACELAS: [6, 11],
    MANADA_LOBATOS: [6, 11],
    TROPA: rama === 'COMUNIDAD' ? [15, 17] : [11, 14],
    CLAN: [17, 24],
  };
  const [min, max] = rangos[seccion];
  const edad = int(min, max);
  const d = new Date(now);
  d.setFullYear(d.getFullYear() - edad);
  d.setMonth(int(0, 11), int(1, 27));
  return d;
}

async function main() {
  console.log('🌱 Sembrando datos de demostración (los datos actuales se borran)…');

  // ─── Limpieza en orden de dependencias ─────────────────────────────────────
  await db.auditLog.deleteMany();
  await db.notificacion.deleteMany();
  await db.insigniaObtenida.deleteMany();
  await db.insignia.deleteMany();
  await db.progresionScout.deleteMany();
  await db.asistencia.deleteMany();
  await db.inscripcionEvento.deleteMany();
  await db.logisticaEvento.deleteMany();
  await db.evento.deleteMany();
  await db.cuota.deleteMany();
  await db.movimientoFinanciero.deleteMany();
  await db.prestamoInventario.deleteMany();
  await db.itemInventario.deleteMany();
  await db.fichaMedica.deleteMany();
  await db.scoutProfile.deleteMany();
  await db.grupoScout.deleteMany();
  await db.provincia.deleteMany();
  await db.user.deleteMany();

  // ─── Usuarios ───────────────────────────────────────────────────────────────
  const password = async (plain: string) => bcrypt.hash(plain, 10);
  const [admin, nacional, provincia, jefe, scouter, tutor] = await Promise.all([
    db.user.create({ data: { email: 'admin@gmail.com', passwordHash: await password('admin1234'), role: 'ADMIN' } }),
    db.user.create({ data: { email: 'nacional@sisas.ansi', passwordHash: await password('Nacional2026!'), role: 'NACIONAL' } }),
    db.user.create({ data: { email: 'provincia@sisas.ansi', passwordHash: await password('Provincia2026!'), role: 'PROVINCIA' } }),
    db.user.create({ data: { email: 'jefe@sisas.ansi', passwordHash: await password('Jefe2026!'), role: 'GRUPO' } }),
    db.user.create({ data: { email: 'scouter@sisas.ansi', passwordHash: await password('Scouter2026!'), role: 'SECCION' } }),
    db.user.create({ data: { email: 'tutor@sisas.ansi', passwordHash: await password('Tutor2026!'), role: 'MIEMBRO_TUTOR' } }),
  ]);

  // ─── Estructura territorial ─────────────────────────────────────────────────
  const queretaro = await db.provincia.create({ data: { nombre: 'Querétaro', region: 'Bajío' } });
  const puebla = await db.provincia.create({ data: { nombre: 'Puebla', region: 'Centro' } });
  const jalisco = await db.provincia.create({ data: { nombre: 'Jalisco', region: 'Occidente' } });

  const g12 = await db.grupoScout.create({ data: { numeroGrupo: 12, nombre: 'Halcones de Querétaro', provinciaId: queretaro.id } });
  const g25 = await db.grupoScout.create({ data: { numeroGrupo: 25, nombre: 'Águilas del Norte', provinciaId: queretaro.id } });
  const g04 = await db.grupoScout.create({ data: { numeroGrupo: 4, nombre: 'Centauros de Puebla', provinciaId: puebla.id } });
  const g21 = await db.grupoScout.create({ data: { numeroGrupo: 21, nombre: 'Volcán de Fuego', provinciaId: jalisco.id } });

  const grupos = [g12, g25, g04, g21];
  const provinciaDeGrupo = new Map([
    [g12.id, queretaro.id],
    [g25.id, queretaro.id],
    [g04.id, puebla.id],
    [g21.id, jalisco.id],
  ]);

  // ─── Miembros ───────────────────────────────────────────────────────────────
  const sangre = ['O+', 'O-', 'A+', 'A-', 'B+', 'AB+'];
  const parentescos = ['Madre', 'Padre', 'Tutor', 'Abuela', 'Tío'];
  const alergiasPool = ['Penicilina', 'Mariscos', 'Polen', 'Lactosa', 'Ninguna conocida'];

  interface MiembroSeed { id: string; seccion: string; grupoId: string; nombres: string; apellidos: string }
  const miembros: MiembroSeed[] = [];
  let contador = 0;

  for (const grupo of grupos) {
    const provinciaId = provinciaDeGrupo.get(grupo.id)!;
    // 11 miembros por grupo: 3 GACELAS, 3 LOBATOS, 3 TROPA (la 3.ª es rama COMUNIDAD 15-17), 2 CLAN
    const plan: SeccionSeed[] = [
      'MANADA_GACELAS', 'MANADA_GACELAS', 'MANADA_GACELAS',
      'MANADA_LOBATOS', 'MANADA_LOBATOS', 'MANADA_LOBATOS',
      'TROPA', 'TROPA', 'TROPA',
      'CLAN', 'CLAN',
    ];
    let tropaCount = 0;

    for (const seccion of plan) {
      contador += 1;
      tropaCount += seccion === 'TROPA' ? 1 : 0;
      const rama = seccion === 'TROPA' && tropaCount === 3 ? 'COMUNIDAD' as const : undefined;
      const esMujer = rand() < 0.42;
      const nombres = esMujer ? pick(NOMBRES_M) : pick(NOMBRES_H);
      const apellidos = `${pick(APELLIDOS)} ${pick(APELLIDOS)}`;
      const fechaNacimiento = fechaNacParaSeccion(seccion, rama);
      // ~90% activos, algunos pendientes/vencidos para que la demo luzca real
      const estatusRegistro =
        contador % 17 === 0 ? 'VENCIDO' : contador % 11 === 0 ? 'PENDIENTE' : 'ACTIVO';

      const scout = await db.scoutProfile.create({
        data: {
          nombres,
          apellidos,
          curp: curpFalsa(fechaNacimiento, esMujer ? 'M' : 'H'),
          fechaNacimiento,
          telefono: `55${int(1000, 9999)}${int(1000, 9999)}`,
          direccion: `Calle ${pick(['Hidalgo', 'Juárez', 'Morelos', 'Zaragoza', 'Allende'])} #${int(10, 400)}, ${pick(['Centro', 'La Luna', 'Las Flores'])}`,
          seccion,
          rama,
          grupoId: grupo.id,
          provinciaId,
          estatusRegistro,
          cicloActivo: CYCLE,
        },
      });

      await db.fichaMedica.create({
        data: {
          scoutProfileId: scout.id,
          tipoSangre: pick(sangre),
          alergias: rand() < 0.3 ? pick(alergiasPool) : null,
          padecimientos: rand() < 0.12 ? pick(['Asma leve', 'Rinitis alérgica']) : null,
          restriccionesActividad: rand() < 0.15 ? pick(['Evitar esfuerzo de altura', 'Asma: llevar inhalador', 'Lesión de tobillo (2026)']) : null,
          seguMedico: rand() < 0.6 ? `SMG-${int(100000, 999999)}` : null,
          contactoEmergenciaNombre: `${pick(['María', 'José', 'Carmen', 'Laura', 'Miguel'])} ${pick(APELLIDOS)}`,
          contactoEmergenciaTel: `55${int(1000, 9999)}${int(1000, 9999)}`,
          contactoEmergenciaParentesco: pick(parentescos),
          autorizacionActividades: rand() < 0.85,
        },
      });

      miembros.push({ id: scout.id, seccion, grupoId: grupo.id, nombres, apellidos });
    }
  }

  // Vincular el tutor con un scout de Tropa del Grupo 12 (demo de "vista padre")
  const hijoTutor = miembros.find((m) => m.grupoId === g12.id && m.seccion === 'TROPA');
  if (hijoTutor) {
    await db.scoutProfile.update({ where: { id: hijoTutor.id }, data: { userId: tutor.id } });
  }

  // ─── Progresión (nombres oficiales del Plan de Adelanto ANSI) ────────────────
  const etapasPorSeccion: Record<string, string[]> = {
    MANADA_GACELAS: ['Shirma', 'Basvi', 'Otami', 'Pranam'],
    MANADA_LOBATOS: ['Seeonee', 'Flor Roja', 'Lobo Explorador', 'Lobo Cazador'],
    TROPA: ['Tercera Clase', 'Segunda Clase', 'Primera Clase'],
    CLAN: ['Ser', 'Naturaleza', 'Proyección'],
  };
  for (const m of miembros) {
    const etapas = etapasPorSeccion[m.seccion] ?? [];
    for (let i = 0; i < etapas.length; i++) {
      const completada = i < int(1, Math.min(3, etapas.length));
      await db.progresionScout.create({
        data: {
          scoutProfileId: m.id,
          seccion: m.seccion as SeccionSeed,
          etapaNombre: etapas[i],
          descripcion: `Etapa ${i + 1} del Plan de Adelanto ANSI.`,
          completada,
          aprobadaPorId: completada ? (rand() < 0.5 ? jefe.id : scouter.id) : null,
          fechaAprobacion: completada ? daysFromNow(-int(10, 300)) : null,
        },
      });
    }
  }

  // ─── Catálogo oficial ANSI — Insignias y reconocimientos ────────────────────
  const catalogo: Array<{ nombre: string; categoria: string; seccion?: SeccionSeed }> = [
    // Identificadores institucionales (aplican a todas las secciones)
    { nombre: 'Insignia de compromiso ANSI', categoria: 'Identificadores' },
    { nombre: 'Insignia de WFIS', categoria: 'Identificadores' },
    { nombre: 'Cinta de Asociación (SCOUTS ANSI)', categoria: 'Identificadores' },
    { nombre: 'Tenencia del Año (ANSI-WFIS)', categoria: 'Identificadores' },
    { nombre: 'Sector Localidad', categoria: 'Identificadores' },
    { nombre: 'Escudo de Grupo', categoria: 'Identificadores' },
    { nombre: 'Numeral de Grupo', categoria: 'Identificadores' },
    { nombre: 'Parche para Gorra (Manadas)', categoria: 'Identificadores' },
    // Ronda de Aluxes (4-6 años) — visible en el catálogo; en espera de su sección propia
    { nombre: 'Compromiso de Aluxe', categoria: 'Ronda de Aluxes' },
    { nombre: 'Hongo Mágico (Insignia Terminal)', categoria: 'Ronda de Aluxes' },
    { nombre: 'Parche de Milpa (serie I-IV)', categoria: 'Ronda de Aluxes' },
    { nombre: 'Especialidad Jitomate', categoria: 'Ronda de Aluxes' },
    { nombre: 'Especialidad del Gato', categoria: 'Ronda de Aluxes' },
    { nombre: 'Especialidad la Cometa', categoria: 'Ronda de Aluxes' },
    { nombre: 'Especialidad de Bicicleta', categoria: 'Ronda de Aluxes' },
    { nombre: 'Especialidad de Fotografía', categoria: 'Ronda de Aluxes' },
    // Manada de Gacelas (6-11 años)
    { nombre: 'Promesa de la Gacela', categoria: 'Compromiso', seccion: 'MANADA_GACELAS' },
    { nombre: 'Parches de Seisena (Gacela)', categoria: 'Parches', seccion: 'MANADA_GACELAS' },
    { nombre: 'Arco Iris (Senda para Ser Scout)', categoria: 'Insignia Terminal', seccion: 'MANADA_GACELAS' },
    // Manada de Lobatos (6-11 años)
    { nombre: 'Promesa del Lobato', categoria: 'Compromiso', seccion: 'MANADA_LOBATOS' },
    { nombre: 'Parches de Seisena (Lobo)', categoria: 'Parches', seccion: 'MANADA_LOBATOS' },
    { nombre: 'Lobo Rampante (Senda para Ser Scout)', categoria: 'Insignia Terminal', seccion: 'MANADA_LOBATOS' },
    // Tropa Scout (11-17 años)
    { nombre: 'Tercera Clase', categoria: 'Clases', seccion: 'TROPA' },
    { nombre: 'Segunda Clase', categoria: 'Clases', seccion: 'TROPA' },
    { nombre: 'Primera Clase', categoria: 'Clases', seccion: 'TROPA' },
    { nombre: 'Correa de Manigua', categoria: 'Cuerdas y Cordones', seccion: 'TROPA' },
    { nombre: 'Cordón de la Aventura', categoria: 'Cuerdas y Cordones', seccion: 'TROPA' },
    { nombre: 'Acampador', categoria: 'Especialidad Técnica', seccion: 'TROPA' },
    { nombre: 'Primeros Auxilios', categoria: 'Especialidad Técnica', seccion: 'TROPA' },
    { nombre: 'Explorador', categoria: 'Especialidad Técnica', seccion: 'TROPA' },
    { nombre: 'Meteorología', categoria: 'Especialidad Técnica', seccion: 'TROPA' },
    { nombre: 'Astronomía', categoria: 'Especialidad Técnica', seccion: 'TROPA' },
    { nombre: 'Especialidad General', categoria: 'Especialidad General', seccion: 'TROPA' },
    { nombre: 'Caballero Scout Águila', categoria: 'Insignia Terminal', seccion: 'TROPA' },
    { nombre: 'Ave Fénix (Senda Clan)', categoria: 'Insignia Terminal', seccion: 'TROPA' },
    // Clanes / Rovers (17-24 años)
    { nombre: 'Especialidad de Proyectos', categoria: 'Especialidad de Clan', seccion: 'CLAN' },
    { nombre: 'Especialidad de Expediciones', categoria: 'Especialidad de Clan', seccion: 'CLAN' },
    { nombre: 'Especialidad de Servicio', categoria: 'Especialidad de Clan', seccion: 'CLAN' },
    { nombre: 'Especialidad de Técnica', categoria: 'Especialidad de Clan', seccion: 'CLAN' },
    { nombre: 'Especialidad de Instructor (R|S)', categoria: 'Especialidad de Clan', seccion: 'CLAN' },
    { nombre: 'Escuderato Rover', categoria: 'Escuderato', seccion: 'CLAN' },
    { nombre: 'B-P (Baden Powell)', categoria: 'Reconocimiento', seccion: 'CLAN' },
    { nombre: 'Partida Rover', categoria: 'Reconocimiento', seccion: 'CLAN' },
  ];
  const insignias = [];
  for (const item of catalogo) {
    insignias.push(await db.insignia.create({ data: { ...item, descripcion: `${item.categoria} · ANSI.` } }));
  }
  for (const m of miembros) {
    const cuantas = int(0, 3);
    const elegidas = new Set<string>();
    const elegibles = insignias.filter((ins) => !ins.seccion || ins.seccion === m.seccion);
    for (let i = 0; i < cuantas; i++) {
      const ins = pick(elegibles);
      if (elegidas.has(ins.id)) continue;
      elegidas.add(ins.id);
      await db.insigniaObtenida.create({
        data: { scoutProfileId: m.id, insigniaId: ins.id, fechaObtencion: daysFromNow(-int(15, 400)), otorgadaPorId: jefe.id },
      });
    }
  }

  // ─── Eventos ────────────────────────────────────────────────────────────────
  const campamento = await db.evento.create({
    data: {
      nombre: 'Campamento Nacional de Invierno 2026',
      descripcion: 'Encuentro nacional de familias scout en Valle de Bravo. Incluye talleres, fogata de clausura y misa de apertura.',
      tipo: 'CAMPAMENTO',
      fechaInicio: daysFromNow(25, 8),
      fechaFin: daysFromNow(28, 14),
      lugar: 'Valle de Bravo, Estado de México',
      cupoMaximo: 120,
      requiereAutorizacion: true,
    },
  });
  await db.logisticaEvento.create({
    data: {
      eventoId: campamento.id,
      transporteInfo: 'Autobuses ADO desde Terminal TAPO (salida 6:00 h) y Querétaro (salida 5:30 h).',
      lugarCampamento: 'Campo Ecoturístico La Ceiba, km 4.5',
      equipoRequerido: JSON.stringify(['Sleeping', 'Tienda o casa de campaña', 'Botiquín personal', 'Ropa térmica', 'Linterna', 'Cantimplora']),
      presupuesto: 185000.0,
      notas: 'Confirmar menú con el proveedor antes del 5 de diciembre.',
    },
  });
  const reunionJefatura = await db.evento.create({
    data: {
      nombre: 'Reunión de Jefatura de Grupo',
      descripcion: 'Planeación del ciclo y revisión de censo y cuotas.',
      tipo: 'REUNION',
      fechaInicio: daysFromNow(6, 10),
      fechaFin: daysFromNow(6, 13),
      lugar: 'Salón parroquial, Grupo 12',
      grupoId: g12.id,
    },
  });
  const tallerPa = await db.evento.create({
    data: {
      nombre: 'Taller de Primeros Auxilios',
      descripcion: 'Certificación básica para jefes y scouters. Impartido por Cruz Roja.',
      tipo: 'CAPACITACION',
      fechaInicio: daysFromNow(13, 9),
      fechaFin: daysFromNow(13, 14),
      lugar: 'Casa Scout Querétaro',
      cupoMaximo: 40,
    },
  });
  await db.evento.create({
    data: {
      nombre: 'Jornada de Limpieza del Río Querétaro',
      descripcion: 'Servicio comunitario en coordinación con el municipio.',
      tipo: 'GRUPO',
      fechaInicio: daysFromNow(-16, 8),
      fechaFin: daysFromNow(-16, 13),
      lugar: 'Paseo del Río, Querétaro',
      grupoId: g12.id,
    },
  });

  // Inscripciones al campamento (solo Grupo 12 y 25, con autorización firmada)
  const inscritos = miembros.filter((m) => m.grupoId === g12.id || m.grupoId === g25.id).slice(0, 16);
  for (const m of inscritos) {
    await db.inscripcionEvento.create({
      data: {
        eventoId: campamento.id,
        scoutProfileId: m.id,
        autorizacionParental: rand() < 0.8,
        pagoCuota: rand() < 0.6,
        observaciones: rand() < 0.2 ? 'Requiere menú especial.' : null,
      },
    });
  }

  // Asistencia a la jornada pasada
  const jornada = await db.evento.findFirstOrThrow({ where: { nombre: 'Jornada de Limpieza del Río Querétaro' } });
  for (const m of miembros.filter((mm) => mm.grupoId === g12.id).slice(0, 9)) {
    await db.asistencia.create({ data: { eventoId: jornada.id, scoutProfileId: m.id, horaEscaneo: daysFromNow(-16, 8) } });
  }

  // ─── Cuotas del ciclo ───────────────────────────────────────────────────────
  for (const m of miembros) {
    const estatus = rand() < 0.68 ? 'PAGADA' : rand() < 0.55 ? 'PENDIENTE' : 'VENCIDA';
    await db.cuota.create({
      data: {
        scoutProfileId: m.id,
        tipo: 'MEMBRESIA',
        concepto: `Membresía ciclo ${CYCLE}`,
        monto: 850.0,
        ciclo: CYCLE,
        estatus,
        fechaVencimiento: estatus === 'PAGADA' ? daysFromNow(-60) : daysFromNow(estatus === 'VENCIDA' ? -5 : 20),
        fechaPago: estatus === 'PAGADA' ? daysFromNow(-int(30, 200)) : null,
        registradoPorId: estatus === 'PAGADA' ? (rand() < 0.5 ? jefe.id : scouter.id) : null,
      },
    });
  }
  // Cuota de evento para inscritos al campamento
  for (const m of inscritos) {
    await db.cuota.create({
      data: {
        scoutProfileId: m.id,
        tipo: 'EVENTO',
        concepto: 'Campamento Nacional de Invierno 2026',
        monto: 1500.0,
        ciclo: CYCLE,
        estatus: rand() < 0.5 ? 'PAGADA' : 'PENDIENTE',
        fechaVencimiento: daysFromNow(18),
        fechaPago: rand() < 0.5 ? daysFromNow(-int(1, 30)) : null,
        registradoPorId: jefe.id,
      },
    });
  }

  // ─── Movimientos financieros (Grupo 12, mes actual y anteriores) ────────────
  const movimientos = [
    { tipo: 'INGRESO', concepto: 'Cuotas de membresía octubre', monto: 9350, categoria: 'Cuotas', dias: 32 },
    { tipo: 'INGRESO', concepto: 'Cuotas de membresía noviembre', monto: 6800, categoria: 'Cuotas', dias: 3 },
    { tipo: 'INGRESO', concepto: 'Venta de artesanías en kermes', monto: 4250, categoria: 'Actividades', dias: 45 },
    { tipo: 'INGRESO', concepto: 'Aportación de la parroquia', monto: 5000, categoria: 'Donativos', dias: 60 },
    { tipo: 'EGRESO', concepto: 'Materiales para especialidad de cocina', monto: 2350, categoria: 'Materiales', dias: 25 },
    { tipo: 'EGRESO', concepto: 'Transporte a jornada de limpieza', monto: 1800, categoria: 'Transporte', dias: 16 },
    { tipo: 'EGRESO', concepto: 'Botiquín y vendas', monto: 950, categoria: 'Primeros auxilios', dias: 40 },
    { tipo: 'EGRESO', concepto: 'Impresión de responsivas', monto: 420, categoria: 'Papelería', dias: 52 },
    { tipo: 'EGRESO', concepto: 'Reparación de estufas de campo', monto: 1300, categoria: 'Equipo', dias: 12 },
  ] as const;
  for (const mov of movimientos) {
    await db.movimientoFinanciero.create({
      data: {
        grupoId: g12.id,
        tipo: mov.tipo as 'INGRESO' | 'EGRESO',
        concepto: mov.concepto,
        monto: mov.monto,
        categoria: mov.categoria,
        fecha: daysFromNow(-mov.dias, 12),
        registradoPorId: jefe.id,
      },
    });
  }

  // ─── Inventario (Grupo 12) ──────────────────────────────────────────────────
  const inventario = [
    { nombre: 'Tienda de campaña 6 personas', categoria: 'Camping', cantidad: 10, estado: 'DISPONIBLE', valorUnitario: 3200 },
    { nombre: 'Estufa de campo + tanque', categoria: 'Cocina', cantidad: 6, estado: 'MANTENIMIENTO', valorUnitario: 1800 },
    { nombre: 'Botiquín primeros auxilios', categoria: 'Primeros Auxilios', cantidad: 4, estado: 'DISPONIBLE', valorUnitario: 650 },
    { nombre: 'Cuerda dinámica 30 m', categoria: 'Especialidades', cantidad: 8, estado: 'DISPONIBLE', valorUnitario: 450 },
    { nombre: 'Megáfono recargable', categoria: 'Comunicación', cantidad: 2, estado: 'PRESTADO', valorUnitario: 900 },
    { nombre: 'Brújula de placa', categoria: 'Orientación', cantidad: 15, estado: 'DISPONIBLE', valorUnitario: 120 },
    { nombre: 'Plástico de piso 3x3 m', categoria: 'Camping', cantidad: 20, estado: 'DISPONIBLE', valorUnitario: 180 },
    { nombre: 'Linterna frontal LED', categoria: 'Camping', cantidad: 25, estado: 'DISPONIBLE', valorUnitario: 150 },
    { nombre: 'Cocina portátil industrial', categoria: 'Cocina', cantidad: 1, estado: 'DANADO', valorUnitario: 5500 },
    { nombre: 'Pabellón 4x4 m', categoria: 'Camping', cantidad: 2, estado: 'DISPONIBLE', valorUnitario: 2100 },
    { nombre: 'Equipo de radio VHF', categoria: 'Comunicación', cantidad: 4, estado: 'PRESTADO', valorUnitario: 1600 },
    { nombre: 'Extintor ABC 4 kg', categoria: 'Seguridad', cantidad: 3, estado: 'DISPONIBLE', valorUnitario: 800 },
  ] as const;
  for (const item of inventario) {
    const creado = await db.itemInventario.create({
      data: {
        grupoId: g12.id,
        nombre: item.nombre,
        categoria: item.categoria,
        cantidad: item.cantidad,
        estado: item.estado as 'DISPONIBLE' | 'PRESTADO' | 'MANTENIMIENTO' | 'DANADO',
        valorUnitario: item.valorUnitario,
        fechaAdquisicion: daysFromNow(-int(100, 900)),
        ubicacion: pick(['Bodega parroquia', 'Casa Scout', 'Salón de juntas']),
      },
    });
    if (item.estado === 'PRESTADO') {
      await db.prestamoInventario.create({
        data: {
          itemId: creado.id,
          prestatarioNombre: `${pick(NOMBRES_H)} ${pick(APELLIDOS)} (jefatura)`,
          fechaPrestamo: daysFromNow(-int(3, 15)),
          observaciones: 'Para salida de fin de semana.',
        },
      });
    }
  }

  // ─── Notificaciones ─────────────────────────────────────────────────────────
  await db.notificacion.createMany({
    data: [
      { destinatarioId: jefe.id, tipo: 'CUOTA_VENCIMIENTO', titulo: '4 cuotas vencidas en el ciclo', mensaje: 'Hay membresías vencidas pendientes de cobro. Revisa el módulo de finanzas.', accionUrl: '/finanzas', dedupeKey: `seed:cuotas-vencidas:${jefe.id}` },
      { destinatarioId: jefe.id, tipo: 'EVENTO_RECORDATORIO', titulo: 'Reunión de Jefatura en 6 días', mensaje: 'Reunión de Jefatura de Grupo, salón parroquial. Lleva el informe de censo.', accionUrl: '/eventos', dedupeKey: `seed:evento:reunion-jefatura:${jefe.id}` },
      { destinatarioId: admin.id, tipo: 'SISTEMA', titulo: 'Respaldo semanal completado', mensaje: 'Se completó el respaldo de la base de datos (simulado).', accionUrl: '/configuracion', dedupeKey: `seed:backup:${admin.id}` },
      { destinatarioId: tutor.id, tipo: 'PROGRESION_APROBADA', titulo: 'Etapa aprobada: Vida al aire libre', mensaje: 'La etapa "Vida al aire libre" fue aprobada para tu hijo/a.', accionUrl: '/progresion', dedupeKey: `seed:progresion:tutor:${tutor.id}` },
    ],
  });

  // ─── Auditoría ──────────────────────────────────────────────────────────────
  await db.auditLog.create({
    data: { userId: jefe.id, accion: 'CONSULTA_FICHA_MEDICA', entidad: 'FichaMedica', entidadId: miembros[0]?.id ?? '', ip: '127.0.0.1' },
  });

  console.log(`✅ Seed completado: ${miembros.length} miembros, ${grupos.length} grupos, 6 usuarios demo.`);
}

main()
  .catch((error) => {
    console.error('❌ Error en seed:', error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
