import type { NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { authenticate, AuthenticatedRequest } from '@/middleware/auth'

type DateRange = { start: Date; end: Date }
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
  const dayOfWeek = todayStart.getUTCDay() // 0=Sunday,1=Monday...
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

function buildRanges(): { today: DateRange; week: DateRange; month: DateRange } {
  const now = new Date()
  const todayStart = getTodayStartBogota(now)
  const weekStart = getWeekStartBogota(now)
  const monthStart = getMonthStartBogota(now)

  return {
    today: { start: todayStart, end: now },
    week: { start: weekStart, end: now },
    month: { start: monthStart, end: now },
  }
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
      const { today, week, month } = buildRanges()

      const [todayCount, weekCount, monthCount] = await Promise.all([
        prisma.turn.count({
          where: {
            status: { in: ATTENDED_STATUSES as any },
            createdAt: { gte: today.start, lt: today.end },
          },
        }),
        prisma.turn.count({
          where: {
            status: { in: ATTENDED_STATUSES as any },
            createdAt: { gte: week.start, lt: week.end },
          },
        }),
        prisma.turn.count({
          where: {
            status: { in: ATTENDED_STATUSES as any },
            createdAt: { gte: month.start, lt: month.end },
          },
        }),
      ])

      const [todayTop, weekTop, monthTop] = await Promise.all([
        getTopAdvisor(today),
        getTopAdvisor(week),
        getTopAdvisor(month),
      ])

      return res.status(200).json({
        today: {
          attendedCount: todayCount,
          topAdvisor: todayTop,
        },
        week: {
          attendedCount: weekCount,
          topAdvisor: weekTop,
        },
        month: {
          attendedCount: monthCount,
          topAdvisor: monthTop,
        },
      })
    } catch (error) {
      console.error('Error en /api/admin/dashboard/summary:', error)
      return res.status(500).json({ message: 'Error interno del servidor' })
    }
  })
}

async function getTopAdvisor(range: DateRange) {
  const grouped = await prisma.turn.groupBy({
    by: ['attendedById'],
    where: {
      status: { in: ATTENDED_STATUSES as any },
      attendedById: { not: null },
      createdAt: {
        gte: range.start,
        lt: range.end,
      },
    },
    _count: { _all: true },
  })

  if (!grouped.length) return null

  // Ordenamos en JS por el _count._all (mayor a menor)
  grouped.sort((a, b) => b._count._all - a._count._all)

  const top = grouped[0]
  if (!top.attendedById) return null

  const advisor = await prisma.user.findUnique({
    where: { id: top.attendedById },
    select: { id: true, name: true, username: true },
  })

  if (!advisor) return null

  return {
    id: advisor.id,
    name: advisor.name,
    username: advisor.username,
    attendedCount: top._count._all,
  }
}
