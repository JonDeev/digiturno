import { useUser } from '@/hooks/useUser'; 
import { useAuth } from '@/hooks/useAuth'; // tu hook personalizado
// tu hook personalizado
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function AsesorPanel() {
  useAuth(); // protege la ruta
  const user = useUser();
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
          <h2 className="mb-4 text-lg font-semibold">Turno actual</h2>
          <div className="p-4 mb-4 text-center bg-white rounded shadow">
            <span className="text-3xl font-bold text-blue-600">A001</span>
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
          <button className="px-6 py-3 mb-6 text-white bg-blue-600 rounded hover:bg-blue-700">
            Llamar siguiente turno
          </button>
          <div>
            <h3 className="mb-2 text-lg font-medium">Último turno llamado</h3>
            <div className="p-4 text-2xl font-bold text-center text-blue-700 bg-gray-100 rounded shadow">A000</div>
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
