// src/lib/utils.ts
import type { EstatusCuota, EstadoItem, RegistroStatus, TipoMovimiento } from '@/types';

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
}

export function getInitials(nombres: string, apellidos: string): string {
  const n = nombres.trim()[0] ?? '';
  const a = apellidos.trim()[0] ?? '';
  return `${n}${a}`.toUpperCase();
}

export function calcularEdad(fechaNacimiento: Date | string): number {
  const hoy = new Date();
  const nac = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const diff = hoy.getMonth() - nac.getMonth();
  if (diff < 0 || (diff === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}

export function estatusCuotaColor(estatus: EstatusCuota): string {
  return {
    PAGADA:   'bg-fern text-moss',
    PENDIENTE:'bg-warnsoft text-warn',
    VENCIDA:  'bg-dangersoft text-clay',
    EXENTA:   'bg-neutralsoft text-neutral',
  }[estatus];
}

export function estatusRegistroColor(estatus: RegistroStatus): string {
  return {
    ACTIVO:   'bg-fern text-moss',
    PENDIENTE:'bg-warnsoft text-warn',
    VENCIDO:  'bg-dangersoft text-clay',
    BAJA:     'bg-neutralsoft text-neutral',
  }[estatus];
}

export function estadoItemColor(estado: EstadoItem): string {
  return {
    DISPONIBLE:    'bg-fern text-moss',
    PRESTADO:      'bg-warnsoft text-warn',
    MANTENIMIENTO: 'bg-infosoft text-info',
    DANADO:        'bg-dangersoft text-clay',
    BAJA:          'bg-neutralsoft text-neutral',
  }[estado];
}

export function tipoMovimientoColor(tipo: TipoMovimiento): string {
  return tipo === 'INGRESO' ? 'text-moss' : 'text-clay';
}

export function tipoMovimientoPrefix(tipo: TipoMovimiento): string {
  return tipo === 'INGRESO' ? '+' : '-';
}

export function truncate(str: string, max = 40): string {
  return str.length > max ? `${str.slice(0, max)}…` : str;
}
