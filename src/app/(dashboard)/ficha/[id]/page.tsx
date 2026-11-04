// src/app/(dashboard)/ficha/[id]/page.tsx
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Activity, AlertTriangle, ArrowLeft, Droplets, HeartPulse, Medal, Phone, ShieldCheck, ShieldAlert, Siren, Stethoscope, User,
} from 'lucide-react';
import { getSession, canViewMedical, canManageMembers, canOperate } from '@/lib/auth';
import { db } from '@/lib/db';
import { audit, maskCurp } from '@/lib/api';
import { calcularEdad, estatusRegistroColor, formatDate, getInitials } from '@/lib/utils';
import { SECTION_LABELS } from '@/types';
import { PRINT_CSS } from '@/components/PrintCss';
import { MemberActions } from '@/components/members/MemberActions';
import { PrintButton } from '@/components/members/PrintButton';
import { InsigniaGrant } from '@/components/members/InsigniaGrant';

// Paleta determinista por categoría de insignia
const BADGE_COLORS = ['bg-[#e8b93b]', 'bg-[#2b6a50]', 'bg-[#c96b4b]', 'bg-[#3a5aa8]', 'bg-[#7a5a06]', 'bg-[#5a5a7a]'];
function badgeColor(categoria: string): string {
  let hash = 0;
  for (const ch of categoria) hash = (hash * 31 + (ch.codePointAt(0) ?? 0)) | 0;
  return BADGE_COLORS[Math.abs(hash) % BADGE_COLORS.length];
}

export default async function FichaPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) redirect('/login');

  const scout = await db.scoutProfile.findUnique({
    where: { id: params.id },
    include: {
      grupo: true,
      provincia: true,
      fichaMedica: true,
      progresiones: { orderBy: { createdAt: 'asc' } },
      insigniasObtenidas: { include: { insignia: true }, orderBy: { fechaObtencion: 'desc' } },
      cuotas: { where: { estatus: { in: ['PENDIENTE', 'VENCIDA'] } }, select: { id: true } },
    },
  });

  if (!scout) notFound();

  // Tutor: solo el expediente vinculado a su cuenta
  const esPropio = scout.userId === session.id;
  if (session.role === 'MIEMBRO_TUTOR' && !esPropio) {
    return (
      <main className="p-5 lg:p-8">
        <div className="max-w-md rounded-2xl border border-[#f0d9d0] bg-white p-8 text-center shadow-soft">
          <ShieldAlert className="mx-auto mb-3 text-clay" size={36} />
          <h1 className="font-display text-xl font-bold">Expediente restringido</h1>
          <p className="mt-2 text-sm text-[#718078]">Solo puedes consultar los expedientes vinculados a tu cuenta.</p>
          <Link href="/censo" className="mt-4 inline-block text-sm font-bold text-moss">Volver al censo</Link>
        </div>
      </main>
    );
  }

  const medicalAllowed = canViewMedical(session) || esPropio;
  if (medicalAllowed && scout.fichaMedica) {
    await audit({ userId: session.id, accion: 'CONSULTA_FICHA_MEDICA', entidad: 'FichaMedica', entidadId: scout.fichaMedica.id });
  }

  // Resolver quién otorgó cada insignia (corre con el cliente actual, sin depender del nuevo relation)
  const otorganteIds = [...new Set(scout.insigniasObtenidas.map((io) => io.otorgadaPorId).filter((v): v is string => Boolean(v)))];
  const otorgantes = otorganteIds.length > 0
    ? await db.user.findMany({ where: { id: { in: otorganteIds } }, select: { id: true, email: true } })
    : [];
  const otorganteEmail = new Map(otorgantes.map((u) => [u.id, u.email]));

  const ficha = medicalAllowed ? scout.fichaMedica : null;
  const edad = calcularEdad(scout.fechaNacimiento);
  const completadas = scout.progresiones.filter((p) => p.completada).length;
  const insigniasPorCategoria = new Map<string, number>();
  for (const io of scout.insigniasObtenidas) {
    const cat = io.insignia.categoria ?? 'General';
    insigniasPorCategoria.set(cat, (insigniasPorCategoria.get(cat) ?? 0) + 1);
  }
  const alertasMedicas = ficha ? [ficha.alergias, ficha.padecimientos, ficha.restriccionesActividad].filter(Boolean) as string[] : [];
  const requiereAtencion = alertasMedicas.length > 0;

  return (
    <main className="p-5 lg:p-8 print:p-0">
      <style>{PRINT_CSS}</style>
      <div className="print:hidden">
        <Link href="/censo" className="mb-4 inline-flex items-center gap-2 text-xs font-bold text-moss">
          <ArrowLeft size={14} /> Censo
        </Link>
      </div>

      {/* Encabezado del expediente */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div className="flex items-center gap-4">
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-moss font-display text-2xl font-bold text-white">
            {getInitials(scout.nombres, scout.apellidos)}
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[.2em] text-clay">Expediente scout</p>
            <h1 className="mt-1 font-display text-2xl font-bold lg:text-3xl">{scout.nombres} {scout.apellidos}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-fern px-3 py-1 font-bold text-moss">{SECTION_LABELS[scout.seccion]}</span>
              <span className="rounded-full bg-paper px-3 py-1 font-bold text-[#5c6f63]">Grupo {scout.grupo.numeroGrupo} · {scout.grupo.nombre}</span>
              <span className={`rounded-full px-3 py-1 font-bold ${estatusRegistroColor(scout.estatusRegistro)}`}>{scout.estatusRegistro}</span>
              {scout.cuotas.length > 0 && (
                <span className="rounded-full bg-[#fdecea] px-3 py-1 font-bold text-clay">{scout.cuotas.length} cuota(s) pendiente(s)</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <PrintButton />
          <MemberActions scoutId={scout.id} canManage={canManageMembers(session)} />
        </div>
      </div>

      {/* Alerta médica para salidas de campo */}
      {requiereAtencion && (
        <div role="alert" className="mt-6 flex items-start gap-3 rounded-2xl border border-[#f5d9a8] bg-[#fff8e7] p-4">
          <AlertTriangle className="mt-0.5 shrink-0 text-[#a9790a]" size={22} />
          <div className="text-sm">
            <p className="font-bold text-[#7a5a06]">Atención antes de salidas y campamentos</p>
            <ul className="mt-1 list-inside list-disc text-[#6b5310]">
              {alertasMedicas.map((a) => <li key={a}>{a}</li>)}
            </ul>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        {/* Columna izquierda */}
        <div className="space-y-6">
          {/* Datos personales */}
          <section className="rounded-2xl border border-[#e2e9df] bg-white p-6 shadow-soft">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold"><User size={18} className="text-moss" /> Datos personales</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2 text-sm">
              <div><dt className="text-xs font-bold uppercase text-[#829087]">Fecha de nacimiento</dt><dd className="mt-0.5 font-semibold">{formatDate(scout.fechaNacimiento)} · {edad} años</dd></div>
              <div><dt className="text-xs font-bold uppercase text-[#829087]">CURP</dt><dd className="mt-0.5 font-mono text-[13px]">{maskCurp(scout.curp) ?? '—'}</dd></div>
              <div><dt className="text-xs font-bold uppercase text-[#829087]">Teléfono</dt><dd className="mt-0.5 font-semibold">{scout.telefono ?? '—'}</dd></div>
              <div><dt className="text-xs font-bold uppercase text-[#829087]">Provincia</dt><dd className="mt-0.5 font-semibold">{scout.provincia.nombre} · {scout.provincia.region}</dd></div>
              <div className="sm:col-span-2"><dt className="text-xs font-bold uppercase text-[#829087]">Dirección</dt><dd className="mt-0.5 font-semibold">{scout.direccion ?? '—'}</dd></div>
              <div><dt className="text-xs font-bold uppercase text-[#829087]">Ciclo activo</dt><dd className="mt-0.5 font-semibold">{scout.cicloActivo ?? '—'}</dd></div>
              <div><dt className="text-xs font-bold uppercase text-[#829087]">Registrado</dt><dd className="mt-0.5 font-semibold">{formatDate(scout.createdAt)}</dd></div>
            </dl>
          </section>

          {/* Ficha médica */}
          {medicalAllowed ? (
            <section className="rounded-2xl border border-[#e2e9df] bg-white p-6 shadow-soft">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold"><HeartPulse size={18} className="text-clay" /> Ficha médica y emergencia</h2>
              {!ficha ? (
                <p className="mt-3 text-sm text-[#718078]">
                  Sin ficha médica registrada.{' '}
                  <Link href={`/censo/${scout.id}/editar`} className="font-bold text-moss">Completar expediente</Link>
                </p>
              ) : (
                <>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 rounded-xl bg-[#fdecea] px-4 py-2 text-clay">
                      <Droplets size={20} />
                      <span className="font-display text-2xl font-bold">{ficha.tipoSangre ?? '?'}</span>
                    </div>
                    <div className="text-xs text-[#718078]">
                      <p className="font-bold uppercase">Seguro médico</p>
                      <p className="font-mono text-sm text-ink">{ficha.seguMedico ?? 'No registrado'}</p>
                    </div>
                    {ficha.nombreMedico && (
                      <div className="text-xs text-[#718078]">
                        <p className="font-bold uppercase">Médico tratante</p>
                        <p className="text-sm text-ink">{ficha.nombreMedico}{ficha.telefonoMedico ? ` · ${ficha.telefonoMedico}` : ''}</p>
                      </div>
                    )}
                  </div>

                  <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                    <div><dt className="text-xs font-bold uppercase text-[#829087]">Alergias</dt><dd className="mt-0.5 font-semibold">{ficha.alergias ?? 'Ninguna conocida'}</dd></div>
                    <div><dt className="text-xs font-bold uppercase text-[#829087]">Padecimientos</dt><dd className="mt-0.5 font-semibold">{ficha.padecimientos ?? 'Ninguno'}</dd></div>
                    <div><dt className="text-xs font-bold uppercase text-[#829087]">Medicamentos</dt><dd className="mt-0.5 font-semibold">{ficha.medicamentos ?? '—'}</dd></div>
                    <div><dt className="text-xs font-bold uppercase text-[#829087]">Tratamiento actual</dt><dd className="mt-0.5 font-semibold">{ficha.tratamientoActual ?? '—'}</dd></div>
                    <div className="sm:col-span-2"><dt className="text-xs font-bold uppercase text-[#829087]">Restricciones de actividad</dt><dd className="mt-0.5 font-semibold">{ficha.restriccionesActividad ?? 'Ninguna'}</dd></div>
                  </dl>

                  <div className="mt-5 rounded-xl bg-paper p-4">
                    <p className="flex items-center gap-2 text-xs font-bold uppercase text-[#5c6f63]"><Siren size={14} /> Contactos de emergencia</p>
                    <div className="mt-2 grid gap-3 sm:grid-cols-2 text-sm">
                      <div>
                        <p className="font-bold">{ficha.contactoEmergenciaNombre}{ficha.contactoEmergenciaParentesco ? ` (${ficha.contactoEmergenciaParentesco})` : ''}</p>
                        <p className="mt-0.5 flex items-center gap-1 font-mono"><Phone size={12} /> {ficha.contactoEmergenciaTel}</p>
                      </div>
                      {ficha.contactoEmergencia2Nombre && (
                        <div>
                          <p className="font-bold">{ficha.contactoEmergencia2Nombre}</p>
                          <p className="mt-0.5 flex items-center gap-1 font-mono"><Phone size={12} /> {ficha.contactoEmergencia2Tel}</p>
                        </div>
                      )}
                    </div>
                    <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#5c6f63]">
                      {ficha.autorizacionActividades
                        ? <><ShieldCheck size={15} className="text-moss" /> Autorización parental firmada para actividades</>
                        : <><ShieldAlert size={15} className="text-clay" /> SIN autorización parental firmada</>}
                    </p>
                  </div>
                </>
              )}
            </section>
          ) : (
            <section className="rounded-2xl border border-dashed border-[#dfe7dc] bg-white/50 p-6 text-sm text-[#718078]">
              <p className="flex items-center gap-2 font-bold text-[#5c6f63]"><Stethoscope size={18} /> Ficha médica</p>
              <p className="mt-1">Visible solo para jefatura y coordinación. Tu rol actual no tiene acceso.</p>
            </section>
          )}
        </div>

        {/* Columna derecha */}
        <div className="space-y-6">
          {/* Progresión */}
          <section className="rounded-2xl border border-[#e2e9df] bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold"><Activity size={18} className="text-moss" /> Progresión</h2>
              <Link href="/progresion" className="text-xs font-bold text-moss">Ver / aprobar →</Link>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-paper">
                <div className="h-full rounded-full bg-moss" style={{ width: `${scout.progresiones.length ? Math.round((completadas / scout.progresiones.length) * 100) : 0}%` }} />
              </div>
              <span className="text-xs font-bold text-[#5c6f63]">{completadas}/{scout.progresiones.length} etapas</span>
            </div>
            <ol className="mt-4 space-y-2 text-sm">
              {scout.progresiones.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 odd:bg-paper/60">
                  <span className="truncate">{p.etapaNombre}</span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${p.completada ? 'bg-fern text-moss' : 'bg-[#fff5d9] text-[#a9790a]'}`}>
                    {p.completada ? 'Aprobada' : 'En curso'}
                  </span>
                </li>
              ))}
              {scout.progresiones.length === 0 && <li className="text-[#829087]">Sin etapas registradas todavía.</li>}
            </ol>
          </section>

          {/* Seguridad en campo */}
          <section className="rounded-2xl bg-ink p-6 text-white shadow-soft print:hidden">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-[#8fb59e]">En campo</p>
            <p className="mt-1 text-sm text-[#c9d8cd]">Lleva siempre esta ficha impresa en campamentos. En emergencia, usa los contactos de arriba y avisa a jefatura.</p>
          </section>
        </div>
      </div>

      {/* ─── Área de insignias (ancho completo) ─── */}
      <section className="mt-6 rounded-2xl border border-[#e2e9df] bg-white p-6 shadow-soft" aria-labelledby="area-insignias">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 id="area-insignias" className="flex items-center gap-2 font-display text-xl font-bold">
              <Medal size={22} className="text-[#c9a227]" /> Área de insignias
              <span className="rounded-full bg-[#fff8e7] px-2.5 py-0.5 font-sans text-xs font-bold text-[#7a5a06]">{scout.insigniasObtenidas.length}</span>
            </h2>
            <p className="mt-1 text-xs text-[#829087]">Reconocimientos obtenidos en su sección · visibles también en su credencial y expediente impreso.</p>
          </div>
          {canOperate(session) && (
            <InsigniaGrant
              scoutId={scout.id}
              seccion={scout.seccion}
              obtainedIds={scout.insigniasObtenidas.map((io) => io.insignia.id)}
            />
          )}
        </div>

        {/* Resumen por categoría */}
        {insigniasPorCategoria.size > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {[...insigniasPorCategoria.entries()].sort((a, b) => b[1] - a[1]).map(([cat, n]) => (
              <span key={cat} className="rounded-full bg-paper px-3 py-1.5 text-[11px] font-bold text-[#5c6f63]">
                {cat} · <span className="text-ink">{n}</span>
              </span>
            ))}
          </div>
        )}

        {/* Tarjetas de insignia */}
        {scout.insigniasObtenidas.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-[#cbd8ca] bg-paper/40 p-8 text-center">
            <Medal size={30} className="mx-auto text-[#c9a227]" />
            <p className="mt-2 font-bold">Aún sin insignias</p>
            <p className="mt-1 text-sm text-[#829087]">
              Las insignias se otorgan al completar especialidades y servicio.{' '}
              {canOperate(session) ? 'Usa el selector de arriba para otorgar la primera.' : 'El scouter se las entregará en la próxima reunión.'}
            </p>
          </div>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {scout.insigniasObtenidas.map((io) => {
              const categoria = io.insignia.categoria ?? 'General';
              const otorgo = io.otorgadaPorId ? otorganteEmail.get(io.otorgadaPorId) : null;
              return (
                <li key={io.id} className="flex items-start gap-3 rounded-xl border border-[#f0ead2] bg-[#fffdf3] p-3 transition-colors hover:border-[#e8b93b]">
                  <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl text-white ${badgeColor(categoria)}`}>
                    <Medal size={24} strokeWidth={1.8} aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold leading-snug">{io.insignia.nombre}</p>
                    <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[.14em] text-[#a3a05a]">{categoria}</p>
                    <p className="mt-1.5 text-[10px] leading-snug text-[#829087]">
                      Obtenida el {formatDate(io.fechaObtencion)}
                      {otorgo && <><br />Otorgó: <span className="font-semibold text-[#5c6f63]">{otorgo}</span></>}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
