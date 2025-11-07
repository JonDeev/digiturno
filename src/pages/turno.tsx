// pages/turno.tsx (o donde tengas tu vista)
import { useState } from 'react'
import { printTurnE200i } from '@/lib/posPrint'  // ⬅️ importa la función de impresión

export default function TurnoPage() {
  const [loading, setLoading] = useState(false)
  const [turn, setTurn] = useState<any>(null)

  const generarTurno = async () => {
    try {
      setLoading(true)
      setTurn(null)

      const res = await fetch('/api/turns/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId: '1' }), // usa tu serviceId/serviceCode real
      })

      const data = await res.json()
      setLoading(false)

      if (!res.ok) {
        alert(data.message || 'Error al generar el turno')
        return
      }

      setTurn(data)

      // ⬇️ EXACTAMENTE AQUÍ: imprime directo en la E200i
      await printTurnE200i(data)

    } catch (e) {
      setLoading(false)
      console.error(e)
      alert('Error inesperado')
    }
  }

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
  )
}
