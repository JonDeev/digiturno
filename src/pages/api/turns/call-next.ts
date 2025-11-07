// src/pages/api/turns/call-next.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { authenticate, AuthenticatedRequest } from '@/middleware/auth'
import { prisma } from '@/lib/prisma'

/** Rango de hoy en zona America/Bogota (inicio incluido, fin excluido) */
function getTodayRangeBogota() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())

  const y = parts.find(p => p.type === 'year')!.value
  const m = parts.find(p => p.type === 'month')!.value
  const d = parts.find(p => p.type === 'day')!.value

  // Colombia no maneja DST; -05:00 es estable
  const start = new Date(`${y}-${m}-${d}T00:00:00-05:00`)
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000)
  return { start, end }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return authenticate(req as AuthenticatedRequest, res, async () => {
    const user = (req as AuthenticatedRequest).user
    if (!user?.moduleId) {
      return res.status(400).json({ message: 'Módulo no asignado al asesor' })
    }

    // === NUEVO: rango de "hoy" (America/Bogota) para filtrar createdAt ===
    const { start: todayStart, end: todayEnd } = getTodayRangeBogota()

    try {
      const updatedTurn = await prisma.$transaction(async (tx) => {
        // 1) Elegir el próximo turno ELEGIBLE:
        //    - PENDING (siempre)
        //    - REQUEUED SOLO si priority >= 0 (ya cumplió la espera)
        //    - *** SOLO creados HOY ***
        const candidate = await tx.turn.findFirst({
          where: {
            OR: [
              { status: 'PENDING' },
              { status: 'REQUEUED', priority: { gte: 0 } },
            ],
            createdAt: { gte: todayStart, lt: todayEnd }, // <-- añadido
            // Si este módulo solo atiende ciertos servicios, filtra aquí:
            // serviceId: { in: [...] }
          },
          orderBy: [
            { priority: 'desc' }, // VIP/ajustes manuales arriba; los “liberados” quedan en 0
            { createdAt: 'asc' }, // más antiguos primero (de HOY)
          ],
          include: { service: true },
        })

        if (!candidate) return null

        // 2) Marcar como CALLED de forma atómica (evitar carrera)
        const ok = await tx.turn.updateMany({
          where: { id: candidate.id, status: candidate.status },
          data: {
            status: 'CALLED',
            moduleId: user.moduleId,
            calledAt: new Date(),
            calledCount: { increment: 1 },
          },
        })
        if (ok.count === 0) throw new Error('RACE_RETRY')

        // 3) TICK DE COOLDOWN (después de llamar a alguien):
        //    avanza +1 a TODOS los reencolados que siguen esperando (-2→-1, -1→0).
        await tx.turn.updateMany({
          where: { status: 'REQUEUED', priority: { lt: 0 } },
          data: { priority: { increment: 1 } },
        })

        // 4) Devolver el turno ya marcado CALLED
        return tx.turn.findUnique({
          where: { id: candidate.id },
          include: { service: true },
        })
      }, { isolationLevel: 'Serializable' })

      if (!updatedTurn) {
        return res.status(404).json({ message: 'No hay turnos disponibles' })
      }

      return res.status(200).json(updatedTurn)
    } catch (error: any) {
      if (error?.message === 'RACE_RETRY') {
        // Un reintento simple
        try {
          const again = await prisma.$transaction(async (tx) => {
            const candidate = await tx.turn.findFirst({
              where: {
                OR: [
                  { status: 'PENDING' },
                  { status: 'REQUEUED', priority: { gte: 0 } },
                ],
                createdAt: { gte: todayStart, lt: todayEnd }, // <-- añadido también aquí
              },
              orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
              include: { service: true },
            })
            if (!candidate) return null
            const ok = await tx.turn.updateMany({
              where: { id: candidate.id, status: candidate.status },
              data: {
                status: 'CALLED',
                moduleId: (req as AuthenticatedRequest).user!.moduleId!,
                calledAt: new Date(),
                calledCount: { increment: 1 },
              },
            })
            if (ok.count === 0) return null

            // Tick después de una llamada efectiva
            await tx.turn.updateMany({
              where: { status: 'REQUEUED', priority: { lt: 0 } },
              data: { priority: { increment: 1 } },
            })

            return tx.turn.findUnique({ where: { id: candidate.id }, include: { service: true } })
          }, { isolationLevel: 'Serializable' })
          if (again) return res.status(200).json(again)
          return res.status(404).json({ message: 'No hay turnos disponibles' })
        } catch (e) {
          console.error('Retry call-next failed:', e)
        }
      }
      console.error('Error al llamar siguiente turno:', error)
      return res.status(500).json({ message: 'Error al procesar el turno' })
    }
  })
}
