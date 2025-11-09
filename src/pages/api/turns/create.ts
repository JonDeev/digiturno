import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { notifyPendingChanged } from '@/lib/pendingBus'   // ⬅️ NUEVO

function getBogotaDayBounds(base = new Date()) {
  const tz = 'America/Bogota'
  const y = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric' }).format(base)
  const m = new Intl.DateTimeFormat('en-CA', { timeZone: tz, month: '2-digit' }).format(base)
  const d = new Intl.DateTimeFormat('en-CA', { timeZone: tz, day: '2-digit' }).format(base)
  const start = new Date(`${y}-${m}-${d}T00:00:00.000-05:00`)
  const end = new Date(`${y}-${m}-${d}T23:59:59.999-05:00`)
  return { start, end }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Método no permitido' })

  try {
    const serviceId = (req.body?.serviceId ?? '').toString().trim()
    if (!serviceId) return res.status(400).json({ message: 'ID de servicio requerido' })

    const { start, end } = getBogotaDayBounds()

    const created = await prisma.$transaction(async (tx) => {
      const agg = await tx.turn.aggregate({
        where: { serviceId, createdAt: { gte: start, lte: end } },
        _max: { number: true },
      })

      const nextNumber = (agg._max.number ?? 0) + 1
      const code = `A${String(nextNumber).padStart(3, '0')}`
      const localStamp = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })

      return tx.turn.create({
        data: {
          number: nextNumber,
          code,
          serviceId,
          status: 'PENDING',
          fecha_creacion: localStamp,
        },
        include: { service: true },
      })
    })

    // ⬇️ NOTIFICAR a los suscriptores SSE de ese servicio
    notifyPendingChanged(created.serviceId)

    return res.status(200).json(created)
  } catch (error) {
    console.error('Error creando turno:', error)
    return res.status(500).json({ message: 'Error al crear turno' })
  }
}
