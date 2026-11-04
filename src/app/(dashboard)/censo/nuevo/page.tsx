// src/app/(dashboard)/censo/nuevo/page.tsx
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { MemberForm } from '@/components/members/MemberForm';

export default function NuevoMiembroPage() {
  return (
    <main className="p-5 lg:p-8">
      <Link href="/censo" className="mb-6 inline-flex items-center gap-2 text-xs font-bold text-moss">
        <ArrowLeft size={14} /> Volver al censo
      </Link>
      <p className="text-xs font-bold uppercase tracking-[.2em] text-clay">Administración</p>
      <h1 className="mt-2 font-display text-3xl font-bold">Registrar miembro</h1>
      <p className="mt-2 mb-8 max-w-xl text-sm text-[#718078]">
        Alta de jóvenes y adultos en el censo. El registro queda como PENDIENTE hasta que jefatura valide la documentación.
      </p>
      <MemberForm mode="create" />
    </main>
  );
}
