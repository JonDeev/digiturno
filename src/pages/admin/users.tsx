import { useRouter } from 'next/router'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { useAuth } from '@/hooks/useAuth'
import { useUser } from '@/hooks/useUser'
import { useAdminUsers } from '@/hooks/useAdminUsers'

export default function AdminUsersPage() {
  useAuth()
  const user = useUser()
  const router = useRouter()

  // Si no es admin, lo sacamos
  if (user && user.role !== 'ADMIN') {
    if (typeof window !== 'undefined') {
      router.replace('/')
    }
    return (
      <AdminLayout title="No autorizado">
        <p className="text-sm text-red-600">
          No tienes permisos para acceder a este módulo.
        </p>
      </AdminLayout>
    )
  }

  const { data: users, isLoading, isError, error } = useAdminUsers()

  return (
    <AdminLayout title="Usuarios">
      <div className="rounded-xl bg-white shadow-sm border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">
              Usuarios del sistema
            </h3>
            <p className="text-xs text-slate-500">
              Listado de usuarios con rol ADMIN o ADVISOR.
            </p>
          </div>

          {/* Aquí luego pondremos botón "Nuevo usuario" */}
        </div>

        {isLoading && (
          <p className="text-xs text-slate-400">Cargando usuarios...</p>
        )}

        {isError && (
          <p className="text-xs text-red-500">
            Error al cargar usuarios: {(error as Error)?.message}
          </p>
        )}

        {!isLoading && !isError && (!users || users.length === 0) && (
          <p className="text-xs text-slate-400">No hay usuarios registrados.</p>
        )}

        {!isLoading && !isError && users && users.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  <th className="py-2 pr-3 font-medium text-slate-500">Nombre</th>
                  <th className="py-2 pr-3 font-medium text-slate-500">Usuario</th>
                  <th className="py-2 pr-3 font-medium text-slate-500">Documento</th>
                  <th className="py-2 pr-3 font-medium text-slate-500">Rol</th>
                  <th className="py-2 pr-3 font-medium text-slate-500">Módulo</th>
                  <th className="py-2 pr-3 font-medium text-slate-500">Creado</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-slate-100">
                    <td className="py-2 pr-3 text-slate-800">{u.name}</td>
                    <td className="py-2 pr-3 text-slate-700">{u.username}</td>
                    <td className="py-2 pr-3 text-slate-700">{u.numberId}</td>
                    <td className="py-2 pr-3">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-slate-700">
                      {u.module ? u.module.name : '—'}
                    </td>
                    <td className="py-2 pr-3 text-slate-500">
                      {new Date(u.createdAt).toLocaleString('es-CO', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
