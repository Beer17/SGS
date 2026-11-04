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
    PENDIENTE:'bg-[#fff5d9] text-[#a9790a]',
    VENCIDA:  'bg-[#fdecea] text-clay',
    EXENTA:   'bg-[#e8e8f0] text-[#5a5a7a]',
  }[estatus];
}

export function estatusRegistroColor(estatus: RegistroStatus): string {
  return {
    ACTIVO:   'bg-fern text-moss',
    PENDIENTE:'bg-[#fff5d9] text-[#a9790a]',
    VENCIDO:  'bg-[#fdecea] text-clay',
    BAJA:     'bg-[#e8e8f0] text-[#5a5a7a]',
  }[estatus];
}

export function estadoItemColor(estado: EstadoItem): string {
  return {
    DISPONIBLE:    'bg-fern text-moss',
    PRESTADO:      'bg-[#fff5d9] text-[#a9790a]',
    MANTENIMIENTO: 'bg-[#e8f0ff] text-[#3a5aa8]',
    DANADO:        'bg-[#fdecea] text-clay',
    BAJA:          'bg-[#e8e8f0] text-[#5a5a7a]',
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
