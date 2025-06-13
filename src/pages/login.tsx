import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [moduleId, setModuleId] = useState('');
  const [modules, setModules] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    // Obtener módulos disponibles al cargar la vista
    const fetchModules = async () => {
      const res = await fetch('/api/modules/available');
      const data = await res.json();
      setModules(data);
    };

    fetchModules();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, moduleId }),
    });
    
    const result = await res.json();
    console.log(result)
    if (res.ok) {
      localStorage.setItem('token', result); // Guardamos el JWT
      router.push('/panel'); // Redirigir al panel de llamado
    } else {
      setError(result.message || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-white">
      {/* Imagen lado izquierdo */}
      <div className="hidden md:block">
        <img src="/login-image.jpg" alt="Decoración" className="w-full h-full object-cover" />
      </div>

      {/* Formulario lado derecho */}
      <div className="flex items-center justify-center p-8 bg-white">
        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
          <h2 className="text-3xl font-semibold text-blue-700">Bienvenido</h2>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <input
            type="text"
            placeholder="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border rounded-lg px-4 py-2"
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-lg px-4 py-2"
          />

          <select
            value={moduleId}
            onChange={(e) => setModuleId(e.target.value)}
            className="w-full border rounded-lg px-4 py-2"
            required
          >
            <option value="">Seleccionar módulo</option>
            {modules.map((mod: any) => (
              <option key={mod.id} value={mod.id}>{mod.name}</option>
            ))}
          </select>

          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg"
          >
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
}
