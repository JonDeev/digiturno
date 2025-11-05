// src/pages/api/turns/create.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

/** Inicio y fin del día de Bogotá en UTC (sin librerías externas) */
function getBogotaDayBounds(base = new Date()) {
  const tz = 'America/Bogota'
  const y = new Intl.DateTimeFormat('es-CO', { timeZone: tz, year: 'numeric' }).format(base)
  const m = new Intl.DateTimeFormat('es-CO', { timeZone: tz, month: '2-digit' }).format(base)
  const d = new Intl.DateTimeFormat('es-CO', { timeZone: tz, day: '2-digit' }).format(base)
  // Bogotá es -05:00 sin DST
  const start = new Date(`${y}-${m}-${d}T00:00:00.000-05:00`)
  const end = new Date(`${y}-${m}-${d}T23:59:59.999-05:00`)
  return { start, end }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Método no permitido' })

  try {
    // serviceId debe ser STRING (UUID). No lo conviertas a número.
    const serviceId = (req.body?.serviceId ?? '').toString().trim()
    if (!serviceId) {
      return res.status(400).json({ message: 'ID de servicio requerido' })
    }

    const { start, end } = getBogotaDayBounds()

    // Transacción: calcula el siguiente correlativo del día y crea el turno
    const created = await prisma.$transaction(async (tx) => {
      const agg = await tx.turn.aggregate({
        where: {
          serviceId,                 // <- String
          createdAt: { gte: start, lte: end }, // <- usa DateTime
        },
        _max: { number: true },      // <- forma correcta
      })

      const nextNumber = (agg._max.number ?? 0) + 1
      const code = `A${String(nextNumber).padStart(3, '0')}`

      // Si quieres conservar fecha_creacion como texto para UI, la puedes llenar aquí.
      const localStamp = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })

      const turn = await tx.turn.create({
        data: {
          number: nextNumber,
          code,
          serviceId,
          status: 'PENDING',
          // createdAt se llena solo por @default(now())
          fecha_creacion: localStamp, // <- opcional (tu campo es String?)
        },
        include: { service: true },
      })

      return turn
    })

    return res.status(200).json(created)
  } catch (error) {
    console.error('Error creando turno:', error)
    return res.status(500).json({ message: 'Error al crear turno' })
  }
}
