// src/app/api/eventos/[id]/asistencia/route.tsx
// Lista de asistencia de un evento. format=json (default) | csv | pdf
import { NextResponse } from 'next/server';
import {
  renderToBuffer,
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import { db } from '@/lib/db';
import { requireApiRole, canOperate } from '@/lib/auth';

type Params = { params: { id: string } };

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: 'Helvetica', color: '#17241f' },
  brand: { fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: '#2b6a50' },
  title: { fontSize: 18, fontFamily: 'Helvetica-Bold', marginTop: 6 },
  meta: { fontSize: 9, color: '#555', marginTop: 4, marginBottom: 14 },
  headRow: { flexDirection: 'row', backgroundColor: '#e7f1e8', paddingVertical: 5, paddingHorizontal: 6, fontFamily: 'Helvetica-Bold', fontSize: 8, textTransform: 'uppercase' },
  row: { flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 6, borderBottomWidth: 0.5, borderBottomColor: '#e2e9df' },
  cNum: { width: 24 },
  cName: { flex: 1 },
  cSeccion: { width: 90 },
  cHora: { width: 90, textAlign: 'right' },
  footer: { marginTop: 16, borderTopWidth: 0.5, borderTopColor: '#e2e9df', paddingTop: 8, fontSize: 9, color: '#555', flexDirection: 'row', justifyContent: 'space-between' },
  signBox: { marginTop: 42, flexDirection: 'row', justifyContent: 'space-between' },
  signLine: { width: 200, borderTopWidth: 0.75, borderTopColor: '#17241f', paddingTop: 4, fontSize: 8, color: '#555' },
});

interface AsistenciaItem {
  nombres: string;
  apellidos: string;
  seccion: string;
  horaEscaneo: Date;
  sincronizadoOffline: boolean;
}

function csvEscape(value: string): string {
  return /[",\n;]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export async function GET(request: Request, { params }: Params) {
  // Lista con nombres de menores: solo jefatura/coordinación
  const { session, error } = await requireApiRole();
  if (error) return error;
  if (!canOperate(session)) {
    return NextResponse.json({ error: 'Sin permisos para ver la lista de asistencia' }, { status: 403 });
  }
  const { id } = params;

  const evento = await db.evento.findUnique({
    where: { id },
    select: {
      nombre: true,
      fechaInicio: true,
      lugar: true,
      asistencias: {
        orderBy: { horaEscaneo: 'asc' },
        include: { scoutProfile: { select: { nombres: true, apellidos: true, seccion: true } } },
      },
    },
  });
  if (!evento) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });

  const items: AsistenciaItem[] = evento.asistencias.map((a) => ({
    nombres: a.scoutProfile.nombres,
    apellidos: a.scoutProfile.apellidos,
    seccion: a.scoutProfile.seccion,
    horaEscaneo: a.horaEscaneo,
    sincronizadoOffline: a.sincronizadoOffline,
  }));

  const format = new URL(request.url).searchParams.get('format') ?? 'json';

  if (format === 'json') {
    return NextResponse.json({
      data: items,
      total: items.length,
      evento: { nombre: evento.nombre, fechaInicio: evento.fechaInicio, lugar: evento.lugar },
    });
  }

  const fechaEvento = evento.fechaInicio.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });

  if (format === 'csv') {
    const header = '#,Nombre,Apellidos,Seccion,Hora de escaneo,Sincronizado offline';
    const lines = items.map((a, i) =>
      [
        i + 1,
        csvEscape(a.nombres),
        csvEscape(a.apellidos),
        a.seccion,
        a.horaEscaneo.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        a.sincronizadoOffline ? 'si' : 'no',
      ].join(','),
    );
    const csv = [`SISAS ANSI — ${evento.nombre} (${fechaEvento})`, header, ...lines, `Total,${items.length},,,,`].join('\r\n');
    return new NextResponse('﻿' + csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="asistencia-${id}.csv"`,
      },
    });
  }

  if (format === 'pdf') {
    const buffer = await renderToBuffer(
      <Document title={`Asistencia — ${evento.nombre}`}>
        <Page size="LETTER" style={styles.page}>
          <Text style={styles.brand}>SISAS ANSI · Lista de asistencia</Text>
          <Text style={styles.title}>{evento.nombre}</Text>
          <Text style={styles.meta}>
            {fechaEvento}
            {evento.lugar ? ` · ${evento.lugar}` : ''} · Total: {items.length} asistencias
          </Text>

          <View style={styles.headRow}>
            <Text style={styles.cNum}>#</Text>
            <Text style={styles.cName}>Nombre completo</Text>
            <Text style={styles.cSeccion}>Sección</Text>
            <Text style={styles.cHora}>Hora</Text>
          </View>
          {items.map((a, i) => (
            <View key={i} style={styles.row} wrap={false}>
              <Text style={styles.cNum}>{i + 1}</Text>
              <Text style={styles.cName}>
                {a.nombres} {a.apellidos}
              </Text>
              <Text style={styles.cSeccion}>{a.seccion}</Text>
              <Text style={styles.cHora}>
                {a.horaEscaneo.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          ))}

          <View style={styles.signBox}>
            <Text style={styles.signLine}>Jefe(a) de grupo / Responsable</Text>
            <Text style={styles.signLine}>Fecha y sello</Text>
          </View>

          <View style={styles.footer} fixed>
            <Text>Generado por {session.email}</Text>
            <Text>{new Date().toLocaleString('es-MX')}</Text>
          </View>
        </Page>
      </Document>,
    );

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="asistencia-${id}.pdf"`,
      },
    });
  }

  return NextResponse.json({ error: 'format debe ser json, csv o pdf' }, { status: 400 });
}
