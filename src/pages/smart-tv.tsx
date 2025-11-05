import Image from 'next/image';
import TurnModal from '@/components/TurnModal';
import { useState, useEffect } from 'react';
import { useSpeech } from '@/hooks/useSpeech';

export default function SmartTVScreen() {
  const [calledTurns, setCalledTurns] = useState<any[]>([]); // ← Esto debe ser un array
  const { modalVisible, modalTurn } = useSpeech(calledTurns);

  useEffect(() => {
    localStorage.setItem('speechMaster', 'true');
    return () => {
      localStorage.removeItem('speechMaster');
    };
  }, []);


  useEffect(() => {
    const fetchCalledTurns = async () => {
        const res = await fetch('/api/turns/called');
        const data = await res.json();
        setCalledTurns(data); // ahora es un array
    };

    fetchCalledTurns();
    const interval = setInterval(fetchCalledTurns, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex w-screen h-screen font-sans">
      {/* Panel Izquierdo */}
      <div className="flex flex-col w-1/4 p-4 text-gray-900 bg-gray-100">
        {/* Logo */}
        <div className="mb-6">
          <Image src="/logo.png" alt="Logo" width={100} height={100} />
        </div>

        {/* Encabezados */}
        <div className="flex px-2 py-2 font-bold text-white bg-gray-800 rounded">
          <div className="w-1/2 text-center">TURNO</div>
          <div className="w-1/2 text-center">MÓDULO</div>
        </div>

        {/* Lista de turnos */}
        <div className="flex flex-col mt-2 space-y-2">
          {/* Ejemplo estático (luego dinámico) */}
          <div className="flex justify-between px-4 py-2 bg-white rounded shadow">
            <span className="font-semibold">A012</span>
            <span>Módulo 3</span>
          </div>
        </div>
      </div>

      {/* Panel Derecho */}
      <div className="flex items-center justify-center w-3/4 text-2xl text-white bg-black">
        {/* Placeholder para videos */}
        Videos informativos aquí
      </div>
      {/* ⬇️ Aquí va el modal */}
       {modalVisible && (
      <TurnModal
        visible={true}
        code={modalTurn.code}
        module={modalTurn.module?.name || modalTurn.moduleId}
      />
    )}
    </div>
  );
}
