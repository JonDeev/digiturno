// src/hooks/useRequeuedTurns.ts
import { useEffect, useState } from "react";

export const useRequeuedTurns = (serviceId?: string) => {
  const [requeuedCount, setRequeuedCount] = useState<number>(0);
  const [serviceName, setServiceName] = useState<string>("");
  const [loadingRequeued, setLoading] = useState(true);

  useEffect(() => {
    if (!serviceId) return;

    // Fallback a polling si EventSource no existe
    if (typeof window === "undefined" || typeof (window as any).EventSource === "undefined") {
      const fetchCount = async () => {
        try {
          const res = await fetch(`/api/turns/requeued?serviceId=${serviceId}`);
          const data = await res.json();
          setRequeuedCount(data.count);
          setServiceName(data.name);
        } catch (e) {
          console.error("Polling requeued error", e);
        } finally {
          setLoading(false);
        }
      };
      fetchCount();
      const id = setInterval(fetchCount, 3000);
      return () => clearInterval(id);
    }

    // SSE
    const url = `/api/turns/requeued/stream?serviceId=${encodeURIComponent(serviceId)}`;
    const es = new EventSource(url);

    const onSnapshot = (e: MessageEvent) => {
      const payload = JSON.parse(e.data) as { count: number; name: string };
      setRequeuedCount(payload.count);
      setServiceName(payload.name);
      setLoading(false);
    };

    const onCount = (e: MessageEvent) => {
      const payload = JSON.parse(e.data) as { count: number };
      setRequeuedCount(payload.count);
    };

    const onError = () => {
      // Si falla el stream, hacemos 1 fetch puntual y dejamos que el navegador reconecte
      fetch(`/api/turns/requeued?serviceId=${serviceId}`)
        .then(r => r.json())
        .then(d => {
          setRequeuedCount(d.count);
          if (d.name) setServiceName(d.name);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    };

    es.addEventListener("snapshot", onSnapshot as any);
    es.addEventListener("count", onCount as any);
    es.onerror = onError;

    return () => es.close();
  }, [serviceId]);

  return { requeuedCount, serviceName, loadingRequeued };
};
