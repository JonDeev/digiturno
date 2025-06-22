// src/hooks/useCurrentTurn.ts
import { useEffect, useState, useCallback } from 'react';

export const useCurrentTurn = (moduleId: string | undefined) => {
  const [turn, setTurn] = useState<any>(null);
  const [cargando, setLoading] = useState(true);

  const fetchCurrentTurn = useCallback(async () => {
    if (!moduleId) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/turns/current?moduleId=${moduleId}`);
      const data = await res.json();
      if (res.ok) {
        setTurn(data);
      } else {
        setTurn(null);
      }
    } catch (error) {
      console.error('Error obteniendo turno actual:', error);
    } finally {
      setLoading(false);
    }
  }, [moduleId]);

  useEffect(() => {
    fetchCurrentTurn();
  }, [fetchCurrentTurn]);

  return { turn, cargando, refetch: fetchCurrentTurn };
};
