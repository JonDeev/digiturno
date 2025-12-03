import type { NextApiResponse } from 'next'
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

      const turns = await prisma.turn.findMany({
        where: {
          status: { in: ATTENDED_STATUSES as any },
          createdAt: { gte: dates.start, lt: dates.end },
          attentionStartedAt: { not: null },
          attentionFinishedAt: { not: null },
        },
        select: {
          createdAt: true,
          attentionStartedAt: true,
          attentionFinishedAt: true,
        },
      })

      if (!turns.length) {
        return res.status(200).json({
          range: rangeName,
          averageWaitingSeconds: 0,
          averageAttentionSeconds: 0,
        })
      }

      let totalWaitingMs = 0
      let totalAttentionMs = 0
      let count = 0

      for (const t of turns) {
        if (!t.attentionStartedAt || !t.attentionFinishedAt) continue

        const waitingMs = t.attentionStartedAt.getTime() - t.createdAt.getTime()
        const attentionMs = t.attentionFinishedAt.getTime() - t.attentionStartedAt.getTime()

        if (waitingMs > 0) totalWaitingMs += waitingMs
        if (attentionMs > 0) totalAttentionMs += attentionMs
        count++
      }

      if (count === 0) {
        return res.status(200).json({
          range: rangeName,
          averageWaitingSeconds: 0,
          averageAttentionSeconds: 0,
        })
      }

      const averageWaitingSeconds = Math.round(totalWaitingMs / count / 1000)
      const averageAttentionSeconds = Math.round(totalAttentionMs / count / 1000)

      return res.status(200).json({
        range: rangeName,
        averageWaitingSeconds,
        averageAttentionSeconds,
      })
    } catch (error) {
      console.error('Error en /api/admin/dashboard/time-metrics:', error)
      return res.status(500).json({ message: 'Error interno del servidor' })
    }
  })
}
