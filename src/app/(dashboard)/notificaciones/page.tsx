'use client';
// src/app/(dashboard)/notificaciones/page.tsx
import { useNotificaciones } from '@/hooks/useNotificaciones';
import { Bell, CheckCheck, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { formatDate } from '@/lib/utils';
import { TIPO_NOTIFICACION_LABELS } from '@/lib/labels';
import type { TipoNotificacion } from '@/types';

const TIPO_COLOR: Record<TipoNotificacion, string> = {
  CUOTA_VENCIMIENTO:   'bg-[#fdecea] text-clay',
  EVENTO_RECORDATORIO: 'bg-[#fff5d9] text-[#a9790a]',
  PROGRESION_APROBADA: 'bg-fern text-moss',
  SISTEMA:             'bg-[#e8e8f0] text-[#5a5a7a]',
  MENSAJE:             'bg-[#e8f0ff] text-[#3a5aa8]',
};

export default function NotificacionesPage() {
  const { items, noLeidas, marcarLeida, refetch } = useNotificaciones();
  const [soloSinLeer, setSoloSinLeer] = useState(false);
  const visibles = soloSinLeer ? items.filter((n) => !n.leida) : items;

  return (
    <main className="max-w-3xl p-5 lg:p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-clay">Sistema</p>
          <h1 className="mt-2 font-display text-3xl font-bold">Notificaciones</h1>
          <p className="mt-2 text-sm text-[#718078]">
            {noLeidas > 0 ? `${noLeidas} sin leer.` : 'Todo al día.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setSoloSinLeer((v) => !v)}
            aria-pressed={soloSinLeer}
            className={`rounded-lg border px-3 py-2 text-xs font-bold ${soloSinLeer ? 'border-moss bg-fern text-moss' : 'border-[#dfe7dc] text-[#718078]'}`}>
            Solo sin leer
          </button>
          {noLeidas > 0 && (
            <button onClick={() => { items.filter((n) => !n.leida).forEach((n) => void marcarLeida(n.id)); void refetch(); }}
              className="flex items-center gap-1.5 rounded-lg bg-moss px-3 py-2 text-xs font-bold text-white">
              <CheckCheck size={13} /> Marcar todas
            </button>
          )}
        </div>
      </div>

      {visibles.length === 0 ? (
        <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-[#cbd8ca] bg-white">
          <div className="text-center">
            <Bell className="mx-auto mb-3 text-moss" size={30} />
            <p className="font-bold">{soloSinLeer ? 'Sin pendientes 🎉' : 'Sin notificaciones'}</p>
            <p className="mt-1 text-sm text-[#829087]">Te avisaremos cuando haya algo importante.</p>
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {visibles.map((n) => {
            const contenido = (
              <>
                <span className={`mt-0.5 shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${TIPO_COLOR[n.tipo]}`}>
                  {TIPO_NOTIFICACION_LABELS[n.tipo]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold">{n.titulo}</span>
                  <span className="mt-1 block text-sm font-normal text-[#718078]">{n.mensaje}</span>
                  <span className="mt-2 block text-xs font-normal text-[#a3b0a8]">{formatDate(n.createdAt)}</span>
                </span>
              </>
            );
            return (
              <li key={n.id}
                className={`flex items-start gap-4 rounded-2xl border p-5 transition-colors ${
                  n.leida ? 'border-[#e2e9df] bg-white' : 'border-moss/20 bg-fern/40'
                }`}
              >
                {n.accionUrl ? (
                  <Link href={n.accionUrl} onClick={() => { if (!n.leida) void marcarLeida(n.id); }}
                    className="flex min-w-0 flex-1 items-start gap-4 hover:opacity-85">
                    {contenido}
                  </Link>
                ) : (
                  <div className="flex min-w-0 flex-1 items-start gap-4">{contenido}</div>
                )}
                {!n.leida && (
                  <button onClick={() => void marcarLeida(n.id)} title="Marcar como leída"
                    aria-label="Marcar como leída"
                    className="shrink-0 text-moss hover:text-[#235740]">
                    <CheckCircle2 size={20} />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
