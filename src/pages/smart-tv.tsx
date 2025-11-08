// src/pages/smart-tv.tsx
import Image from 'next/image';
import TurnModal from '@/components/TurnModal';
import { useEffect, useState } from 'react';
import { useSpeech } from '@/hooks/useSpeech';
import { useLastCalledTurns } from '@/hooks/useLastCalledTurns';
import CalledTurnsList from '@/components/CalledTurnsList';

export default function SmartTVScreen() {
  // 1) Panel Izquierdo: últimos 8 en ATTENDED/ATTENDANCE (ordenados por calledAt desc)
  const { turns: attendedTurns, loading } = useLastCalledTurns({
    limit: 10,
    refreshMs: 5000,
  });

  // 2) Voz + Modal: SOLO turnos en estado CALLED (NO ATTENDANCE)
  const [justCalledTurns, setJustCalledTurns] = useState<any[]>([]);

  useEffect(() => {
    let alive = true;

    const fetchJustCalled = async () => {
      try {
        // Si tu API /api/turns/called ya filtra status = CALLED, con esto basta:
        const res = await fetch('/api/turns/called?limit=8', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (alive) setJustCalledTurns(Array.isArray(data) ? data : (data?.rows ?? []));
      } catch (e) {
        // Silencioso para no romper la TV
      }
    };

    fetchJustCalled();
    const id = setInterval(fetchJustCalled, 5000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  // Hook de voz (anuncia SÓLO lo que está en CALLED)
  const { modalVisible, modalTurn } = useSpeech(justCalledTurns);

  // Marcar este dispositivo como "speech master"
  useEffect(() => {
    localStorage.setItem('speechMaster', 'true');
    return () => {
      localStorage.removeItem('speechMaster');
    };
  }, []);

  return (
    <div className="flex w-screen h-screen font-sans">
      {/* Panel Izquierdo */}
      <div className="flex flex-col w-1/4 p-4 text-gray-900 bg-gray-100">
        {/* Logo */}
        <div className="mb-6 flex items-center justify-center">
          <Image src="/logo.png" alt="Logo" width={120} height={120} />
        </div>

        {/* Lista dinámica: ATTENDED/ATTENDANCE */}
        {loading ? (
          <div className="space-y-2">
            <div className="h-9 rounded bg-gray-300 animate-pulse" />
            <div className="h-9 rounded bg-gray-300 animate-pulse" />
            <div className="h-9 rounded bg-gray-300 animate-pulse" />
          </div>
        ) : (
          <CalledTurnsList turns={attendedTurns} />
        )}
      </div>

      {/* Panel Derecho */}
      <div className="flex items-center justify-center w-3/4 text-2xl text-white bg-black">
        {/* Placeholder para videos */}
        Videos informativos aquí
      </div>

      {/* Modal de anuncio de turno (solo cuando hay CALLED) */}
      {modalVisible && (
        <TurnModal
          visible
          code={modalTurn.code}
          module={modalTurn.module?.name || modalTurn.moduleId}
        />
      )}
    </div>
  );
}
