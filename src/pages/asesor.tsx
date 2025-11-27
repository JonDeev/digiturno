import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentTurn } from '@/hooks/useCurrentTurn';
import { usePendingTurns } from '@/hooks/usePendingTurns';
import { useRequeuedTurns } from '@/hooks/useRequeuedTurns'; // ⬅️ NUEVO

export default function AsesorPanel() {
  useAuth();
  const user = useUser();
  const { turn, cargando, refetch } = useCurrentTurn(user?.moduleId);
  const { pendingTurns, serviceName } = usePendingTurns("1");
  const { requeuedCount } = useRequeuedTurns("1"); // ⬅️ NUEVO
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
    <div className="min-h-screen bg-slate-100">
      {user ? (
        <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-6">
          {/* HEADER */}
          <header className="rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-4 text-white shadow-lg">
            <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-sky-100">
                  Panel de asesor
                </p>
                <h1 className="text-2xl font-semibold leading-tight md:text-3xl">
                  Turnox
                </h1>
                <p className="text-sm text-sky-100">
                  Gestión de turnos en tiempo real para su módulo.
                </p>
              </div>

              <div className="flex flex-col items-end gap-1 text-sm md:text-base">
                <div className="flex flex-wrap items-center justify-end gap-3">
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium md:text-sm">
                    Asesor:{' '}
                    <span className="font-semibold text-white">
                      {user.name}
                    </span>
                  </span>
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium md:text-sm">
                    Módulo:{' '}
                    <span className="font-semibold text-white">
                      {user.moduleId}
                    </span>
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="mt-2 rounded-full bg-red-500 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide shadow-md transition hover:bg-red-600 md:text-sm"
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          </header>

          {/* CONTENIDO PRINCIPAL */}
          <div className="flex flex-1 flex-col gap-6 md:flex-row">
            {/* COLUMNA IZQUIERDA: TURNO ACTUAL + ACCIONES */}
            <aside className="md:w-1/3 lg:w-1/4 space-y-4">
              {/* Tarjeta turno actual */}
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Turno actual
                </p>

                {cargando ? (
                  <p className="mt-2 text-sm text-slate-500">Cargando...</p>
                ) : turn ? (
                  <>
                    <p className="mt-1 text-sm font-medium text-slate-600">
                      {turn.service.name}
                    </p>
                    <div className="mt-4 flex items-baseline justify-center">
                      <span className="text-[48px] font-extrabold leading-none text-blue-600 md:text-[56px]">
                        {turn.code}
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">
                    No hay turno en curso.
                  </p>
                )}
              </div>

              {/* Acciones sobre turno */}
              <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Acciones
                </p>
                <div className="flex flex-col gap-2">
                  {showActions && (
                    <>
                      <button
                        onClick={() => updateTurnStatus('REQUEUED')}
                        className="w-full rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-500"
                      >
                        Poner nuevamente en cola
                      </button>
                      <button
                        onClick={() => updateTurnStatus('ATTENDANCE')}
                        className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                      >
                        Atender en módulo
                      </button>
                      <button
                        onClick={handleRepeatCall} // <-- CAMBIO
                        disabled={repeating}
                        className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition ${
                          repeating
                            ? 'cursor-not-allowed bg-slate-400'
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        {repeating ? 'Repitiendo llamado…' : 'Repetir llamado'}
                      </button>
                    </>
                  )}

                  {showMarkAttended && (
                    <button
                      onClick={() => updateTurnStatus('ATTENDED')}
                      className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                    >
                      Marcar como atendido
                    </button>
                  )}

                  {!showActions && !showMarkAttended && (
                    <p className="mt-1 text-xs text-slate-400">
                      Llama un turno para ver las acciones disponibles.
                    </p>
                  )}
                </div>
              </div>
            </aside>

            {/* COLUMNA DERECHA: RESUMEN + LLAMAR SIGUIENTE */}
            <main className="flex-1 space-y-4">
              {/* Resumen de servicio */}
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Estado de fila
                    </p>
                    <h2 className="text-lg font-semibold text-slate-800 md:text-xl">
                      {serviceName || 'Servicio'}:{' '}
                      <span className="font-bold text-blue-600">
                        {pendingTurns} en espera
                      </span>
                    </h2>
                    {/* ⬅️ NUEVO: contador de reencolados */}
                    <p className="mt-1 text-xs text-slate-600">
                      Reencolados hoy:{' '}
                      <span className="font-semibold text-amber-600">
                        {requeuedCount}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-slate-500 md:text-sm">
                      Gestiona los turnos de tu módulo y mantén un flujo ágil de
                      atención.
                    </p>
                  </div>

                  {/* Botón llamar siguiente turno */}
                  <div className="mt-3 md:mt-0">
                    <button
                      onClick={handleCallNextTurn}
                      disabled={callingNext}
                      className={`group flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold text-white shadow-md transition md:text-base ${
                        callingNext
                          ? 'cursor-not-allowed bg-slate-400'
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      <span className="text-lg">▶️</span>
                      <span>
                        {callingNext
                          ? 'Turno en curso…'
                          : 'Llamar siguiente turno'}
                      </span>
                    </button>
                    <p className="mt-1 text-[11px] text-slate-400 md:text-xs">
                      Este botón llama el próximo turno disponible en tu
                      módulo.
                    </p>
                  </div>
                </div>
              </div>

              {/* Tarjeta info adicional */}
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-500 md:text-sm">
                <p>
                  Consejo: mantén siempre un turno activo antes de marcarlo como
                  atendido o regresarlo a la cola. Esto ayuda a que el tablero
                  de TV y el llamado por voz se mantengan sincronizados.
                </p>
              </div>
            </main>
          </div>
        </div>
      ) : (
        <p className="flex min-h-screen items-center justify-center text-sm text-slate-500">
          Cargando información del usuario...
        </p>
      )}
    </div>
  );
}
