// src/components/admin/dashboard/TurnsByServiceSection.tsx
type Range = 'today' | 'week' | 'month'

type TurnsByServiceResponse = {
  range: Range
  items: { serviceId: string; serviceName: string; count: number }[]
}

type Props = {
  data?: TurnsByServiceResponse
  loading: boolean
  range: Range
  onRangeChange: (range: Range) => void
}

export function TurnsByServiceSection({ data, loading, range, onRangeChange }: Props) {
  const items = data?.items ?? []

  return (
    <section className="rounded-xl bg-white shadow-sm border border-slate-200 p-4 mb-4">
      <div className="flex justify-between items-center mb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            Turnos atendidos por servicio
          </h3>
          <p className="text-xs text-slate-500">
            Distribución de turnos en el rango seleccionado
          </p>
        </div>
        <select
          className="text-xs border border-slate-300 rounded-lg px-2 py-1 bg-white"
          value={range}
          onChange={e => onRangeChange(e.target.value as Range)}
        >
          <option value="today">Hoy</option>
          <option value="week">Semana actual</option>
          <option value="month">Mes vigente</option>
        </select>
      </div>

      {loading && !items.length ? (
        <p className="text-xs text-slate-400">Cargando...</p>
      ) : !items.length ? (
        <p className="text-xs text-slate-400">No hay datos para este rango.</p>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.serviceId} className="flex items-center justify-between text-xs">
              <span className="text-slate-700 truncate max-w-[60%]">
                {item.serviceName}
              </span>
              <div className="flex-1 mx-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-sky-400"
                  style={{
                    width: `${Math.min((item.count / (items[0]?.count || 1)) * 100, 100)}%`,
                  }}
                />
              </div>
              <span className="font-semibold text-slate-800">{item.count}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
