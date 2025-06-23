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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 animate-fadeIn">
      <div className="p-8 text-center bg-white rounded-lg shadow-xl">
        <p className="mb-4 text-6xl font-bold text-blue-800">{code}</p>
        <p className="text-4xl text-gray-700">{module}</p>
      </div>
    </div>
  );
}

