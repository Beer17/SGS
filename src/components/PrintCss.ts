// src/components/PrintCss.ts
// CSS para impresión limpio (expediente / listas). Se inyecta con <style>.
export const PRINT_CSS = `
@media print {
  body { background: #fff !important; }
  aside, header, nav, .print\\:hidden { display: none !important; }
  main { max-width: 100% !important; padding: 0 !important; }
  section, div { box-shadow: none !important; }
  .shadow-soft { box-shadow: none !important; }
  a { color: inherit !important; text-decoration: none !important; }
  @page { margin: 16mm 14mm; }
}
`;
