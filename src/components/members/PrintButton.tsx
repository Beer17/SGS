'use client';
// src/components/members/PrintButton.tsx
import { Printer } from 'lucide-react';

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex w-fit items-center gap-2 rounded-lg border border-linestrong px-4 py-2.5 text-sm font-bold text-muted hover:bg-paper print:hidden"
    >
      <Printer size={17} /> Imprimir / PDF
    </button>
  );
}
