// src/hooks/usePendingTurns.ts
import { useEffect, useState } from 'react';

export const usePendingTurns = (serviceId?: string) => {
  const [pendingTurns, setPendingTurns] = useState<number>(0);
  const [serviceName, setServiceName] = useState<string>('');
  const [loadingPending, setLoading] = useState(true);

  const fetchPendingTurns = async () => {
    if (!serviceId) return;

    try {
      const res = await fetch(`/api/turns/pending?serviceId=${serviceId}`);
      const data = await res.json();
      setPendingTurns(data.count);
      setServiceName(data.name);
    } catch (err) {
      console.error('Error al cargar turnos pendientes', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingTurns();
    const interval = setInterval(fetchPendingTurns, 1000); // actualiza cada 5s
    return () => clearInterval(interval);
  }, [serviceId]);

  return { pendingTurns, serviceName, loadingPending };
};
