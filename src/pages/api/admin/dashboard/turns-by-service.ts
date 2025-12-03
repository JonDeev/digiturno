import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { authenticate, AuthenticatedRequest } from '@/middleware/auth'

type DateRange = { start: Date; end: Date }
type RangeName = 'today' | 'week' | 'month'

const ATTENDED_STATUSES = ['ATTENDED', 'ATTENDANCE'] as const

function getTodayStartBogota(now: Date): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)

  const y = parts.find(p => p.type === 'year')!.value
  const m = parts.find(p => p.type === 'month')!.value
  const d = parts.find(p => p.type === 'day')!.value

  return new Date(`${y}-${m}-${d}T00:00:00-05:00`)
}

function getWeekStartBogota(now: Date): Date {
  const todayStart = getTodayStartBogota(now)
  const dayOfWeek = todayStart.getUTCDay()
  const diffToMonday = (dayOfWeek + 6) % 7
  const monday = new Date(todayStart)
  monday.setUTCDate(monday.getUTCDate() - diffToMonday)
  return monday
}

function getMonthStartBogota(now: Date): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(now)

  const y = parts.find(p => p.type === 'year')!.value
  const m = parts.find(p => p.type === 'month')!.value

  return new Date(`${y}-${m}-01T00:00:00-05:00`)
}

function getRangeFromParam(rangeParam?: string): { range: RangeName; dates: DateRange } {
  const now = new Date()
  const todayStart = getTodayStartBogota(now)
  const weekStart = getWeekStartBogota(now)
  const monthStart = getMonthStartBogota(now)

  const normalized = (rangeParam ?? 'today').toLowerCase()

  if (normalized === 'week') {
    return { range: 'week', dates: { start: weekStart, end: now } }
  }
  if (normalized === 'month') {
    return { range: 'month', dates: { start: monthStart, end: now } }
  }
  return { range: 'today', dates: { start: todayStart, end: now } }
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
      const { range: rangeName, dates } = getRangeFromParam(req.query.range as string | undefined)

      const grouped = await prisma.turn.groupBy({
        by: ['serviceId'],
        where: {
          status: { in: ATTENDED_STATUSES as any },
          createdAt: {
            gte: dates.start,
            lt: dates.end,
          },
        },
        _count: { _all: true },
      })

      if (!grouped.length) {
        return res.status(200).json({ range: rangeName, items: [] })
      }

      const serviceIds = grouped.map(g => g.serviceId)
      const services = await prisma.service.findMany({
        where: { id: { in: serviceIds } },
        select: { id: true, name: true },
      })

      const serviceMap = new Map(services.map(s => [s.id, s.name]))

      const items = grouped.map(g => ({
        serviceId: g.serviceId,
        serviceName: serviceMap.get(g.serviceId) ?? 'Servicio desconocido',
        count: g._count._all,
      }))

      return res.status(200).json({
        range: rangeName,
        items,
      })
    } catch (error) {
      console.error('Error en /api/admin/dashboard/turns-by-service:', error)
      return res.status(500).json({ message: 'Error interno del servidor' })
    }
  })
}
