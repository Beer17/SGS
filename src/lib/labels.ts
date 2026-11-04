// src/lib/labels.ts
// Etiquetas legibles para roles y tipos.
import type { Role, TipoEvento, TipoNotificacion } from '@/types';

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrador',
  NACIONAL: 'Nivel nacional',
  PROVINCIA: 'Coordinación provincial',
  GRUPO: 'Jefe de grupo',
  SECCION: 'Scouter',
  MIEMBRO_TUTOR: 'Padre / Tutor',
};

export const TIPO_EVENTO_LABELS: Record<TipoEvento, string> = {
  NACIONAL: 'Nacional',
  REGIONAL: 'Regional',
  GRUPO: 'Grupo',
  CAMPAMENTO: 'Campamento',
  REUNION: 'Reunión',
  CAPACITACION: 'Capacitación',
};

export const TIPO_NOTIFICACION_LABELS: Record<TipoNotificacion, string> = {
  CUOTA_VENCIMIENTO: 'Cuotas',
  EVENTO_RECORDATORIO: 'Eventos',
  PROGRESION_APROBADA: 'Progresión',
  SISTEMA: 'Sistema',
  MENSAJE: 'Mensaje',
};
