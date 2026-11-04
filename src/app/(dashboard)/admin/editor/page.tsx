'use client';

import { useState } from 'react';
import { Eye, FileText, Image, LayoutTemplate, Save, ShieldCheck } from 'lucide-react';
import { AdminOnly } from '@/components/AdminOnly';

const contentTypes = [
  { label: 'Páginas', icon: FileText },
  { label: 'Plantillas', icon: LayoutTemplate },
  { label: 'Medios', icon: Image },
];

export default function PortalEditorPage() {
  const [saved, setSaved] = useState(false);

  return (
    <AdminOnly>
      <main className="max-w-6xl p-5 lg:p-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.2em] text-clay">Administración avanzada</p>
            <h1 className="mt-2 font-display text-3xl font-bold">Editor del portal</h1>
            <p className="mt-2 text-sm text-[#718078]">Gestiona páginas, avisos y contenido institucional como en un CMS.</p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 rounded-lg border border-[#dfe7dc] bg-white px-4 py-2.5 text-sm font-bold"><Eye size={16} />Vista previa</button>
            <button onClick={() => setSaved(true)} className="flex items-center gap-2 rounded-lg bg-moss px-4 py-2.5 text-sm font-bold text-white"><Save size={16} />{saved ? 'Publicado' : 'Guardar cambios'}</button>
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-[240px_1fr_260px]">
          <aside className="rounded-2xl border border-[#e2e9df] bg-white p-4 shadow-soft">
            <div className="mb-4 text-xs font-bold uppercase tracking-wider text-[#829087]">Contenido</div>
            {contentTypes.map(({ label, icon: Icon }, index) => <button key={label} className={`flex w-full items-center gap-3 rounded-lg p-3 text-left text-sm font-bold ${index === 0 ? 'bg-fern text-moss' : 'text-[#718078]'}`}><Icon size={17} />{label}</button>)}
          </aside>
          <section className="rounded-2xl border border-[#e2e9df] bg-white p-6 shadow-soft">
            <div className="mb-6 flex items-center justify-between"><div><div className="text-xs font-bold uppercase tracking-wider text-clay">Página de inicio</div><h2 className="mt-1 font-display text-xl font-bold">Contenido principal</h2></div><span className="flex items-center gap-1 text-xs font-bold text-moss"><ShieldCheck size={15} />Solo ADMIN</span></div>
            <label className="block text-sm font-bold">Título<input defaultValue="Asociación Nacional de Scouts Independientes" className="mt-2 w-full rounded-lg border border-[#dfe7dc] p-3 text-sm outline-none focus:border-moss" /></label>
            <label className="mt-5 block text-sm font-bold">Descripción<textarea defaultValue="Construimos ciudadanía, liderazgo y comunidad a través del escultismo." rows={5} className="mt-2 w-full resize-none rounded-lg border border-[#dfe7dc] p-3 text-sm outline-none focus:border-moss" /></label>
            <label className="mt-5 block text-sm font-bold">Aviso destacado<input defaultValue="Inscripciones abiertas para el Campamento de Verano 2026" className="mt-2 w-full rounded-lg border border-[#dfe7dc] p-3 text-sm outline-none focus:border-moss" /></label>
          </section>
          <aside className="rounded-2xl border border-[#e2e9df] bg-white p-5 shadow-soft"><div className="text-xs font-bold uppercase tracking-wider text-[#829087]">Publicación</div><div className="mt-5 rounded-lg bg-fern p-4"><div className="text-sm font-bold text-moss">Estado: publicado</div><div className="mt-1 text-xs text-[#718078]">Última edición hoy, 09:42</div></div><div className="mt-6 text-sm font-bold">Visibilidad</div><select className="mt-2 w-full rounded-lg border border-[#dfe7dc] bg-white p-3 text-sm"><option>Público</option><option>Solo usuarios</option></select><button className="mt-6 w-full rounded-lg border border-[#dfe7dc] py-3 text-sm font-bold text-[#718078]">Ver historial</button></aside>
        </div>
      </main>
    </AdminOnly>
  );
}
