// src/hooks/useLastCalledTurns.ts
import { useEffect, useState } from 'react';

export type LastCalledTurn = {
  id: string;
  code: string;
  moduleId?: string | null;
  module?: { id: string; name: string } | null;
  calledAt?: string | null;
};

function normalize(x: any): LastCalledTurn {
  return {
    id: x.id ?? `${x.code}-${x.moduleId ?? ''}-${x.calledAt ?? ''}`,
    code: x.code ?? x.turn?.code ?? x.numero ?? x.ticket ?? '',
    moduleId: x.moduleId ?? x.module_id ?? x.moduloId ?? null,
    module:
      x.module ??
      (x.moduleName ? { id: x.moduleId ?? '', name: x.moduleName } : null),
    calledAt: x.calledAt ?? x.called_at ?? null,
  };
}

type Options = { limit?: number; refreshMs?: number; serviceId?: string };

export function useLastCalledTurns({ limit = 10, refreshMs = 5000, serviceId }: Options = {}) {
  const [turns, setTurns] = useState<LastCalledTurn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        const params = new URLSearchParams();
        if (Number.isFinite(limit)) params.set('limit', String(limit));
        if (serviceId) params.set('serviceId', serviceId);

        const url = `/api/turns/last-called${params.toString() ? `?${params.toString()}` : ''}`;

        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const arr = Array.isArray(data) ? data : (data?.rows ?? []);
        if (alive) {
          setTurns(arr.map(normalize));
          setError(null);
          setLoading(false);
        }
      } catch (e: any) {
        if (alive) {
          setError(e?.message ?? 'Error');
          setLoading(false);
        }
      }
    };

    load();
    const id = setInterval(load, refreshMs);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [limit, refreshMs, serviceId]);

  return { turns, loading, error };
}
