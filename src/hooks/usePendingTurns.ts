import { useEffect, useState } from "react";

export const usePendingTurns = (serviceId?: string) => {
  const [pendingTurns, setPendingTurns] = useState<number>(0);
  const [serviceName, setServiceName] = useState<string>("");
  const [loadingPending, setLoading] = useState(true);

  useEffect(() => {
    if (!serviceId) return;

    // Fallback a polling si EventSource no existe
    if (typeof window === "undefined" || typeof (window as any).EventSource === "undefined") {
      const fetchCount = async () => {
        try {
          const res = await fetch(`/api/turns/pending?serviceId=${serviceId}`);
          const data = await res.json();
          setPendingTurns(data.count);
          setServiceName(data.name);
        } catch (e) {
          console.error("Polling pending error", e);
        } finally {
          setLoading(false);
        }
      };
      fetchCount();
      const id = setInterval(fetchCount, 3000);
      return () => clearInterval(id);
    }

    // SSE
    const url = `/api/turns/pending/stream?serviceId=${encodeURIComponent(serviceId)}`;
    const es = new EventSource(url);

    const onSnapshot = (e: MessageEvent) => {
      const payload = JSON.parse(e.data) as { count: number; name: string };
      setPendingTurns(payload.count);
      setServiceName(payload.name);
      setLoading(false);
    };
    const onCount = (e: MessageEvent) => {
      const payload = JSON.parse(e.data) as { count: number };
      setPendingTurns(payload.count);
    };
    const onError = (_e: any) => {
      // Si falla el stream, hacemos 1 fetch puntual y dejamos que el navegador reconecte
      fetch(`/api/turns/pending?serviceId=${serviceId}`)
        .then(r => r.json())
        .then(d => {
          setPendingTurns(d.count);
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

  return { pendingTurns, serviceName, loadingPending };
};
