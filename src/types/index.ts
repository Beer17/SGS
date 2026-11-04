// src/types/index.ts
export type Role = 'ADMIN' | 'NACIONAL' | 'PROVINCIA' | 'GRUPO' | 'SECCION' | 'MIEMBRO_TUTOR';
export type Seccion = 'MANADA_GACELAS' | 'MANADA_LOBATOS' | 'TROPA' | 'CLAN' | 'JEFATURA';
export type RamaTropa = 'COMUNIDAD';
export type RegistroStatus = 'ACTIVO' | 'PENDIENTE' | 'VENCIDO' | 'BAJA';
export type TipoEvento = 'NACIONAL' | 'REGIONAL' | 'GRUPO' | 'CAMPAMENTO' | 'REUNION' | 'CAPACITACION';
export type TipoMovimiento = 'INGRESO' | 'EGRESO';
export type TipoCuota = 'MEMBRESIA' | 'EVENTO' | 'OTRO';
export type EstatusCuota = 'PAGADA' | 'PENDIENTE' | 'VENCIDA' | 'EXENTA';
export type EstadoItem = 'DISPONIBLE' | 'PRESTADO' | 'MANTENIMIENTO' | 'DANADO' | 'BAJA';
export type TipoNotificacion = 'CUOTA_VENCIMIENTO' | 'EVENTO_RECORDATORIO' | 'PROGRESION_APROBADA' | 'SISTEMA' | 'MENSAJE';

export const ROLES = ['ADMIN', 'NACIONAL', 'PROVINCIA', 'GRUPO', 'SECCION', 'MIEMBRO_TUTOR'] as const;
export const SECTIONS: Seccion[] = ['MANADA_GACELAS', 'MANADA_LOBATOS', 'TROPA', 'CLAN', 'JEFATURA'];
export const SECTION_LABELS: Record<Seccion, string> = {
  MANADA_GACELAS: 'Manada Gacelas',
  MANADA_LOBATOS: 'Manada Lobatos',
  TROPA: 'Tropa Scout',
  CLAN: 'Clan / Rover',
  JEFATURA: 'Jefatura',
};
export const SECTION_AGES: Record<Seccion, string> = {
  MANADA_GACELAS: '6–11 años',
  MANADA_LOBATOS: '6–11 años',
  TROPA: '11–17 años',
  CLAN: '17–24 años',
  JEFATURA: 'Mayores de 21',
};
export const RAMAS_TROPA: RamaTropa[] = ['COMUNIDAD'];
export const RAMA_LABELS: Record<RamaTropa, string> = {
  COMUNIDAD: 'Comunidad (15–17)',
};

export const PERMISSIONS = [
  'SISTEMA_EDITAR',
  'MIEMBROS_LEER',
  'MIEMBROS_EDITAR',
  'MIEMBROS_ELIMINAR',
  'FICHA_MEDICA_LEER',
  'FICHA_MEDICA_EDITAR',
  'EVENTOS_GESTIONAR',
  'ASISTENCIA_REGISTRAR',
  'PROGRESION_APROBAR',
  'FINANZAS_LEER',
  'FINANZAS_EDITAR',
  'INVENTARIO_LEER',
  'INVENTARIO_EDITAR',
  'NOTIFICACIONES_ENVIAR',
  'REPORTES_EXPORTAR',
] as const;

export type Permission = typeof PERMISSIONS[number];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  ADMIN:         PERMISSIONS,
  NACIONAL:      PERMISSIONS,
  PROVINCIA:     ['MIEMBROS_LEER', 'MIEMBROS_EDITAR', 'FICHA_MEDICA_LEER', 'FICHA_MEDICA_EDITAR', 'EVENTOS_GESTIONAR', 'ASISTENCIA_REGISTRAR', 'PROGRESION_APROBAR', 'FINANZAS_LEER', 'INVENTARIO_LEER', 'REPORTES_EXPORTAR'],
  GRUPO:         ['MIEMBROS_LEER', 'MIEMBROS_EDITAR', 'FICHA_MEDICA_LEER', 'FICHA_MEDICA_EDITAR', 'EVENTOS_GESTIONAR', 'ASISTENCIA_REGISTRAR', 'PROGRESION_APROBAR', 'FINANZAS_LEER', 'FINANZAS_EDITAR', 'INVENTARIO_LEER', 'INVENTARIO_EDITAR', 'REPORTES_EXPORTAR'],
  SECCION:       ['MIEMBROS_LEER', 'FICHA_MEDICA_LEER', 'ASISTENCIA_REGISTRAR', 'PROGRESION_APROBAR', 'INVENTARIO_LEER'],
  MIEMBRO_TUTOR: ['MIEMBROS_LEER', 'FICHA_MEDICA_LEER', 'ASISTENCIA_REGISTRAR'],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

// ─── Interfaces de datos ───────────────────────────────────────────────────

export interface GroupRole {
  id: string;
  name: string;
  province: string;
  members: number;
  role: Extract<Role, 'GRUPO' | 'PROVINCIA'>;
}

export interface ScoutSummary {
  id: string;
  initials: string;
  name: string;
  section: Seccion;
  group: string;
  status: RegistroStatus;
  updatedAt: string;
}

export interface ScoutProfileFull {
  id: string;
  nombres: string;
  apellidos: string;
  curp?: string;
  fechaNacimiento: string;
  telefono?: string;
  direccion?: string;
  foto?: string;
  seccion: Seccion;
  grupoId: string;
  provinciaId: string;
  estatusRegistro: RegistroStatus;
  codigoCredencialQR: string;
  cicloActivo?: string;
  fichaMedica?: FichaMedicaForm;
}

export interface FichaMedicaForm {
  tipoSangre?: string;
  alergias?: string;
  padecimientos?: string;
  medicamentos?: string;
  tratamientoActual?: string;
  restriccionesActividad?: string;
  seguMedico?: string;
  nombreMedico?: string;
  telefonoMedico?: string;
  contactoEmergenciaNombre: string;
  contactoEmergenciaTel: string;
  contactoEmergenciaParentesco?: string;
  contactoEmergencia2Nombre?: string;
  contactoEmergencia2Tel?: string;
  autorizacionActividades: boolean;
}

export interface CuotaItem {
  id: string;
  scoutId: string;
  scoutNombre: string;
  tipo: TipoCuota;
  concepto: string;
  monto: number;
  ciclo: string;
  estatus: EstatusCuota;
  fechaVencimiento?: string;
  fechaPago?: string;
}

export interface MovimientoItem {
  id: string;
  tipo: TipoMovimiento;
  concepto: string;
  monto: number;
  fecha: string;
  categoria?: string;
}

export interface InventarioItem {
  id: string;
  nombre: string;
  descripcion?: string;
  categoria?: string;
  cantidad: number;
  estado: EstadoItem;
  ubicacion?: string;
  valorUnitario?: number;
}

export interface NotificacionItem {
  id: string;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  leida: boolean;
  accionUrl?: string;
  createdAt: string;
}

export interface DashboardMetrics {
  miembrosActivos: number;
  gruposRegistrados: number;
  alertasmedicas: number;
  proximosEventos: number;
  cuotasPendientes: number;
  balanceMes: number;
}
