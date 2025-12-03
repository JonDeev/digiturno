// src/components/admin/dashboard/DashboardStatsCards.tsx
type SummaryData = {
  today: {
    attendedCount: number
    topAdvisor: { name: string; attendedCount: number } | null
  }
  week: {
    attendedCount: number
    topAdvisor: { name: string; attendedCount: number } | null
  }
  month: {
    attendedCount: number
    topAdvisor: { name: string; attendedCount: number } | null
  }
}

type TimeMetricsData = {
  averageWaitingSeconds: number
  averageAttentionSeconds: number
}

type Props = {
  summary?: SummaryData
  timeMetricsToday?: TimeMetricsData
  loading: boolean
}

function formatSecondsToMinSec(seconds: number | undefined): string {
  if (!seconds || seconds <= 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function DashboardStatsCards({ summary, timeMetricsToday, loading }: Props) {
  const skeleton = loading && !summary

  const todayCount = summary?.today.attendedCount ?? 0
  const weekCount = summary?.week.attendedCount ?? 0
  const monthCount = summary?.month.attendedCount ?? 0

  const todayTop = summary?.today.topAdvisor
  const weekTop = summary?.week.topAdvisor
  const monthTop = summary?.month.topAdvisor

  const avgWait = timeMetricsToday?.averageWaitingSeconds
  const avgAttention = timeMetricsToday?.averageAttentionSeconds

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Hoy */}
      <div className="rounded-xl bg-white shadow-sm border border-slate-200 p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Turnos atendidos hoy
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
            En tiempo real
          </span>
        </div>
        <div className="text-3xl font-bold text-slate-800">
          {skeleton ? '...' : todayCount}
        </div>
        <div className="text-xs text-slate-500">
          {todayTop
            ? `Top asesor: ${todayTop.name} (${todayTop.attendedCount})`
            : 'Sin datos de asesores hoy'}
        </div>
      </div>

      {/* Semana */}
      <div className="rounded-xl bg-white shadow-sm border border-slate-200 p-4 flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Semana actual (L-V)
        </span>
        <div className="text-3xl font-bold text-slate-800">
          {skeleton ? '...' : weekCount}
        </div>
        <div className="text-xs text-slate-500">
          {weekTop
            ? `Top asesor: ${weekTop.name} (${weekTop.attendedCount})`
            : 'Sin datos de asesores en la semana'}
        </div>
      </div>

      {/* Mes */}
      <div className="rounded-xl bg-white shadow-sm border border-slate-200 p-4 flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Mes vigente
        </span>
        <div className="text-3xl font-bold text-slate-800">
          {skeleton ? '...' : monthCount}
        </div>
        <div className="text-xs text-slate-500">
          {monthTop
            ? `Top asesor: ${monthTop.name} (${monthTop.attendedCount})`
            : 'Sin datos de asesores en el mes'}
        </div>
      </div>

      {/* Tiempos promedio (ocupa ancho completo abajo) */}
      <div className="md:col-span-3 rounded-xl bg-white shadow-sm border border-slate-200 p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Tiempos promedio (hoy)
          </p>
          <p className="text-xs text-slate-500">
            Basado en turnos atendidos con hora de inicio y fin
          </p>
        </div>
        <div className="flex gap-6">
          <div className="text-sm">
            <p className="text-slate-500 text-xs">Espera hasta ser atendido</p>
            <p className="font-semibold text-slate-800 text-lg">
              {skeleton ? '...' : formatSecondsToMinSec(avgWait)}
            </p>
          </div>
          <div className="text-sm">
            <p className="text-slate-500 text-xs">Duración de la atención</p>
            <p className="font-semibold text-slate-800 text-lg">
              {skeleton ? '...' : formatSecondsToMinSec(avgAttention)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
