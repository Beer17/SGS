// src/components/layout/nav-links.ts
// Fuente única de navegación (Sidebar de escritorio y menú móvil del Topbar).
import {
  BarChart3, CalendarDays, ClipboardCheck, FileCog, LayoutDashboard,
  Settings, Upload, Users, Wallet, Package, Flag, Tent,
} from 'lucide-react';

export interface NavLink {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}
export interface NavGroup {
  label: string;
  links: NavLink[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Panel',
    links: [{ href: '/', label: 'Resumen', icon: LayoutDashboard }],
  },
  {
    label: 'Scout',
    links: [
      { href: '/censo',      label: 'Censo scout', icon: Users          },
      { href: '/grupos',     label: 'Grupos',      icon: Flag           },
      { href: '/secciones',  label: 'Secciones',   icon: ClipboardCheck },
      { href: '/progresion', label: 'Progresión',  icon: BarChart3      },
    ],
  },
  {
    label: 'Operación',
    links: [
      { href: '/calendario',      label: 'Calendario',       icon: CalendarDays   },
      { href: '/eventos',         label: 'Eventos',          icon: Tent           },
      { href: '/eventos/escaner', label: 'Escáner de campo', icon: ClipboardCheck },
      { href: '/carga',           label: 'Carga de datos',   icon: Upload         },
    ],
  },
  {
    label: 'Administración',
    links: [
      { href: '/finanzas',   label: 'Finanzas y Cuotas', icon: Wallet  },
      { href: '/inventario', label: 'Inventario',        icon: Package },
    ],
  },
];

export const NAV_FOOTER: NavLink[] = [
  { href: '/perfil',        label: 'Mi perfil',        icon: Users    },
  { href: '/configuracion', label: 'Configuración',    icon: Settings },
  { href: '/admin/editor',  label: 'Editor del portal', icon: FileCog },
];
