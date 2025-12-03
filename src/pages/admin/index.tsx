// src/pages/admin/index.tsx
import { useState } from 'react'
import { useRouter } from 'next/router'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { useAuth } from '@/hooks/useAuth'
import { useUser } from '@/hooks/useUser'
import {
  useDashboardSummary,
  useDashboardTurnsByService,
  useDashboardTurnsByHour,
  useDashboardTimeMetrics,
} from '@/hooks/useAdminDashboard'
import { DashboardStatsCards } from '@/components/admin/dashboard/DashboardStatsCards'
import { TurnsByServiceSection } from '@/components/admin/dashboard/TurnsByServiceSection'
import { TurnsByHourSection } from '@/components/admin/dashboard/TurnsByHourSection'

type Range = 'today' | 'week' | 'month'

export default function AdminDashboardPage() {
  useAuth()
  const user = useUser()
  const router = useRouter()

  // Si el usuario ya está cargado y no es admin, lo bloqueamos
  if (user && user.role !== 'ADMIN') {
    if (typeof window !== 'undefined') {
      router.replace('/') // o a donde quieras mandarlo
    }
    return (
      <AdminLayout title="No autorizado">
        <p className="text-sm text-red-600">
          No tienes permisos para acceder a este panel.
        </p>
      </AdminLayout>
    )
  }

  const [serviceRange, setServiceRange] = useState<Range>('today')

  const { data: summary, isLoading: loadingSummary } = useDashboardSummary()
  const { data: turnsByService, isLoading: loadingByService } =
    useDashboardTurnsByService(serviceRange)
  const { data: turnsByHour, isLoading: loadingByHour } = useDashboardTurnsByHour()
  const { data: timeMetricsToday, isLoading: loadingTime } = useDashboardTimeMetrics('today')

  const loading = loadingSummary || loadingTime

  return (
    <AdminLayout title="Dashboard general">
      <DashboardStatsCards
        summary={summary}
        timeMetricsToday={timeMetricsToday}
        loading={loading}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TurnsByServiceSection
          data={turnsByService}
          loading={loadingByService}
          range={serviceRange}
          onRangeChange={setServiceRange}
        />

        <TurnsByHourSection
          data={turnsByHour}
          loading={loadingByHour}
        />
      </div>
    </AdminLayout>
  )
}
