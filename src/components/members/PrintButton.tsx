'use client';
// src/components/members/PrintButton.tsx
import { Printer } from 'lucide-react';

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex w-fit items-center gap-2 rounded-lg border border-[#dfe7dc] px-4 py-2.5 text-sm font-bold text-[#5c6f63] hover:bg-paper print:hidden"
    >
      <Printer size={17} /> Imprimir / PDF
    </button>
  );
}
