import type { NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { authenticate, AuthenticatedRequest } from '@/middleware/auth'

const ATTENDED_STATUSES = ['ATTENDED', 'ATTENDANCE'] as const

function getDayRangeForDateBogota(dateStr?: string): { date: string; start: Date; end: Date } {
  const now = new Date()

  if (!dateStr) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now)

    const y = parts.find(p => p.type === 'year')!.value
    const m = parts.find(p => p.type === 'month')!.value
    const d = parts.find(p => p.type === 'day')!.value

    const start = new Date(`${y}-${m}-${d}T00:00:00-05:00`)
    const end = new Date(`${y}-${m}-${d}T24:00:00-05:00`)
    return { date: `${y}-${m}-${d}`, start, end }
  }

  // Espera formato YYYY-MM-DD
  const start = new Date(`${dateStr}T00:00:00-05:00`)
  const end = new Date(`${dateStr}T24:00:00-05:00`)
  return { date: dateStr, start, end }
}

function initHourBuckets() {
  const buckets: { [hour: number]: number } = {}
  for (let h = 0; h < 24; h++) {
    buckets[h] = 0
  }
  return buckets
}

const hourFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Bogota',
  hour: '2-digit',
  hour12: false,
})

function getHourInBogota(date: Date): number {
  const formatted = hourFormatter.format(date) // "07", "13", etc.
  return parseInt(formatted, 10)
}

export default async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ message: 'Método no permitido' })
  }

  return authenticate(req, res, async () => {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'No autorizado' })
    }

    try {
      const { date, start, end } = getDayRangeForDateBogota(req.query.date as string | undefined)

      const [createdTurns, attendedTurns] = await Promise.all([
        prisma.turn.findMany({
          where: {
            createdAt: { gte: start, lt: end },
          },
          select: { createdAt: true },
        }),
        prisma.turn.findMany({
          where: {
            status: { in: ATTENDED_STATUSES as any },
            attentionStartedAt: { gte: start, lt: end },
          },
          select: { attentionStartedAt: true },
        }),
      ])

      const createdBuckets = initHourBuckets()
      for (const t of createdTurns) {
        const hour = getHourInBogota(t.createdAt)
        if (!Number.isNaN(hour)) createdBuckets[hour]++
      }

      const attendedBuckets = initHourBuckets()
      for (const t of attendedTurns) {
        if (!t.attentionStartedAt) continue
        const hour = getHourInBogota(t.attentionStartedAt)
        if (!Number.isNaN(hour)) attendedBuckets[hour]++
      }

      const created = Object.keys(createdBuckets).map(h => ({
        hour: Number(h),
        count: createdBuckets[Number(h)],
      }))
      const attended = Object.keys(attendedBuckets).map(h => ({
        hour: Number(h),
        count: attendedBuckets[Number(h)],
      }))

      return res.status(200).json({
        date,
        created,
        attended,
      })
    } catch (error) {
      console.error('Error en /api/admin/dashboard/turns-by-hour:', error)
      return res.status(500).json({ message: 'Error interno del servidor' })
    }
  })
}
