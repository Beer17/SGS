// src/app/(dashboard)/credencial/[id]/page.tsx
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, ShieldX } from 'lucide-react';
import { getSession, canViewMedical } from '@/lib/auth';
import { db } from '@/lib/db';
import { CredencialCard } from '@/components/credencial/CredencialCard';
import { PrintButton } from '@/components/members/PrintButton';
import { SECTION_LABELS } from '@/types';
import { PRINT_CSS } from '@/components/PrintCss';

export default async function CredencialPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) redirect('/login');

  const scout = await db.scoutProfile.findUnique({
    where: { id: params.id },
    include: {
      grupo: true,
      fichaMedica: { select: { tipoSangre: true } },
    },
  });
  if (!scout) notFound();

  const esPropio = scout.userId === session.id;
  if (session.role === 'MIEMBRO_TUTOR' && !esPropio) {
    return (
      <main className="p-5 lg:p-8">
        <p className="text-sm font-semibold text-clay">Solo puedes ver la credencial de tu expediente vinculado.</p>
        <Link href="/censo" className="mt-2 inline-block text-sm font-bold text-moss">Volver al censo</Link>
      </main>
    );
  }

  const activa = scout.estatusRegistro === 'ACTIVO';
  // El tipo de sangre solo se muestra a jefatura o al propio expediente
  const bloodType = canViewMedical(session) || esPropio ? scout.fichaMedica?.tipoSangre ?? '—' : '—';

  return (
    <main className="p-5 lg:p-8 print:p-0">
      <style>{PRINT_CSS}</style>
      <Link href={`/ficha/${scout.id}`} className="mb-6 inline-flex items-center gap-2 text-xs font-bold text-moss print:hidden">
        <ArrowLeft size={14} /> Volver a la ficha
      </Link>

      <div className="mx-auto max-w-md">
        <p className="text-xs font-bold uppercase tracking-[.2em] text-clay">Credencial digital</p>
        <h1 className="mt-2 font-display text-2xl font-bold">{scout.nombres} {scout.apellidos}</h1>

        <div className="mt-6">
          <CredencialCard
            id={scout.codigoCredencialQR}
            name={`${scout.nombres} ${scout.apellidos}`}
            group={`Grupo ${scout.grupo.numeroGrupo}`}
            section={SECTION_LABELS[scout.seccion]}
            bloodType={bloodType}
            status={scout.estatusRegistro}
          />
        </div>

        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-line bg-surface p-4 text-sm print:hidden">
          {activa ? (
            <>
              <ShieldCheck className="mt-0.5 shrink-0 text-moss" size={20} />
              <p className="text-muted"><span className="font-bold">Credencial vigente.</span> Al escanear el QR se confirma que el registro está ACTIVO y coincide con la asociación.</p>
            </>
          ) : (
            <>
              <ShieldX className="mt-0.5 shrink-0 text-clay" size={20} />
              <p className="text-clay"><span className="font-bold">Credencial no vigente ({scout.estatusRegistro}).</span> La verificación pública la mostrará como no válida hasta regularizar el registro.</p>
            </>
          )}
        </div>

        <div className="mt-4 print:hidden">
          <PrintButton />
        </div>
      </div>
    </main>
  );
}
