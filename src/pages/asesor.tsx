import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentTurn } from '@/hooks/useCurrentTurn';
import { usePendingTurns } from '@/hooks/usePendingTurns';

export default function AsesorPanel() {
  useAuth();
  const user = useUser();
  const { turn, cargando, refetch } = useCurrentTurn(user?.moduleId);
  const { pendingTurns, serviceName } = usePendingTurns("1");
  const router = useRouter();

  const [callingNext, setCallingNext] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showMarkAttended, setShowMarkAttended] = useState(false);
  const [repeating, setRepeating] = useState(false); // <-- NUEVO

  const handleLogout = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
    }
    localStorage.removeItem('token');
    router.push('/login');
  };

  // <-- NUEVO: repetir llamado con el endpoint correcto
  const handleRepeatCall = async () => {
    const token = localStorage.getItem('token');
    if (!token || !turn) return;
    try {
      setRepeating(true);
      const res = await fetch('/api/turns/repeat-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ turnId: turn.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'No se pudo repetir el llamado');
        return;
      }
      await refetch(); // actualiza calledCount/calledAt en UI
    } catch (err) {
      console.error('Error al repetir llamado:', err);
      alert('Error al repetir llamado');
    } finally {
      setRepeating(false);
    }
  };

  const updateTurnStatus = async (status: string) => {
    const token = localStorage.getItem('token');
    if (!token || !turn) return;

    // <-- CAMBIO: si es "CALLED", usa repeat-call (no update-status)
    if (status === 'CALLED') {
      await handleRepeatCall();
      return;
    }

    try {
      await fetch('/api/turns/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ turnId: turn.id, status }),
      });
      await refetch();

      if (status === 'REQUEUED' || status === 'ATTENDED') {
        setCallingNext(false);
        setShowActions(false);
        setShowMarkAttended(false);
      }

      if (status === 'ATTENDANCE') {
        setShowActions(false);
        setShowMarkAttended(true);
      }
    } catch (err) {
      console.error('Error al actualizar estado del turno:', err);
    }
  };

  const handleCallNextTurn = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('/api/turns/call-next', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ moduleId: user?.moduleId }),
      });

      const data = await res.json();
      if (res.ok) {
        console.log('Turno llamado:', data);
        setCallingNext(true);
        setShowActions(true);
        await refetch();
      } else {
        alert(data.message || 'No se pudo llamar el siguiente turno');
      }
    } catch (err) {
      console.error('Error al llamar siguiente turno:', err);
    }
  };

  return (
    <div className="p-6">
      {user ? (
        <div className="flex flex-col min-h-screen">
          <header className="flex items-center justify-between px-6 py-4 text-white bg-blue-600">
            <div className="text-xl font-semibold">Turnero Salud</div>
            <div>
              <span className="mr-4">
                Asesor: <strong>{user.name}</strong>
              </span>
              <span className="mr-4">
                Módulo: <strong>{user.moduleId}</strong>
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-1 bg-red-500 rounded hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          </header>

          <div className="flex flex-1">
            <aside className="w-full p-4 bg-gray-100 md:w-1/3 lg:w-1/4">
              <div>
                <h3 className="text-lg font-bold">Turno actual:</h3>
                {cargando ? (
                  <p>Cargando...</p>
                ) : turn ? (
                  <p className="text-2xl">{turn.service.name}</p>
                ) : (
                  <p>No hay turno en curso</p>
                )}
              </div>
              <div className="p-4 mb-4 text-center bg-white rounded shadow">
                <span className="text-3xl font-bold text-blue-600">
                  {turn ? turn.code : '000'}
                </span>
              </div>

              <div className="flex flex-col space-y-2">
                {showActions && (
                  <>
                    <button
                      onClick={() => updateTurnStatus('REQUEUED')}
                      className="py-2 text-white bg-yellow-500 rounded hover:bg-yellow-600"
                    >
                      Poner en cola
                    </button>
                    <button
                      onClick={() => updateTurnStatus('ATTENDANCE')}
                      className="py-2 text-white bg-green-600 rounded hover:bg-green-700"
                    >
                      Atender
                    </button>
                    <button
                      onClick={handleRepeatCall} // <-- CAMBIO
                      disabled={repeating}
                      className={`py-2 text-white rounded ${
                        repeating ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {repeating ? 'Repitiendo...' : 'Repetir llamado'}
                    </button>
                  </>
                )}
                {showMarkAttended && (
                  <button
                    onClick={() => updateTurnStatus('ATTENDED')}
                    className="py-2 text-white bg-green-600 rounded hover:bg-green-700"
                  >
                    Marcar atendido
                  </button>
                )}
              </div>
            </aside>

            <main className="flex-1 p-6 bg-white">
              <div>
                <h2 className="text-xl font-bold">
                  {serviceName}: {pendingTurns} en espera
                </h2>
              </div>
              <button
                onClick={handleCallNextTurn}
                disabled={callingNext}
                className={`px-6 py-3 mb-6 text-white rounded ${
                  callingNext ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                Llamar siguiente turno
              </button>
            </main>
          </div>
        </div>
      ) : (
        <p>Cargando información del usuario...</p>
      )}
    </div>
  );
}
