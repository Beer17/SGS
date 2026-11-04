// Pruebas mínimas de flujos clave y utilidades puras.
import { describe, it, expect } from 'vitest';
import { parseCsv, rowToObject } from '@/lib/csv';
import { extractCredentialCode } from '@/lib/attendance';
import { getInitials, calcularEdad, formatCurrency } from '@/lib/utils';
import { LoginSchema, ScoutProfileSchema } from '@/lib/validations';

describe('extractCredentialCode', () => {
  it('acepta un código crudo válido', () => {
    expect(extractCredentialCode('94a54019-af11-43ca-9511-5b257e8032fd')).toBe('94a54019-af11-43ca-9511-5b257e8032fd');
  });
  it('extrae el code de una URL de verificación', () => {
    expect(extractCredentialCode('https://sisas.ansi/api/credencial/verify?code=abc-123-XYZ')).toBe('abc-123-XYZ');
  });
  it('extrae code de un fragmento sin esquema', () => {
    expect(extractCredentialCode('?code=xyz-789')).toBe('xyz-789');
  });
  it('rechaza basura', () => {
    expect(extractCredentialCode('')).toBeNull();
    expect(extractCredentialCode('   ')).toBeNull();
    expect(extractCredentialCode('https://x/y?nope=1')).toBeNull();
    expect(extractCredentialCode('código con espacios y acentos!')).toBeNull();
  });
});

describe('parseCsv', () => {
  it('detecta separador punto y coma y normaliza encabezados', () => {
    const { headers, rows } = parseCsv('Nombres;Fecha Nacimiento\nDiego;2012-05-14\n');
    expect(headers).toEqual(['nombres', 'fecha_nacimiento']);
    expect(rows).toEqual([['Diego', '2012-05-14']]);
  });
  it('maneja comillas y comas dentro de celdas', () => {
    const { rows } = parseCsv('a,b\n"Calle Hidalgo, 120","x""y"');
    expect(rows[0]).toEqual(['Calle Hidalgo, 120', 'x"y']);
  });
  it('ignora líneas vacías y BOM', () => {
    const { rows } = parseCsv('﻿a,b\n\n1,2\n');
    expect(rows).toEqual([['1', '2']]);
  });
  it('rowToObject mapea por encabezado', () => {
    expect(rowToObject(['a', 'b'], ['1', '2'])).toEqual({ a: '1', b: '2' });
  });
});

describe('utils', () => {
  it('getInitials toma primera letra de nombre y apellido', () => {
    expect(getInitials('Renata', 'Morales Sánchez')).toBe('RM');
  });
  it('calcularEdad respeta cumpleaños no ocurrido', () => {
    const hace18 = new Date();
    hace18.setFullYear(hace18.getFullYear() - 18);
    hace18.setDate(hace18.getDate() + 1); // aún no cumple este año
    expect(calcularEdad(hace18)).toBe(17);
  });
  it('formatCurrency produce MXN', () => {
    expect(formatCurrency(1500)).toMatch(/1,?500/);
  });
});

describe('validations', () => {
  it('login exige email válido y password ≥ 8', () => {
    expect(LoginSchema.safeParse({ email: 'no-es-email', password: '12345678' }).success).toBe(false);
    expect(LoginSchema.safeParse({ email: 'a@b.com', password: 'short' }).success).toBe(false);
    expect(LoginSchema.safeParse({ email: 'a@b.com', password: '12345678' }).success).toBe(true);
  });
  it('ScoutProfile acepta fecha ISO y secciones válidas', () => {
    const ok = ScoutProfileSchema.safeParse({
      nombres: 'Diego', apellidos: 'Martínez López',
      fechaNacimiento: new Date('2012-05-14').toISOString(),
      seccion: 'TROPA', grupoId: '123e4567-e89b-12d3-a456-426655440000', provinciaId: '123e4567-e89b-12d3-a456-426655440001',
    });
    expect(ok.success).toBe(true);
    expect(ScoutProfileSchema.safeParse({ seccion: 'OTRO' }).success).toBe(false);
  });
});
