import './globals.css';
import type { Metadata, Viewport } from 'next';
import { PwaRegistration } from '@/components/PwaRegistration';
import { Providers } from '@/app/providers';

export const metadata: Metadata = {
  title: 'SISAS ANSI | Sistema de Información Scout',
  description:
    'Plataforma de administración para la Asociación Nacional de Scouts Independientes: censo, finanzas, eventos, progresión y credenciales verificables.',
  manifest: '/manifest.json',
  icons: {
    icon: [{ url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#2b6a50' },
    { media: '(prefers-color-scheme: dark)', color: '#101a15' },
  ],
};

// Aplica el tema guardado ANTES del primer pintado (evita "flash" de tema incorrecto)
const themeInit = `(function(){try{var t=localStorage.getItem('sisas-theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <Providers>
          <PwaRegistration />
          {children}
        </Providers>
      </body>
    </html>
  );
}
