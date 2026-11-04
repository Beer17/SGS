-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'NACIONAL', 'PROVINCIA', 'GRUPO', 'SECCION', 'MIEMBRO_TUTOR');

-- CreateEnum
CREATE TYPE "Seccion" AS ENUM ('MANADA', 'TROPA', 'COMUNIDAD', 'CLAN', 'JEFATURA');

-- CreateEnum
CREATE TYPE "EstatusRegistro" AS ENUM ('ACTIVO', 'PENDIENTE', 'VENCIDO', 'BAJA');

-- CreateEnum
CREATE TYPE "TipoEvento" AS ENUM ('NACIONAL', 'REGIONAL', 'GRUPO', 'CAMPAMENTO', 'REUNION', 'CAPACITACION');

-- CreateEnum
CREATE TYPE "TipoMovimiento" AS ENUM ('INGRESO', 'EGRESO');

-- CreateEnum
CREATE TYPE "TipoCuota" AS ENUM ('MEMBRESIA', 'EVENTO', 'OTRO');

-- CreateEnum
CREATE TYPE "EstatusCuota" AS ENUM ('PAGADA', 'PENDIENTE', 'VENCIDA', 'EXENTA');

-- CreateEnum
CREATE TYPE "EstadoItem" AS ENUM ('DISPONIBLE', 'PRESTADO', 'MANTENIMIENTO', 'DANADO', 'BAJA');

-- CreateEnum
CREATE TYPE "TipoNotificacion" AS ENUM ('CUOTA_VENCIMIENTO', 'EVENTO_RECORDATORIO', 'PROGRESION_APROBADA', 'SISTEMA', 'MENSAJE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Provincia" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "region" TEXT NOT NULL,

    CONSTRAINT "Provincia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrupoScout" (
    "id" TEXT NOT NULL,
    "numeroGrupo" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "provinciaId" TEXT NOT NULL,

    CONSTRAINT "GrupoScout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoutProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "curp" TEXT,
    "fechaNacimiento" TIMESTAMP(3) NOT NULL,
    "telefono" TEXT,
    "direccion" TEXT,
    "foto" TEXT,
    "seccion" "Seccion" NOT NULL,
    "grupoId" TEXT NOT NULL,
    "provinciaId" TEXT NOT NULL,
    "estatusRegistro" "EstatusRegistro" NOT NULL DEFAULT 'PENDIENTE',
    "codigoCredencialQR" TEXT NOT NULL,
    "cicloActivo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScoutProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FichaMedica" (
    "id" TEXT NOT NULL,
    "scoutProfileId" TEXT NOT NULL,
    "tipoSangre" TEXT,
    "alergias" TEXT,
    "padecimientos" TEXT,
    "medicamentos" TEXT,
    "tratamientoActual" TEXT,
    "restriccionesActividad" TEXT,
    "seguMedico" TEXT,
    "nombreMedico" TEXT,
    "telefonoMedico" TEXT,
    "contactoEmergenciaNombre" TEXT NOT NULL,
    "contactoEmergenciaTel" TEXT NOT NULL,
    "contactoEmergenciaParentesco" TEXT,
    "contactoEmergencia2Nombre" TEXT,
    "contactoEmergencia2Tel" TEXT,
    "autorizacionActividades" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FichaMedica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgresionScout" (
    "id" TEXT NOT NULL,
    "scoutProfileId" TEXT NOT NULL,
    "seccion" "Seccion" NOT NULL,
    "etapaNombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "completada" BOOLEAN NOT NULL DEFAULT false,
    "aprobadaPorId" TEXT,
    "fechaAprobacion" TIMESTAMP(3),
    "evidencia" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgresionScout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Insignia" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "seccion" "Seccion",
    "categoria" TEXT,
    "imagen" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Insignia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsigniaObtenida" (
    "id" TEXT NOT NULL,
    "scoutProfileId" TEXT NOT NULL,
    "insigniaId" TEXT NOT NULL,
    "fechaObtencion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "otorgadaPorId" TEXT,
    "observaciones" TEXT,

    CONSTRAINT "InsigniaObtenida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evento" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" "TipoEvento" NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "lugar" TEXT,
    "cupoMaximo" INTEGER,
    "requiereAutorizacion" BOOLEAN NOT NULL DEFAULT false,
    "grupoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InscripcionEvento" (
    "id" TEXT NOT NULL,
    "eventoId" TEXT NOT NULL,
    "scoutProfileId" TEXT NOT NULL,
    "fechaInscripcion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "autorizacionParental" BOOLEAN NOT NULL DEFAULT false,
    "observaciones" TEXT,
    "pagoCuota" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "InscripcionEvento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogisticaEvento" (
    "id" TEXT NOT NULL,
    "eventoId" TEXT NOT NULL,
    "transporteInfo" TEXT,
    "lugarCampamento" TEXT,
    "equipoRequerido" TEXT,
    "presupuesto" DECIMAL(10,2),
    "notas" TEXT,

    CONSTRAINT "LogisticaEvento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asistencia" (
    "id" TEXT NOT NULL,
    "eventoId" TEXT NOT NULL,
    "scoutProfileId" TEXT NOT NULL,
    "horaEscaneo" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sincronizadoOffline" BOOLEAN NOT NULL DEFAULT false,
    "registradoPorId" TEXT,

    CONSTRAINT "Asistencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cuota" (
    "id" TEXT NOT NULL,
    "scoutProfileId" TEXT NOT NULL,
    "tipo" "TipoCuota" NOT NULL,
    "concepto" TEXT NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "ciclo" TEXT NOT NULL,
    "estatus" "EstatusCuota" NOT NULL DEFAULT 'PENDIENTE',
    "fechaVencimiento" TIMESTAMP(3),
    "fechaPago" TIMESTAMP(3),
    "comprobante" TEXT,
    "registradoPorId" TEXT,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cuota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimientoFinanciero" (
    "id" TEXT NOT NULL,
    "grupoId" TEXT NOT NULL,
    "tipo" "TipoMovimiento" NOT NULL,
    "concepto" TEXT NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "categoria" TEXT,
    "comprobante" TEXT,
    "registradoPorId" TEXT,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovimientoFinanciero_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemInventario" (
    "id" TEXT NOT NULL,
    "grupoId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "categoria" TEXT,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "estado" "EstadoItem" NOT NULL DEFAULT 'DISPONIBLE',
    "ubicacion" TEXT,
    "valorUnitario" DECIMAL(10,2),
    "fechaAdquisicion" TIMESTAMP(3),
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemInventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrestamoInventario" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "prestatarioNombre" TEXT NOT NULL,
    "prestatarioId" TEXT,
    "fechaPrestamo" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaDevolucion" TIMESTAMP(3),
    "devuelto" BOOLEAN NOT NULL DEFAULT false,
    "observaciones" TEXT,

    CONSTRAINT "PrestamoInventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notificacion" (
    "id" TEXT NOT NULL,
    "destinatarioId" TEXT NOT NULL,
    "tipo" "TipoNotificacion" NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "accionUrl" TEXT,
    "dedupeKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidadId" TEXT NOT NULL,
    "datosAntes" JSONB,
    "datosDespues" JSONB,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "Provincia_nombre_idx" ON "Provincia"("nombre");

-- CreateIndex
CREATE INDEX "GrupoScout_nombre_idx" ON "GrupoScout"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "GrupoScout_provinciaId_numeroGrupo_key" ON "GrupoScout"("provinciaId", "numeroGrupo");

-- CreateIndex
CREATE UNIQUE INDEX "ScoutProfile_userId_key" ON "ScoutProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ScoutProfile_curp_key" ON "ScoutProfile"("curp");

-- CreateIndex
CREATE UNIQUE INDEX "ScoutProfile_codigoCredencialQR_key" ON "ScoutProfile"("codigoCredencialQR");

-- CreateIndex
CREATE INDEX "ScoutProfile_curp_idx" ON "ScoutProfile"("curp");

-- CreateIndex
CREATE INDEX "ScoutProfile_codigoCredencialQR_idx" ON "ScoutProfile"("codigoCredencialQR");

-- CreateIndex
CREATE INDEX "ScoutProfile_grupoId_seccion_idx" ON "ScoutProfile"("grupoId", "seccion");

-- CreateIndex
CREATE INDEX "ScoutProfile_estatusRegistro_idx" ON "ScoutProfile"("estatusRegistro");

-- CreateIndex
CREATE INDEX "ScoutProfile_apellidos_nombres_idx" ON "ScoutProfile"("apellidos", "nombres");

-- CreateIndex
CREATE UNIQUE INDEX "FichaMedica_scoutProfileId_key" ON "FichaMedica"("scoutProfileId");

-- CreateIndex
CREATE INDEX "ProgresionScout_scoutProfileId_completada_idx" ON "ProgresionScout"("scoutProfileId", "completada");

-- CreateIndex
CREATE INDEX "ProgresionScout_seccion_etapaNombre_idx" ON "ProgresionScout"("seccion", "etapaNombre");

-- CreateIndex
CREATE INDEX "Insignia_seccion_idx" ON "Insignia"("seccion");

-- CreateIndex
CREATE INDEX "InsigniaObtenida_scoutProfileId_idx" ON "InsigniaObtenida"("scoutProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "InsigniaObtenida_scoutProfileId_insigniaId_key" ON "InsigniaObtenida"("scoutProfileId", "insigniaId");

-- CreateIndex
CREATE INDEX "Evento_fechaInicio_fechaFin_idx" ON "Evento"("fechaInicio", "fechaFin");

-- CreateIndex
CREATE INDEX "Evento_tipo_idx" ON "Evento"("tipo");

-- CreateIndex
CREATE INDEX "Evento_grupoId_idx" ON "Evento"("grupoId");

-- CreateIndex
CREATE INDEX "InscripcionEvento_eventoId_idx" ON "InscripcionEvento"("eventoId");

-- CreateIndex
CREATE UNIQUE INDEX "InscripcionEvento_eventoId_scoutProfileId_key" ON "InscripcionEvento"("eventoId", "scoutProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "LogisticaEvento_eventoId_key" ON "LogisticaEvento"("eventoId");

-- CreateIndex
CREATE INDEX "Asistencia_eventoId_horaEscaneo_idx" ON "Asistencia"("eventoId", "horaEscaneo");

-- CreateIndex
CREATE INDEX "Asistencia_scoutProfileId_idx" ON "Asistencia"("scoutProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "Asistencia_eventoId_scoutProfileId_key" ON "Asistencia"("eventoId", "scoutProfileId");

-- CreateIndex
CREATE INDEX "Cuota_scoutProfileId_ciclo_idx" ON "Cuota"("scoutProfileId", "ciclo");

-- CreateIndex
CREATE INDEX "Cuota_estatus_idx" ON "Cuota"("estatus");

-- CreateIndex
CREATE INDEX "Cuota_fechaVencimiento_idx" ON "Cuota"("fechaVencimiento");

-- CreateIndex
CREATE INDEX "MovimientoFinanciero_grupoId_fecha_idx" ON "MovimientoFinanciero"("grupoId", "fecha");

-- CreateIndex
CREATE INDEX "MovimientoFinanciero_tipo_fecha_idx" ON "MovimientoFinanciero"("tipo", "fecha");

-- CreateIndex
CREATE INDEX "ItemInventario_grupoId_estado_idx" ON "ItemInventario"("grupoId", "estado");

-- CreateIndex
CREATE INDEX "ItemInventario_categoria_idx" ON "ItemInventario"("categoria");

-- CreateIndex
CREATE INDEX "PrestamoInventario_itemId_devuelto_idx" ON "PrestamoInventario"("itemId", "devuelto");

-- CreateIndex
CREATE UNIQUE INDEX "Notificacion_dedupeKey_key" ON "Notificacion"("dedupeKey");

-- CreateIndex
CREATE INDEX "Notificacion_destinatarioId_leida_idx" ON "Notificacion"("destinatarioId", "leida");

-- CreateIndex
CREATE INDEX "Notificacion_createdAt_idx" ON "Notificacion"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entidad_entidadId_idx" ON "AuditLog"("entidad", "entidadId");

-- AddForeignKey
ALTER TABLE "GrupoScout" ADD CONSTRAINT "GrupoScout_provinciaId_fkey" FOREIGN KEY ("provinciaId") REFERENCES "Provincia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoutProfile" ADD CONSTRAINT "ScoutProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoutProfile" ADD CONSTRAINT "ScoutProfile_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "GrupoScout"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoutProfile" ADD CONSTRAINT "ScoutProfile_provinciaId_fkey" FOREIGN KEY ("provinciaId") REFERENCES "Provincia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FichaMedica" ADD CONSTRAINT "FichaMedica_scoutProfileId_fkey" FOREIGN KEY ("scoutProfileId") REFERENCES "ScoutProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgresionScout" ADD CONSTRAINT "ProgresionScout_scoutProfileId_fkey" FOREIGN KEY ("scoutProfileId") REFERENCES "ScoutProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgresionScout" ADD CONSTRAINT "ProgresionScout_aprobadaPorId_fkey" FOREIGN KEY ("aprobadaPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsigniaObtenida" ADD CONSTRAINT "InsigniaObtenida_scoutProfileId_fkey" FOREIGN KEY ("scoutProfileId") REFERENCES "ScoutProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsigniaObtenida" ADD CONSTRAINT "InsigniaObtenida_insigniaId_fkey" FOREIGN KEY ("insigniaId") REFERENCES "Insignia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evento" ADD CONSTRAINT "Evento_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "GrupoScout"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InscripcionEvento" ADD CONSTRAINT "InscripcionEvento_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "Evento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InscripcionEvento" ADD CONSTRAINT "InscripcionEvento_scoutProfileId_fkey" FOREIGN KEY ("scoutProfileId") REFERENCES "ScoutProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogisticaEvento" ADD CONSTRAINT "LogisticaEvento_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "Evento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asistencia" ADD CONSTRAINT "Asistencia_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "Evento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asistencia" ADD CONSTRAINT "Asistencia_scoutProfileId_fkey" FOREIGN KEY ("scoutProfileId") REFERENCES "ScoutProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cuota" ADD CONSTRAINT "Cuota_scoutProfileId_fkey" FOREIGN KEY ("scoutProfileId") REFERENCES "ScoutProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cuota" ADD CONSTRAINT "Cuota_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoFinanciero" ADD CONSTRAINT "MovimientoFinanciero_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "GrupoScout"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoFinanciero" ADD CONSTRAINT "MovimientoFinanciero_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemInventario" ADD CONSTRAINT "ItemInventario_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "GrupoScout"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrestamoInventario" ADD CONSTRAINT "PrestamoInventario_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ItemInventario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_destinatarioId_fkey" FOREIGN KEY ("destinatarioId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
