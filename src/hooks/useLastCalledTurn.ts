import { useEffect, useState } from 'react';

export function useLastCalledTurn(serviceId: string | undefined) {
  const [lastTurn, setLastTurn] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!serviceId) return;

    let intervalId: NodeJS.Timeout;

    const fetchLastTurn = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/turns/last-called?serviceId=${serviceId}`);
        const data = await res.json();
        setLastTurn(data);
      } catch (error) {
        console.error('Error al obtener el último turno:', error);
      } finally {
        setLoading(false);
      }
    };

    // Llamada inicial
    fetchLastTurn();
    

    // Polling cada 5 segundos
    intervalId = setInterval(fetchLastTurn, 15000);

    return () => clearInterval(intervalId); // Limpiar al desmontar
  }, [serviceId]);

  return { lastTurn, loading };
}
