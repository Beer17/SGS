'use client';
// src/app/(dashboard)/carga/page.tsx — Importación masiva de censo desde CSV
import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2, Download, FileSpreadsheet, FileText, Info, Loader2, UploadCloud, XCircle,
} from 'lucide-react';

interface ImportResult {
  creados: number;
  errores: Array<{ fila: number; motivo: string }>;
}

export default function CargaPage() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [csvText, setCsvText]   = useState('');
  const [preview, setPreview]   = useState<string[][]>([]);
  const [totalFilas, setTotalFilas] = useState(0);
  const [loading, setLoading]   = useState(false);
  const [resultado, setResultado] = useState<ImportResult | null>(null);
  const [error, setError]       = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const procesarArchivo = useCallback((file: File) => {
    setError('');
    setResultado(null);
    if (!/\.csv$/i.test(file.name)) { setError('Solo se aceptan archivos .csv (exporta tu Excel como “CSV UTF-8”).'); return; }
    if (file.size > 1_000_000) { setError('El archivo supera 1 MB. Divide la importación en partes.'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      setCsvText(text);
      setFileName(file.name);
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      setTotalFilas(Math.max(0, lines.length - 1));
      setPreview(lines.slice(0, 6).map((l) => l.split(/[,;]/).slice(0, 6)));
    };
    reader.readAsText(file, 'utf-8');
  }, []);

  async function importar() {
    setLoading(true);
    setError('');
    setResultado(null);
    try {
      const res = await fetch('/api/miembros/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: csvText }),
      });
      const d = (await res.json()) as ImportResult & { error?: string };
      if (!res.ok) { setError(d.error ?? 'No se pudo importar.'); return; }
      setResultado({ creados: d.creados, errores: d.errores ?? [] });
    } catch {
      setError('Error de conexión al importar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-6xl p-5 lg:p-8">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[.2em] text-clay">Importación</p>
        <h1 className="mt-2 font-display text-3xl font-bold">Carga de datos</h1>
        <p className="mt-1 max-w-2xl text-sm text-[#718078]">
          Importa el censo completo desde un CSV. Los registros entran como <strong>PENDIENTE</strong> y jefatura valida la documentación.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
        {/* ─── Zona de carga ─── */}
        <section>
          <label
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) procesarArchivo(f); }}
            className={`block cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
              dragging ? 'border-moss bg-fern' : 'border-[#bfd0c0] bg-white hover:border-moss'
            }`}
          >
            <input ref={inputRef} type="file" accept=".csv" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) procesarArchivo(f); }} />
            <UploadCloud className="mx-auto mb-4 text-moss" size={40} />
            <p className="font-display text-xl font-bold">Arrastra tu CSV aquí</p>
            <p className="mt-1 text-sm text-[#718078]">o haz clic para seleccionarlo · máx. 1 MB · 500 filas</p>
          </label>

          {error && <div role="alert" className="mt-3 rounded-lg bg-[#fdecea] px-4 py-3 text-sm font-semibold text-clay">{error}</div>}

          {fileName && (
            <div className="mt-4 rounded-2xl border border-[#e2e9df] bg-white p-4 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <FileSpreadsheet className="shrink-0 text-moss" size={20} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{fileName}</p>
                    <p className="text-xs text-[#829087]">{totalFilas} fila(s) de datos</p>
                  </div>
                </div>
                <button onClick={() => void importar()} disabled={loading || totalFilas === 0}
                  className="flex shrink-0 items-center gap-2 rounded-lg bg-moss px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">
                  {loading && <Loader2 className="animate-spin" size={16} />} Importar censo
                </button>
              </div>

              {preview.length > 0 && (
                <div className="mt-3 overflow-x-auto rounded-lg border border-[#edf0ea]">
                  <table className="w-full min-w-[520px] text-[11px]">
                    <tbody>
                      {preview.map((row, i) => (
                        <tr key={i} className={i === 0 ? 'bg-paper font-bold' : 'odd:bg-paper/50'}>
                          {row.map((cell, j) => <td key={j} className="border-b border-[#f0f4ef] px-2 py-1.5">{cell}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Resultado */}
          {resultado && (
            <div className="mt-4 rounded-2xl border border-[#e2e9df] bg-white p-5 shadow-soft">
              <div className="flex items-center gap-3">
                {resultado.errores.length === 0
                  ? <CheckCircle2 className="text-moss" size={26} />
                  : <XCircle className="text-clay" size={26} />}
                <div>
                  <p className="font-display text-lg font-bold">{resultado.creados} miembro(s) importado(s)</p>
                  <p className="text-xs text-[#829087]">{resultado.errores.length} error(es) · quedaron como PENDIENTE</p>
                </div>
              </div>
              {resultado.errores.length > 0 && (
                <div className="mt-3 max-h-48 overflow-y-auto rounded-lg bg-[#fdf6f3] p-3 text-xs">
                  <p className="font-bold text-clay">Filas con error:</p>
                  <ul className="mt-1 list-inside list-disc text-[#7a4a3a]">
                    {resultado.errores.map((e) => <li key={e.fila}><span className="font-mono">Fila {e.fila}:</span> {e.motivo}</li>)}
                  </ul>
                </div>
              )}
              <Link href="/censo?estatus=PENDIENTE" className="mt-3 inline-block text-xs font-bold text-moss">
                Revisar pendientes en el censo →
              </Link>
            </div>
          )}
        </section>

        {/* ─── Instrucciones ─── */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-[#e2e9df] bg-white p-5 shadow-soft">
            <h2 className="font-display font-bold">Cómo preparar tu CSV</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm text-[#5c6f63]">
              <li>Descarga la plantilla y no cambies los encabezados.</li>
              <li><code className="rounded bg-paper px-1">seccion</code>: MANADA, TROPA, COMUNIDAD, CLAN o JEFATURA.</li>
              <li><code className="rounded bg-paper px-1">grupo</code>: número del grupo (ej. 12).</li>
              <li><code className="rounded bg-paper px-1">provincia</code>: nombre exacto (Querétaro, Puebla, Jalisco…).</li>
              <li><code className="rounded bg-paper px-1">fecha_nacimiento</code>: AAAA-MM-DD.</li>
              <li>CURP opcional; si la incluyes debe tener 18 caracteres.</li>
            </ol>
            <a href="/api/miembros/import/plantilla"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-moss py-3 text-sm font-bold text-moss hover:bg-fern">
              <Download size={17} /> Descargar plantilla CSV
            </a>
          </div>

          <div className="rounded-2xl border border-[#e8e0f2] bg-[#faf8ff] p-5 text-sm text-[#4a4470]">
            <p className="flex items-center gap-2 font-bold"><Info size={16} /> ¿Y los expedientes en PDF?</p>
            <p className="mt-1.5 text-xs leading-relaxed">
              Las fichas médicas y responsivas se capturan por miembro en su <Link href="/censo" className="font-bold underline">expediente</Link>. La carga masiva de documentos (PDF/JPG) llegará en una próxima iteración.
            </p>
          </div>

          <div className="rounded-2xl bg-paper p-5 text-xs leading-relaxed text-[#5c6f63]">
            <p className="flex items-center gap-2 font-bold uppercase tracking-wide text-[#40544a]"><FileText size={14} /> Reglas de importación</p>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li>Nada se sobrescribe: cada fila crea un miembro nuevo.</li>
              <li>Los importados entran como PENDIENTE hasta validar documentos.</li>
              <li>CURP duplicada → la fila se rechaza; el resto continúa.</li>
              <li>Grupos o provincias inexistentes → la fila se rechaza con detalle.</li>
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}
