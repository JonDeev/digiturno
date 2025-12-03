// src/hooks/useAdminDashboard.ts
import { useQuery } from '@tanstack/react-query'
import { fetchWithAuth } from '@/lib/apiClient'

type Range = 'today' | 'week' | 'month'

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['admin-dashboard', 'summary'],
    queryFn: async () => {
      const res = await fetchWithAuth('/api/admin/dashboard/summary')
      if (!res.ok) {
        throw new Error('Error cargando resumen')
      }
      return res.json()
    },
    refetchInterval: 15000, // 15s
  })
}

export function useDashboardTurnsByService(range: Range = 'today') {
  return useQuery({
    queryKey: ['admin-dashboard', 'turns-by-service', range],
    queryFn: async () => {
      const params = new URLSearchParams({ range })
      const res = await fetchWithAuth(
        `/api/admin/dashboard/turns-by-service?${params.toString()}`
      )
      if (!res.ok) {
        throw new Error('Error cargando turnos por servicio')
      }
      return res.json()
    },
    refetchInterval: 15000,
  })
}

export function useDashboardTurnsByHour(date?: string) {
  return useQuery({
    queryKey: ['admin-dashboard', 'turns-by-hour', date ?? 'today'],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (date) params.set('date', date)
      const res = await fetchWithAuth(
        `/api/admin/dashboard/turns-by-hour?${params.toString()}`
      )
      if (!res.ok) {
        throw new Error('Error cargando turnos por hora')
      }
      return res.json()
    },
    refetchInterval: 15000,
  })
}

export function useDashboardTimeMetrics(range: Range = 'today') {
  return useQuery({
    queryKey: ['admin-dashboard', 'time-metrics', range],
    queryFn: async () => {
      const params = new URLSearchParams({ range })
      const res = await fetchWithAuth(
        `/api/admin/dashboard/time-metrics?${params.toString()}`
      )
      if (!res.ok) {
        throw new Error('Error cargando tiempos promedio')
      }
      return res.json()
    },
    refetchInterval: 15000,
  })
}
