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
  themeColor: '#2b6a50',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <Providers>
          <PwaRegistration />
          {children}
        </Providers>
      </body>
    </html>
  );
}
