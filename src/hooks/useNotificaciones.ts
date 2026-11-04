'use client';
// src/hooks/useNotificaciones.ts
import { useEffect, useState, useCallback } from 'react';
import type { NotificacionItem } from '@/types';

export function useNotificaciones() {
  const [items, setItems]     = useState<NotificacionItem[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);

  const fetchNotificaciones = useCallback(async () => {
    try {
      const res = await fetch('/api/notificaciones');
      if (!res.ok) return;
      const data = (await res.json()) as { data: NotificacionItem[]; noLeidas: number };
      setItems(data.data);
      setNoLeidas(data.noLeidas);
    } catch {
      // silenciar en offline
    }
  }, []);

  useEffect(() => {
    void fetchNotificaciones();
    const interval = setInterval(() => void fetchNotificaciones(), 60_000);
    return () => clearInterval(interval);
  }, [fetchNotificaciones]);

  async function marcarLeida(id: string) {
    await fetch(`/api/notificaciones/${id}/leer`, { method: 'POST' });
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)));
    setNoLeidas((prev) => Math.max(0, prev - 1));
  }

  return { items, noLeidas, marcarLeida, refetch: fetchNotificaciones };
}

