import { useState } from 'react';

export default function TurnoPage() {
  const [loading, setLoading] = useState(false);
  const [turn, setTurn] = useState(null);

  const generarTurno = async () => {
    setLoading(true);
    setTurn(null);

    const res = await fetch('/api/turns/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serviceId: "1" }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      setTurn(data);
      imprimir(data); // llamamos la impresión POS
    } else {
      alert(data.message || 'Error al generar el turno');
    }
  };

  const imprimir = (data: any) => {
    const ventana = window.open('', '', 'width=300,height=200');
    if (!ventana) return;
    ventana.document.write(`
      <pre>
      Turno: ${data.code}
      Servicio: ${data.service.name}
      Fecha: ${new Date().toLocaleString()}
      </pre>
    `);
    ventana.document.close();
    ventana.focus();
    ventana.print();
    ventana.close();
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-white">
      <h1 className="mb-6 text-3xl font-bold text-blue-600">Turnero</h1>
      <button
        onClick={generarTurno}
        className="px-6 py-3 text-lg text-white bg-blue-500 rounded-lg hover:bg-blue-600"
        disabled={loading}
      >
        {loading ? 'Generando...' : 'Reclamar fórmula'}
      </button>
      {turn && (
        <div className="mt-6 font-bold text-center text-green-600">
          Turno generado: {turn.code}
        </div>
      )}
    </div>
  );
}
