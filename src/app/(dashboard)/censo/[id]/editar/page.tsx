// src/app/(dashboard)/censo/[id]/editar/page.tsx
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { MemberForm } from '@/components/members/MemberForm';

export default function EditarMiembroPage({ params }: { params: { id: string } }) {
  return (
    <main className="p-5 lg:p-8">
      <Link href={`/ficha/${params.id}`} className="mb-6 inline-flex items-center gap-2 text-xs font-bold text-moss">
        <ArrowLeft size={14} /> Volver a la ficha
      </Link>
      <p className="text-xs font-bold uppercase tracking-[.2em] text-clay">Administración</p>
      <h1 className="mt-2 font-display text-3xl font-bold">Editar miembro</h1>
      <p className="mt-2 mb-8 max-w-xl text-sm text-[#718078]">
        Actualiza los datos del expediente. Los cambios quedan registrados en la bitácora.
      </p>
      <MemberForm mode="edit" scoutId={params.id} />
    </main>
  );
}
