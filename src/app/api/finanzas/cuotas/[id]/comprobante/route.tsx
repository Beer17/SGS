// src/app/api/finanzas/cuotas/[id]/comprobante/route.tsx
// Comprobante de pago en PDF, generado bajo demanda.
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
import { requireApiRole, canManageFinances } from '@/lib/auth';

type Params = { params: { id: string } };

const styles = StyleSheet.create({
  page: { padding: 44, fontSize: 11, fontFamily: 'Helvetica', color: '#17241f' },
  brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#2b6a50', paddingBottom: 14 },
  brand: { fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase', color: '#2b6a50', fontFamily: 'Helvetica-Bold' },
  folio: { fontSize: 9, color: '#555' },
  title: { fontSize: 19, fontFamily: 'Helvetica-Bold', marginTop: 18 },
  subtitle: { fontSize: 10, color: '#555', marginTop: 2 },
  box: { marginTop: 16, borderWidth: 0.75, borderColor: '#e2e9df', borderRadius: 6, padding: 16, backgroundColor: '#f7f8f3' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  label: { fontSize: 8, textTransform: 'uppercase', letterSpacing: 1, color: '#718078' },
  value: { fontSize: 11, fontFamily: 'Helvetica-Bold' },
  amountBox: { marginTop: 18, backgroundColor: '#17241f', borderRadius: 6, padding: 18, alignItems: 'center' },
  amountLabel: { fontSize: 8, letterSpacing: 2, textTransform: 'uppercase', color: '#8fb59e' },
  amount: { fontSize: 30, fontFamily: 'Helvetica-Bold', color: '#f2c94c', marginTop: 4 },
  note: { marginTop: 16, fontSize: 8.5, color: '#555', lineHeight: 1.5 },
  footer: { position: 'absolute', bottom: 32, left: 44, right: 44, borderTopWidth: 0.5, borderTopColor: '#e2e9df', paddingTop: 10, fontSize: 8, color: '#777', flexDirection: 'row', justifyContent: 'space-between' },
});

const money = (n: number) =>
  n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

export async function GET(_request: Request, { params }: Params) {
  const { session, error } = await requireApiRole();
  if (error) return error;
  if (!canManageFinances(session)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }
  const { id } = params;

  const cuota = await db.cuota.findUnique({
    where: { id },
    include: {
      scoutProfile: {
        select: {
          nombres: true, apellidos: true, seccion: true,
          grupo: { select: { nombre: true, numeroGrupo: true } },
          provincia: { select: { nombre: true } },
        },
      },
    },
  });
  if (!cuota) return NextResponse.json({ error: 'Cuota no encontrada' }, { status: 404 });
  if (cuota.estatus !== 'PAGADA') {
    return NextResponse.json({ error: 'La cuota aún no está pagada; no hay comprobante' }, { status: 409 });
  }

  const folio = `SISAS-${cuota.id.slice(0, 8).toUpperCase()}`;
  const fechaPago = (cuota.fechaPago ?? cuota.createdAt).toLocaleDateString('es-MX', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const hora = (cuota.fechaPago ?? cuota.createdAt).toLocaleTimeString('es-MX', {
    hour: '2-digit', minute: '2-digit',
  });
  const nombre = `${cuota.scoutProfile.nombres} ${cuota.scoutProfile.apellidos}`;
  const monto = Number(cuota.monto);

  const buffer = await renderToBuffer(
    <Document title={`Comprobante ${folio}`}>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.brandRow}>
          <Text style={styles.brand}>SISAS ANSI</Text>
          <Text style={styles.folio}>Folio: {folio}</Text>
        </View>

        <Text style={styles.title}>Comprobante de pago</Text>
        <Text style={styles.subtitle}>Asociación Nacional de Scouts Independientes · Grupo {cuota.scoutProfile.grupo.numeroGrupo} — {cuota.scoutProfile.grupo.nombre}</Text>

        <View style={styles.box}>
          <View style={styles.row}>
            <View>
              <Text style={styles.label}>Miembro</Text>
              <Text style={styles.value}>{nombre}</Text>
            </View>
            <View>
              <Text style={styles.label}>Sección</Text>
              <Text style={styles.value}>{cuota.scoutProfile.seccion}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View>
              <Text style={styles.label}>Concepto</Text>
              <Text style={styles.value}>{cuota.concepto}</Text>
            </View>
            <View>
              <Text style={styles.label}>Ciclo</Text>
              <Text style={styles.value}>{cuota.ciclo}</Text>
            </View>
          </View>
          <View style={{ ...styles.row, marginBottom: 0 }}>
            <View>
              <Text style={styles.label}>Fecha y hora de pago</Text>
              <Text style={styles.value}>{fechaPago} · {hora}</Text>
            </View>
            <View>
              <Text style={styles.label}>Registrado por</Text>
              <Text style={styles.value}>{session.email}</Text>
            </View>
          </View>
        </View>

        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>Total pagado</Text>
          <Text style={styles.amount}>{money(monto)}</Text>
        </View>

        <Text style={styles.note}>
          Este comprobante ampara únicamente el concepto y el ciclo indicados. Consérvelo para aclaraciones.
          Los datos de este documento son administrados por la tesorería de su grupo scout conforme al aviso de privacidad de la asociación.
        </Text>

        <View style={styles.footer} fixed>
          <Text>{folio}</Text>
          <Text>Generado {new Date().toLocaleString('es-MX')}</Text>
        </View>
      </Page>
    </Document>,
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="comprobante-${folio}.pdf"`,
    },
  });
}
