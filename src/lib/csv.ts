// src/lib/csv.ts
// Parser CSV mínimo y correcto para importación de censo.
// Soporta: separador , o ; · comillas dobles con escape "" · BOM · CRLF/LF.

export interface CsvParseResult {
  headers: string[];
  rows: string[][];
}

const DIACRITICS = /[̀-ͯ]/g;

export function parseCsv(input: string): CsvParseResult {
  const text = input.replace(/^﻿/, '');
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const delimiter = detectDelimiter(lines[0]);
  const headers = splitLine(lines[0], delimiter).map(normalizeHeader);
  const rows = lines.slice(1).map((l) => splitLine(l, delimiter));
  return { headers, rows };
}

function detectDelimiter(headerLine: string): ',' | ';' {
  const commas = (headerLine.match(/,/g) ?? []).length;
  const semicolons = (headerLine.match(/;/g) ?? []).length;
  return semicolons > commas ? ';' : ',';
}

function splitLine(line: string, delimiter: ',' | ';'): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === delimiter && !inQuotes) {
      cells.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }
  cells.push(current.trim());
  return cells;
}

function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITICS, '') // quita acentos
    .replace(/\s+/g, '_');
}

/** Construye un objeto fila a partir de headers y celdas. */
export function rowToObject(headers: string[], cells: string[]): Record<string, string> {
  const obj: Record<string, string> = {};
  headers.forEach((header, i) => {
    obj[header] = cells[i] ?? '';
  });
  return obj;
}
