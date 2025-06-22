import { useUser } from '@/hooks/useUser'; // tu hook personalizado
import { useAuth } from '@/hooks/useAuth'; // tu hook personalizado
import { useLastCalledTurn } from '@/hooks/useLastCalledTurn'; // tu hook personalizado
import { useCurrentTurn } from '@/hooks/useCurrentTurn'; // tu hook personalizado
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function AsesorPanel() {
  useAuth(); // protege la ruta
  const user = useUser();
  const { lastTurn, loading } = useLastCalledTurn(user?.moduleId);
  const { turn, cargando, refetch } = useCurrentTurn(user?.moduleId);
  const router = useRouter();

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

  //FUNCION DE LLAMAR SIGUIENTE TURNO
    const handleCallNextTurn = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('/api/turns/call-next', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          body: JSON.stringify({ moduleId: user?.moduleId }),
        },
      });

      const data = await res.json();
      if (res.ok) {
        // Aquí puedes guardar el turno llamado en estado, mostrar notificación, etc.
        console.log('Turno llamado:', data);
        await refetch(); // ← Actualiza turno actual en UI
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
      {/* Encabezado */}
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

      {/* Contenido principal */}
      <div className="flex flex-1">
        {/* Panel lateral */}
        <aside className="w-full p-4 bg-gray-100 md:w-1/3 lg:w-1/4">
          <div>
            <h3 className="text-lg font-bold">Turno actual:</h3>
            {cargando ? (
              <p>Cargando...</p>
            ) : turn ? (
              <p className="text-2xl">
                {turn.service.name}
              </p>
            ) : (
              <p>No hay turno en curso</p>
            )}
          </div>
          <div className="p-4 mb-4 text-center bg-white rounded shadow">
            <span className="text-3xl font-bold text-blue-600">{
              cargando ? (
                <p>Cargando...</p>
              ) : turn ? (
                <p className="text-2xl">
                  {turn.code}
                </p>
              ) : (
                <p>000</p>
              )}
            </span>
          </div>
          <div className="flex flex-col space-y-2">
            <button className="py-2 text-white bg-yellow-400 rounded hover:bg-yellow-500">Poner en cola</button>
            <button className="py-2 text-white bg-green-500 rounded hover:bg-green-600">Marcar atendido</button>
            <button className="py-2 text-white bg-blue-500 rounded hover:bg-blue-600">Repetir llamado</button>
          </div>
        </aside>

        {/* Panel principal */}
        <main className="flex-1 p-6 bg-white">
          <h2 className="mb-4 text-xl font-semibold">Servicio: Reclamar formula (3 en espera)</h2>
          <button onClick={handleCallNextTurn} className="px-6 py-3 mb-6 text-white bg-blue-600 rounded hover:bg-blue-700">
            Llamar siguiente turno
          </button>
          <div className="p-4">
            <h2 className="mb-2 text-xl font-semibold">Último turno llamado</h2>
            {loading ? (
              <p>Cargando...</p>
            ) : lastTurn ? (
              <div className="p-4 border rounded bg-blue-50">
                <p className="text-lg font-medium">Turno: {lastTurn.code}</p>
                <p>Servicio: {lastTurn.serviceId}</p>
                <p>Llamado a las: {new Date(lastTurn.calledAt).toLocaleTimeString()}</p>
              </div>
            ) : (
              <p>No hay turnos llamados aún.</p>
            )}
          </div>
        </main>
      </div>
    </div>
    ) : (
        <p>Cargando información del usuario...</p>
      )}
    </div>
  );
}
