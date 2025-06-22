// src/components/TurnModal.tsx
import React from 'react';

interface TurnModalProps {
  visible: boolean;
  code: string;
  module: string;
}

export default function TurnModal({ visible, code, module }) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="p-10 text-center text-black bg-white rounded-lg shadow-xl">
        <div className="mb-4 text-6xl font-bold">{code}</div>
        <div className="text-4xl">{module}</div>
      </div>
    </div>
  );
}

