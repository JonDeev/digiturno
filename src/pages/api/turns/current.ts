// src/pages/api/turns/current.ts
import { prisma } from '@/lib/prisma';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { moduleId } = req.query;

  if (!moduleId || typeof moduleId !== 'string') {
    return res.status(400).json({ message: 'moduleId es requerido' });
  }

  try {
    const currentTurn = await prisma.turn.findFirst({
      where: {
        moduleId,
        status: 'CALLED',
      },
      orderBy: {
        calledAt: 'desc',
      },
      include: {
        service: true,
      },
    });

    if (!currentTurn) {
      return res.status(404).json({ message: 'No hay turnos actualmente en llamado' });
    }

    res.status(200).json(currentTurn);
  } catch (error) {
    console.error('Error buscando turno actual:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}
