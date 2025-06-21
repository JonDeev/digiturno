import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';

export default function Panel() {
  useAuth(); // protege la ruta
  const user = useUser();
  console.log("user:",user)

  return (
      <div className="p-6">
      <h1 className="text-2xl font-semibold text-blue-800">Panel del Asesor</h1>
      {user ? (
        <div className="mt-4 space-y-2 text-gray-700">
          <p><strong>Usuario:</strong> {user.username}</p>
          <p><strong>Rol:</strong> {user.role}</p>
          <p><strong>Módulo:</strong> {user.moduleId}</p>
        </div>
      ) : (
        <p>Cargando información del usuario...</p>
      )}
    </div>
  );
}
