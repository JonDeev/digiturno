// src/pages/api/turns/last-called.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

/** Rango de hoy en zona America/Bogota (inicio incluido, fin excluido) */
function getTodayRangeBogota() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const y = parts.find(p => p.type === 'year')!.value;
  const m = parts.find(p => p.type === 'month')!.value;
  const d = parts.find(p => p.type === 'day')!.value;

  // Colombia no maneja DST; -05:00 es estable
  const start = new Date(`${y}-${m}-${d}T00:00:00-05:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

/**
 * Devuelve los últimos turnos en estado ATTENDED o ATTENDANCE.
 * Query params:
 *  - limit?: number (default 8, máx 50)
 *  - serviceId?: string (opcional para filtrar por servicio)
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const limitRaw = (req.query.limit as string) ?? '8';
    const limit = Math.min(Math.max(parseInt(limitRaw, 10) || 8, 1), 50);
    const serviceId = (req.query.serviceId as string) || undefined;

    const { start, end } = getTodayRangeBogota();

    const turns = await prisma.turn.findMany({
      where: {
        ...(serviceId ? { serviceId } : {}),
        status: { in: ['ATTENDED', 'ATTENDANCE'] },
        createdAt: { gte: start, lt: end }, // ← Solo los creados hoy
      },
      orderBy: [{ calledAt: 'desc' }, { createdAt: 'desc' }],
      take: limit,
      select: {
        id: true,
        code: true,
        calledAt: true,
        moduleId: true,
        module: { select: { id: true, name: true } },
      },
    });

    return res.status(200).json(turns);
  } catch (error) {
    console.error('API /turns/last-called error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
