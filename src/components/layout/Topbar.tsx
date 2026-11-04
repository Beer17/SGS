'use client';
// src/components/layout/Topbar.tsx
import { Bell, Search, Menu, LogOut, CheckCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useNotificaciones } from '@/hooks/useNotificaciones';
import { useSession } from '@/hooks/useSession';
import { useState } from 'react';
import { NAV_GROUPS, NAV_FOOTER } from '@/components/layout/nav-links';
import { ROLE_LABELS } from '@/lib/labels';

export function Topbar() {
  const router = useRouter();
  const { noLeidas, items, marcarLeida, refetch } = useNotificaciones();
  const { user, logout } = useSession();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showMenu, setShowMenu]     = useState(false);
  const [query, setQuery]           = useState('');

  function buscar(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/censo?q=${encodeURIComponent(q)}` : '/censo');
  }

  async function abrirNotificacion(id: string, accionUrl?: string) {
    await marcarLeida(id);
    setShowNotifs(false);
    if (accionUrl) router.push(accionUrl);
  }

  return (
    <header className="relative z-30 flex h-20 items-center justify-between border-b border-line bg-surface/80 px-5 backdrop-blur lg:px-9">
      <div className="flex items-center gap-3">
        {/* Menú móvil */}
        <button
          onClick={() => setShowMenu((v) => !v)}
          className="rounded-lg p-2 text-muted lg:hidden"
          aria-label="Abrir menú" aria-expanded={showMenu}
        >
          <Menu size={20} />
        </button>

        {/* Buscador global (censo) */}
        <form onSubmit={buscar} className="relative hidden sm:block" role="search">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-64 rounded-lg border-0 bg-paper py-2.5 pl-10 pr-3 text-sm outline-none ring-moss/20 focus:ring-2"
            placeholder="Buscar miembro, grupo…"
            aria-label="Buscar en el censo"
          />
        </form>
      </div>

      {/* Panel móvil */}
      {showMenu && (
        <div className="absolute left-0 right-0 top-full z-40 max-h-[70vh] overflow-y-auto border-b border-line bg-surface p-4 shadow-soft lg:hidden">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-3">
              <p className="px-2 text-[10px] font-bold uppercase tracking-[.18em] text-faint">{group.label}</p>
              {group.links.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} onClick={() => setShowMenu(false)}
                  className="flex items-center gap-3 rounded-xl px-2 py-2.5 text-sm font-semibold text-muted hover:bg-paper">
                  <Icon size={18} /> {label}
                </Link>
              ))}
            </div>
          ))}
          {NAV_FOOTER.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} onClick={() => setShowMenu(false)}
              className="flex items-center gap-3 rounded-xl px-2 py-2.5 text-sm font-semibold text-muted hover:bg-paper">
              <Icon size={18} /> {label}
            </Link>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4">
        {/* Campana de notificaciones */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs((v) => !v)}
            className="relative rounded-lg p-2 text-muted"
            aria-label={`Notificaciones${noLeidas > 0 ? ` (${noLeidas} sin leer)` : ''}`}
          >
            <Bell size={19} />
            {noLeidas > 0 && (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-clay text-[9px] font-bold text-white">
                {noLeidas > 9 ? '9+' : noLeidas}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border border-line bg-surface shadow-soft">
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <span className="font-display font-bold">Notificaciones</span>
                {noLeidas > 0 && (
                  <button
                    onClick={() => { items.filter((n) => !n.leida).forEach((n) => void marcarLeida(n.id)); void refetch(); }}
                    className="flex items-center gap-1 text-[11px] font-bold text-moss"
                    title="Marcar todas como leídas"
                  >
                    <CheckCheck size={13} /> Marcar leídas
                  </button>
                )}
              </div>
              <ul className="max-h-80 overflow-y-auto">
                {items.length === 0 && (
                  <li className="p-4 text-center text-sm text-faint">Sin notificaciones</li>
                )}
                {items.map((n) => (
                  <li key={n.id}>
                    <button
                      onClick={() => void abrirNotificacion(n.id, n.accionUrl)}
                      className={`block w-full border-b border-line px-4 py-3 text-left text-sm transition-colors hover:bg-paper ${!n.leida ? 'bg-fern/50' : ''}`}
                    >
                      <div className="flex items-center gap-2 font-bold">
                        {!n.leida && <span className="h-2 w-2 rounded-full bg-clay" aria-hidden />}
                        {n.titulo}
                      </div>
                      <div className="mt-0.5 text-muted">{n.mensaje}</div>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="border-t border-line p-2">
                <Link href="/notificaciones" onClick={() => setShowNotifs(false)}
                  className="block rounded-lg px-3 py-2 text-center text-xs font-bold text-moss hover:bg-paper">
                  Ver todas
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="hidden h-7 w-px bg-line sm:block" />

        <div className="text-right">
          <div className="max-w-44 truncate text-sm font-bold">{user?.email ?? 'Usuario'}</div>
          <div className="text-xs font-semibold text-faint">{user ? ROLE_LABELS[user.role] : ''}</div>
        </div>

        <button onClick={() => void logout()}
          title="Cerrar sesión" aria-label="Cerrar sesión"
          className="rounded-lg p-2 text-muted hover:bg-paper hover:text-clay">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
