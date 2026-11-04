'use client';
// src/app/(dashboard)/eventos/escaner/page.tsx
// Pase de lista con cámara real (jsQR) + cola offline en localStorage.
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Camera, CheckCircle2, ChevronDown, Cloud, CloudOff, Keyboard, Loader2,
  QrCode, RefreshCw, Square, Trash2, XCircle,
} from 'lucide-react';
import jsQR from 'jsqr';
import { extractCredentialCode } from '@/lib/attendance';
import type { TipoEvento } from '@/types';
import { TIPO_EVENTO_LABELS } from '@/lib/labels';

interface AttendanceRecord {
  id: string;
  eventId: string;
  credentialCode: string;
  scannedAt: string;
  synchronizedOffline: boolean;
}
interface EventoOption {
  id: string;
  nombre: string;
  tipo: TipoEvento;
  fechaInicio: string;
  lugar: string | null;
  cancelado: boolean;
}
type CamaraEstado = 'idle' | 'iniciando' | 'activa' | 'error';

const STORAGE_KEY = 'sisas:attendance:pending';

function readPending(): AttendanceRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as AttendanceRecord[]) : [];
  } catch {
    return [];
  }
}

export default function ScannerPage() {
  const [isOnline, setIsOnline]       = useState(true);
  const [pending, setPending]         = useState<AttendanceRecord[]>([]);
  const [eventos, setEventos]         = useState<EventoOption[]>([]);
  const [eventId, setEventId]         = useState('');
  const [asistentes, setAsistentes]   = useState<number | null>(null);
  const [camara, setCamara]           = useState<CamaraEstado>('idle');
  const [camaraError, setCamaraError] = useState('');
  const [mensaje, setMensaje]         = useState<{ tipo: 'ok' | 'error' | 'info'; texto: string } | null>(null);
  const [sincronizando, setSincronizando] = useState(false);
  const [manualCode, setManualCode]   = useState('');

  const videoRef  = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef    = useRef<number>(0);
  const lastScan  = useRef<{ code: string; at: number }>({ code: '', at: 0 });

  // ─── Conectividad ───────────────────────────────────────────────────────────
  useEffect(() => {
    setIsOnline(navigator.onLine);
    setPending(readPending());
    const update = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);

  // ─── Cargar eventos futuros (y en curso) ────────────────────────────────────
  useEffect(() => {
    fetch('/api/eventos')
      .then((r) => r.json())
      .then((d: { data?: EventoOption[] }) => {
        const ahora = Date.now() - 24 * 3600 * 1000; // incluye los de hoy
        const list = (d.data ?? []).filter((e) => !e.cancelado && +new Date(e.fechaInicio) >= ahora);
        setEventos(list);
        setEventId((prev) => prev || list[0]?.id || '');
      })
      .catch(() => setMensaje({ tipo: 'error', texto: 'No se pudieron cargar los eventos.' }));
  }, []);

  // ─── Contador de asistencia del evento seleccionado ─────────────────────────
  const refrescarContador = useCallback(async (id: string) => {
    if (!id) return;
    try {
      const res = await fetch(`/api/asistencia?eventoId=${encodeURIComponent(id)}`);
      const d = (await res.json()) as { total?: number };
      setAsistentes(d.total ?? 0);
    } catch { /* offline: se queda con el último valor */ }
  }, []);

  useEffect(() => { void refrescarContador(eventId); }, [eventId, refrescarContador]);

  // ─── Cola offline ────────────────────────────────────────────────────────────
  const persistPending = useCallback((records: AttendanceRecord[]) => {
    setPending(records);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, []);

  const sincronizar = useCallback(async (cola?: AttendanceRecord[]) => {
    const pendientes = cola ?? pending;
    if (pendientes.length === 0) return;
    setSincronizando(true);
    try {
      const response = await fetch('/api/asistencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: pendientes }),
      });
      const data = (await response.json()) as { accepted?: number; rejected?: number; errores?: string[] };
      if (!response.ok) throw new Error(data.errores?.[0] ?? 'Error del servidor');
      // Éxito: vaciar cola
      persistPending([]);
      setMensaje({
        tipo: 'ok',
        texto: `Sincronizadas ${data.accepted ?? 0} lectura(s)${data.rejected ? ` · ${data.rejected} rechazada(s)` : ''}.`,
      });
      void refrescarContador(eventId);
    } catch (error) {
      setMensaje({ tipo: 'error', texto: `No se pudo sincronizar: ${String((error as Error).message ?? error)}` });
    } finally {
      setSincronizando(false);
    }
  }, [pending, persistPending, eventId, refrescarContador]);

  // Auto-sincronizar al recuperar conexión
  useEffect(() => {
    if (isOnline && pending.length > 0) void sincronizar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  // ─── Registrar una lectura ───────────────────────────────────────────────────
  const registrarLectura = useCallback((rawCode: string) => {
    if (!eventId) { setMensaje({ tipo: 'error', texto: 'Selecciona un evento antes de escanear.' }); return; }
    const code = extractCredentialCode(rawCode);
    if (!code) { setMensaje({ tipo: 'error', texto: 'Código no reconocido. Verifica que sea una credencial SISAS.' }); return; }

    const record: AttendanceRecord = {
      id: crypto.randomUUID(),
      eventId,
      credentialCode: code,
      scannedAt: new Date().toISOString(),
      synchronizedOffline: !isOnline,
    };

    if (isOnline) {
      void fetch('/api/asistencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: [record] }),
      }).then(async (res) => {
        const data = (await res.json()) as { accepted?: number; errores?: string[] };
        if (res.ok && (data.accepted ?? 0) > 0) {
          setMensaje({ tipo: 'ok', texto: 'Asistencia registrada ✓' });
          void refrescarContador(eventId);
        } else {
          // Respuesta 4xx/5xx → a la cola para reintento manual
          persistPending([...pending, record]);
          setMensaje({ tipo: 'error', texto: data.errores?.[0] ?? 'No se pudo registrar; quedó en la cola.' });
        }
      }).catch(() => {
        persistPending([...pending, record]);
        setMensaje({ tipo: 'info', texto: 'Sin conexión con el servidor; lectura en cola.' });
      });
    } else {
      persistPending([...pending, record]);
      setMensaje({ tipo: 'info', texto: 'Sin conexión; lectura guardada en este dispositivo.' });
    }
  }, [eventId, isOnline, pending, persistPending, refrescarContador]);

  // ─── Cámara ──────────────────────────────────────────────────────────────────
  const detenerCamara = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCamara('idle');
  }, []);

  const iniciarCamara = useCallback(async () => {
    setCamara('iniciando');
    setCamaraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCamara('activa');

      const tick = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const qr = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
            if (qr?.data) {
              const now = Date.now();
              if (!(lastScan.current.code === qr.data && now - lastScan.current.at < 4000)) {
                lastScan.current = { code: qr.data, at: now };
                registrarLectura(qr.data);
              }
            }
          }
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch (error) {
      setCamara('error');
      setCamaraError(
        error instanceof DOMException && error.name === 'NotAllowedError'
          ? 'Permiso de cámara denegado. Actívalo en el navegador o usa la captura manual.'
          : 'No se pudo iniciar la cámara. Revisa que ningún otro programa la use.',
      );
    }
  }, [registrarLectura]);

  useEffect(() => detenerCamara, [detenerCamara]);

  const eventoSeleccionado = eventos.find((e) => e.id === eventId);

  return (
    <main className="max-w-6xl p-5 lg:p-8">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[.2em] text-clay">Operación en campo</p>
        <h1 className="mt-2 font-display text-3xl font-bold">Escáner de asistencia</h1>
        <p className="mt-1 text-sm text-[#718078]">
          Escanea el QR de la credencial. Si no hay red, las lecturas se guardan en este dispositivo y se sincronizan al volver la conexión.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        {/* ─── Visor de cámara ─── */}
        <div className="rounded-2xl bg-ink p-4 text-white sm:p-6">
          {/* Selector de evento */}
          <label className="block text-[10px] font-bold uppercase tracking-widest text-[#8fb59e]">Evento a registrar</label>
          <div className="relative mt-1.5">
            <select value={eventId} onChange={(e) => setEventId(e.target.value)}
              aria-label="Evento"
              className="w-full appearance-none rounded-lg border border-white/15 bg-white/10 py-3 pl-4 pr-10 text-sm font-semibold text-white outline-none focus:border-citrus">
              {eventos.length === 0 && <option value="">Sin eventos próximos</option>}
              {eventos.map((e) => (
                <option key={e.id} value={e.id} className="text-ink">
                  {e.nombre} · {new Date(e.fechaInicio).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8fb59e]" />
          </div>
          {eventoSeleccionado && (
            <p className="mt-2 text-[11px] text-[#9fb3a4]">
              {TIPO_EVENTO_LABELS[eventoSeleccionado.tipo]} · {eventoSeleccionado.lugar ?? 'Lugar por confirmar'}
              {asistentes != null && <> · <span className="font-bold text-citrus">{asistentes} asistencias</span></>}
            </p>
          )}

          {/* Visor */}
          <div className="relative mt-4 aspect-[4/3] w-full overflow-hidden rounded-xl bg-black">
            <video ref={videoRef} muted playsInline className="h-full w-full object-cover" aria-label="Vista de cámara" />
            <canvas ref={canvasRef} className="hidden" aria-hidden />

            {camara === 'idle' && (
              <button onClick={() => void iniciarCamara()}
                className="absolute inset-0 grid place-items-center bg-white/5 text-center transition-colors hover:bg-white/10">
                <span>
                  <Camera size={44} className="mx-auto text-citrus" />
                  <span className="mt-3 block text-sm font-bold text-[#e7f1e8]">Tocar para activar la cámara</span>
                </span>
              </button>
            )}
            {camara === 'iniciando' && (
              <div className="absolute inset-0 grid place-items-center bg-black/60"><Loader2 className="animate-spin text-citrus" size={36} /></div>
            )}
            {camara === 'activa' && (
              <>
                {/* Marco de escaneo */}
                <div className="pointer-events-none absolute inset-0 grid place-items-center">
                  <div className="h-44 w-44 rounded-2xl border-4 border-citrus/80 shadow-[0_0_0_1000px_rgba(0,0,0,.35)]" />
                </div>
                <button onClick={detenerCamara}
                  className="absolute bottom-3 right-3 flex items-center gap-2 rounded-lg bg-black/60 px-3 py-2 text-xs font-bold text-white hover:bg-black/80">
                  <Square size={13} /> Detener
                </button>
              </>
            )}
            {camara === 'error' && (
              <div className="absolute inset-0 grid place-items-center bg-black/70 p-6 text-center">
                <div>
                  <XCircle className="mx-auto text-clay" size={36} />
                  <p className="mt-3 text-sm font-semibold text-[#f5c8bc]">{camaraError}</p>
                  <button onClick={() => void iniciarCamara()} className="mt-4 rounded-lg bg-white/10 px-4 py-2 text-xs font-bold hover:bg-white/20">Reintentar</button>
                </div>
              </div>
            )}
          </div>

          {/* Captura manual */}
          <form onSubmit={(e) => { e.preventDefault(); if (manualCode.trim()) { registrarLectura(manualCode); setManualCode(''); } }}
            className="mt-4 flex items-center gap-2">
            <Keyboard size={18} className="shrink-0 text-[#8fb59e]" />
            <input value={manualCode} onChange={(e) => setManualCode(e.target.value)}
              placeholder="…o escribe/pega el código de la credencial"
              aria-label="Código manual"
              className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2.5 font-mono text-xs text-white placeholder-[#7d9184] outline-none focus:border-citrus" />
            <button type="submit" className="shrink-0 rounded-lg bg-citrus px-4 py-2.5 text-xs font-bold text-ink">Registrar</button>
          </form>

          {/* Feedback */}
          {mensaje && (
            <div role="status"
              className={`mt-4 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold ${
                mensaje.tipo === 'ok' ? 'bg-[#16352a] text-[#7ee2b0]'
                : mensaje.tipo === 'error' ? 'bg-[#3a1f1a] text-[#ffb3a3]'
                : 'bg-white/10 text-[#d4e6d7]'}`}>
              {mensaje.tipo === 'ok' ? <CheckCircle2 size={17} /> : mensaje.tipo === 'error' ? <XCircle size={17} /> : <CloudOff size={17} />}
              {mensaje.texto}
            </div>
          )}
        </div>

        {/* ─── Estado y cola ─── */}
        <div className="space-y-4">
          {/* Conectividad */}
          <div className="flex items-center justify-between rounded-2xl border border-[#e2e9df] bg-white p-4 shadow-soft">
            <div className="flex items-center gap-3">
              <div className={`grid h-11 w-11 place-items-center rounded-xl ${isOnline ? 'bg-fern text-moss' : 'bg-[#fff5d9] text-[#a9790a]'}`}>
                {isOnline ? <Cloud size={20} /> : <CloudOff size={20} />}
              </div>
              <div>
                <p className="text-sm font-bold">{isOnline ? 'En línea' : 'Modo offline'}</p>
                <p className="text-[11px] text-[#829087]">{isOnline ? 'Las lecturas se envían al instante.' : 'Las lecturas se guardan en el dispositivo.'}</p>
              </div>
            </div>
            {pending.length > 0 && (
              <button onClick={() => void sincronizar()} disabled={sincronizando || !isOnline}
                className="flex items-center gap-1.5 rounded-lg bg-moss px-3 py-2 text-xs font-bold text-white disabled:opacity-50">
                {sincronizando ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Sincronizar
              </button>
            )}
          </div>

          {/* Cola pendiente */}
          <div className="rounded-2xl border border-[#e2e9df] bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display font-bold"><QrCode size={18} className="text-moss" /> Cola de sincronización</h2>
              {pending.length > 0 && (
                <button onClick={() => { if (window.confirm('¿Descartar las lecturas pendientes? Esta acción no se puede deshacer.')) persistPending([]); }}
                  className="rounded-lg p-2 text-[#c96b4b] hover:bg-[#fdf0ec]" aria-label="Descartar cola">
                  <Trash2 size={17} />
                </button>
              )}
            </div>
            <p className="mt-1 text-xs text-[#829087]">{pending.length} lectura(s) pendiente(s) de sincronizar.</p>
            <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto">
              {pending.length === 0 && <li className="rounded-lg bg-paper p-3 text-center text-xs text-[#829087]">Todo sincronizado 🎉</li>}
              {pending.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-2 rounded-lg border border-[#edf0ea] px-3 py-2 text-xs">
                  <span className="truncate font-mono">{r.credentialCode.slice(0, 18)}…</span>
                  <span className="shrink-0 text-[#829087]">{new Date(r.scannedAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Instrucciones de campo */}
          <div className="rounded-2xl bg-paper p-5 text-xs leading-relaxed text-[#5c6f63]">
            <p className="font-bold uppercase tracking-wide text-[#40544a]">Checklist de campo</p>
            <ol className="mt-2 list-decimal space-y-1 pl-4">
              <li>Selecciona el evento correcto arriba.</li>
              <li>Activa la cámara y apunta al QR de la credencial.</li>
              <li>Si el QR está dañado, usa la captura manual.</li>
              <li>Sin red: sigue escaneando; todo queda en la cola.</li>
              <li>Al terminar, pulsa “Sincronizar” con red disponible.</li>
            </ol>
          </div>
        </div>
      </div>
    </main>
  );
}
