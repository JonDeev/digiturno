// src/components/admin/AdminLayout.tsx
import { ReactNode, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useUser } from '@/hooks/useUser'

type AdminLayoutProps = {
  title?: string
  children: ReactNode
}

const navItems = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/users', label: 'Usuarios' },
  { href: '/admin/modules', label: 'Módulos de atención' },
  { href: '/admin/services', label: 'Servicios' },
  { href: '/admin/assignments', label: 'Asignación servicios' },
  { href: '/admin/tv', label: 'Configuración TV' },
  { href: '/admin/media', label: 'Media' },
  { href: '/admin/reports', label: 'Reportes' },
]

export function AdminLayout({ title = 'Dashboard', children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const user = useUser()
  const router = useRouter()

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-sky-700 to-sky-500 text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Botón menú tipo Dictamy */}
          <button
            onClick={() => setSidebarOpen(prev => !prev)}
            className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/10 px-3 py-2 text-sm font-medium hover:bg-white/20 transition"
          >
            ☰ <span className="ml-2 hidden sm:inline">Menú</span>
          </button>

          <div className="flex flex-col items-center text-center">
            <h1 className="text-lg sm:text-2xl font-semibold leading-tight">
              Panel Administrativo
            </h1>
            <p className="text-xs sm:text-sm text-sky-100">
              Configuración y analítica de turnos
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end text-xs sm:text-sm">
              <span className="font-medium">
                {user?.name ?? 'Admin'}
              </span>
              <span className="text-sky-100">Rol: {user?.role ?? 'ADMIN'}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg border-r border-slate-200
            transform transition-transform duration-200 ease-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            md:static md:translate-x-0
          `}
        >
          <div className="h-full flex flex-col">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between md:hidden">
              <span className="font-semibold text-slate-700 text-sm">Menú</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-slate-500 hover:text-slate-700 text-lg"
              >
                ✕
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
              {navItems.map(item => {
                const active = router.pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      block rounded-lg px-3 py-2 text-sm font-medium
                      ${active
                        ? 'bg-sky-100 text-sky-700 border border-sky-300'
                        : 'text-slate-700 hover:bg-slate-100'}
                    `}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            <div className="px-3 py-3 border-t border-slate-200 text-xs text-slate-400">
              <p>Turnos IPS • Admin</p>
            </div>
          </div>
        </aside>

        {/* Overlay móvil */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Contenido */}
        <main className="flex-1 max-w-6xl mx-auto px-4 py-4 md:py-6">
          <h2 className="text-lg md:text-xl font-semibold text-slate-800 mb-4">
            {title}
          </h2>
          {children}
        </main>
      </div>
    </div>
  )
}
