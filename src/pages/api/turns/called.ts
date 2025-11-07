// src/pages/api/turns/called.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // ❗ evita cache del navegador/CDN
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    const calledTurns = await prisma.turn.findMany({
      where: { status: 'CALLED' },
      orderBy: { calledAt: 'desc' },   // OK; el hook ya reordena si quiere
      take: 30,                        // subí a 30 por si hay varios repetidos seguidos
      include: {
        module: { select: { id: true, name: true } },
        service: { select: { id: true, name: true } }, // opcional, por si lo necesitas en la TV
      },
    });

    // Asegúrate de que vienen las propiedades que usa el hook:
    // id, code, calledAt, calledCount, module{name}, (service opcional)
    res.status(200).json(calledTurns);
  } catch (error) {
    console.error('Error fetching called turns:', error);
    res.status(500).json([]);
  }
}
