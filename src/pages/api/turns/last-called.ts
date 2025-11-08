// src/pages/api/turns/last-called.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

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

    const turns = await prisma.turn.findMany({
      where: {
        ...(serviceId ? { serviceId } : {}),
        status: { in: ['ATTENDED', 'ATTENDANCE'] },
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
