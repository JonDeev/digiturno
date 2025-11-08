// src/components/CalledTurnsList.tsx
import React from 'react';
import type { LastCalledTurn } from '@/hooks/useLastCalledTurns';

type Props = {
  turns: LastCalledTurn[];
  className?: string;
};

export default function CalledTurnsList({ turns, className }: Props) {
  return (
    <div className={className}>
      {/* Encabezados */}
      <div className="flex px-2 py-2 font-bold text-white bg-gray-800 rounded">
        <div className="w-1/2 text-center">TURNO</div>
        <div className="w-1/2 text-center">MÓDULO</div>
      </div>

      {/* Lista */}
      <div className="flex flex-col mt-2 space-y-2">
        {turns.length === 0 ? (
          <div className="px-4 py-3 text-center bg-white rounded shadow">Sin datos</div>
        ) : (
          turns.map((t) => (
            <div key={t.id} className="flex justify-between px-4 py-2 bg-white rounded shadow">
              <span className="font-semibold">{t.code}</span>
              <span>{t.module?.name ?? t.moduleId ?? '—'}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
