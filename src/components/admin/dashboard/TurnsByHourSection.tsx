// src/components/admin/dashboard/TurnsByHourSection.tsx
type HourBucket = { hour: number; count: number }

type TurnsByHourResponse = {
  date: string
  created: HourBucket[]
  attended: HourBucket[]
}

type Props = {
  data?: TurnsByHourResponse
  loading: boolean
}

export function TurnsByHourSection({ data, loading }: Props) {
  const created = data?.created ?? []
  const attended = data?.attended ?? []

  const hasData = (created.length + attended.length) > 0

  return (
    <section className="rounded-xl bg-white shadow-sm border border-slate-200 p-4 mb-4">
      <div className="flex justify-between items-center mb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            Turnos por rango de hora (hoy)
          </h3>
          <p className="text-xs text-slate-500">
            Número de turnos creados y atendidos por hora
          </p>
        </div>
      </div>

      {loading && !hasData ? (
        <p className="text-xs text-slate-400">Cargando...</p>
      ) : !hasData ? (
        <p className="text-xs text-slate-400">No hay datos para hoy.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="text-left border-b border-slate-200">
                <th className="py-1 pr-3 text-slate-500 font-medium">Hora</th>
                <th className="py-1 pr-3 text-slate-500 font-medium">Creados</th>
                <th className="py-1 pr-3 text-slate-500 font-medium">Atendidos</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 24 }).map((_, h) => {
                const createdCount = created.find(c => c.hour === h)?.count ?? 0
                const attendedCount = attended.find(a => a.hour === h)?.count ?? 0
                if (!createdCount && !attendedCount) return null // no mostrar horas vacías
                return (
                  <tr key={h} className="border-b border-slate-100">
                    <td className="py-1 pr-3 text-slate-700">
                      {h.toString().padStart(2, '0')}:00
                    </td>
                    <td className="py-1 pr-3 text-slate-800">{createdCount}</td>
                    <td className="py-1 pr-3 text-slate-800">{attendedCount}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
