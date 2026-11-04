'use client';
// src/components/layout/Sidebar.tsx
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { NAV_GROUPS, NAV_FOOTER } from '@/components/layout/nav-links';
import { useSession } from '@/hooks/useSession';
import { ROLE_LABELS } from '@/lib/labels';

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useSession();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-[#dfe7dc] bg-white px-5 py-6 lg:flex print:hidden">
      {/* Logo */}
      <Link href="/" className="mb-10 flex items-center gap-3 px-2">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-moss text-lg font-bold text-white">S</div>
        <div>
          <div className="font-display text-lg font-bold tracking-tight">SISAS <span className="text-clay">ANSI</span></div>
          <div className="text-[10px] font-bold uppercase tracking-[.18em] text-[#829087]">Portal nacional</div>
        </div>
      </Link>

      {/* Navegación agrupada */}
      <nav className="flex-1 space-y-6 overflow-y-auto">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="mb-1 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-[#a3b0a8]">
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.links.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href} href={href} aria-current={isActive(href) ? 'page' : undefined}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                    isActive(href)
                      ? 'bg-fern text-moss'
                      : 'text-[#6b7b72] hover:bg-paper hover:text-ink'
                  }`}
                >
                  <Icon size={18} strokeWidth={1.8} />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Sesión */}
      <div className="border-t border-[#edf0ea] pt-4">
        <div className="mb-2 flex items-center gap-3 rounded-xl bg-paper px-3 py-2.5">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-moss text-xs font-bold text-white">
            {user?.email?.slice(0, 2).toUpperCase() ?? '??'}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-bold">{user?.email ?? '…'}</p>
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#829087]">
              {user ? ROLE_LABELS[user.role] : ''}
            </p>
          </div>
        </div>
        {NAV_FOOTER.map(({ href, label, icon: Icon }) => (
          <Link
            key={href} href={href}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
              isActive(href) ? 'bg-fern text-moss' : 'text-[#6b7b72] hover:bg-paper'
            }`}
          >
            <Icon size={18} strokeWidth={1.8} />{label}
          </Link>
        ))}
        <button
          onClick={() => void logout()}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-clay transition-colors hover:bg-[#fdf0ec]"
        >
          <LogOut size={18} strokeWidth={1.8} />Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
