// src/lib/validations.ts
// Zod schemas para validación de inputs en API routes
import { z } from 'zod';

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const LoginSchema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
});

export const RegisterUserSchema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  role: z.enum(['ADMIN','NACIONAL','PROVINCIA','GRUPO','SECCION','MIEMBRO_TUTOR']),
});

// ─── Miembros ─────────────────────────────────────────────────────────────────

export const ScoutProfileSchema = z.object({
  nombres:          z.string().min(1).max(100),
  apellidos:        z.string().min(1).max(100),
  curp:             z.string().length(18).optional().or(z.literal('')),
  fechaNacimiento:  z.string().datetime(),
  telefono:         z.string().optional(),
  direccion:        z.string().optional(),
  seccion:          z.enum(['MANADA','TROPA','COMUNIDAD','CLAN','JEFATURA']),
  grupoId:          z.string().uuid(),
  provinciaId:      z.string().uuid(),
  cicloActivo:      z.string().optional(),
});

export const FichaMedicaSchema = z.object({
  tipoSangre:                   z.string().optional(),
  alergias:                     z.string().optional(),
  padecimientos:                z.string().optional(),
  medicamentos:                 z.string().optional(),
  tratamientoActual:            z.string().optional(),
  restriccionesActividad:       z.string().optional(),
  seguMedico:                   z.string().optional(),
  nombreMedico:                 z.string().optional(),
  telefonoMedico:               z.string().optional(),
  contactoEmergenciaNombre:     z.string().min(1),
  contactoEmergenciaTel:        z.string().min(1),
  contactoEmergenciaParentesco: z.string().optional(),
  contactoEmergencia2Nombre:    z.string().optional(),
  contactoEmergencia2Tel:       z.string().optional(),
  autorizacionActividades:      z.boolean().default(false),
});

// ─── Eventos ──────────────────────────────────────────────────────────────────

export const EventoSchema = z.object({
  nombre:               z.string().min(1).max(200),
  descripcion:          z.string().optional(),
  tipo:                 z.enum(['NACIONAL','REGIONAL','GRUPO','CAMPAMENTO','REUNION','CAPACITACION']),
  fechaInicio:          z.string().datetime(),
  fechaFin:             z.string().datetime(),
  lugar:                z.string().optional(),
  cupoMaximo:           z.number().int().positive().optional(),
  requiereAutorizacion: z.boolean().default(false),
  grupoId:              z.string().uuid().optional(),
});

export const InscripcionSchema = z.object({
  scoutProfileId:      z.string().uuid(),
  autorizacionParental:z.boolean().default(false),
  observaciones:       z.string().optional(),
});

export const AsistenciaSchema = z.object({
  records: z.array(z.object({
    id:                 z.string(),
    eventId:            z.string(),
    credentialCode:     z.string(),
    scannedAt:          z.string(),
    synchronizedOffline:z.boolean().default(false),
  })).min(1).max(500),
});

export const LogisticaEventoSchema = z.object({
  transporteInfo:  z.string().max(2000).optional(),
  lugarCampamento: z.string().max(500).optional(),
  equipoRequerido: z.string().max(2000).optional(),
  presupuesto:     z.number().nonnegative().optional(),
  notas:           z.string().max(2000).optional(),
});

// ─── Finanzas ─────────────────────────────────────────────────────────────────

export const CuotaSchema = z.object({
  scoutProfileId:  z.string().uuid(),
  tipo:            z.enum(['MEMBRESIA','EVENTO','OTRO']),
  concepto:        z.string().min(1),
  monto:           z.number().positive(),
  ciclo:           z.string().min(1),
  estatus:         z.enum(['PAGADA','PENDIENTE','VENCIDA','EXENTA']).default('PENDIENTE'),
  fechaVencimiento:z.string().datetime().optional(),
  fechaPago:       z.string().datetime().optional(),
  notas:           z.string().optional(),
});

export const MovimientoSchema = z.object({
  grupoId:  z.string().uuid(),
  tipo:     z.enum(['INGRESO','EGRESO']),
  concepto: z.string().min(1),
  monto:    z.number().positive(),
  fecha:    z.string().datetime().optional(),
  categoria:z.string().optional(),
  notas:    z.string().optional(),
});

// ─── Inventario ───────────────────────────────────────────────────────────────

export const InventarioItemSchema = z.object({
  grupoId:          z.string().uuid(),
  nombre:           z.string().min(1).max(200),
  descripcion:      z.string().optional(),
  categoria:        z.string().optional(),
  cantidad:         z.number().int().min(1).default(1),
  estado:           z.enum(['DISPONIBLE','PRESTADO','MANTENIMIENTO','DANADO','BAJA']).default('DISPONIBLE'),
  ubicacion:        z.string().optional(),
  valorUnitario:    z.number().positive().optional(),
  fechaAdquisicion: z.string().datetime().optional(),
  notas:            z.string().optional(),
});

export const PrestamoSchema = z.object({
  prestatarioNombre: z.string().min(1),
  prestatarioId:     z.string().uuid().optional(),
  observaciones:     z.string().optional(),
});

// ─── Progresión ───────────────────────────────────────────────────────────────

export const ProgresionSchema = z.object({
  scoutProfileId: z.string().uuid(),
  seccion:        z.enum(['MANADA','TROPA','COMUNIDAD','CLAN','JEFATURA']),
  etapaNombre:    z.string().min(1),
  descripcion:    z.string().optional(),
  evidencia:      z.string().optional(),
});

export const InsigniaSchema = z.object({
  nombre:      z.string().min(1),
  descripcion: z.string().optional(),
  seccion:     z.enum(['MANADA','TROPA','COMUNIDAD','CLAN','JEFATURA']).optional(),
  categoria:   z.string().optional(),
  imagen:      z.string().optional(),
});

export const InsigniaOtorgarSchema = z.object({
  scoutProfileId: z.string().uuid(),
  insigniaId:     z.string().uuid(),
  observaciones:  z.string().optional(),
});

// ─── Grupos ───────────────────────────────────────────────────────────────────

export const GrupoScoutSchema = z.object({
  numeroGrupo: z.number().int().positive(),
  nombre:      z.string().min(1).max(200),
  provinciaId: z.string().uuid(),
});

