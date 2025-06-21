// src/pages/api/turns/next.ts
import { prisma } from '@/lib/prisma';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { serviceId, moduleId } = req.body;

  if (!serviceId || !moduleId) {
    return res.status(400).json({ message: 'Faltan parámetros' });
  }

  const nextTurn = await prisma.turn.findFirst({
    where: {
      serviceId,
      status: 'PENDING',
    },
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'asc' },
    ],
  });

  if (!nextTurn) {
    return res.status(404).json({ message: 'No hay turnos en espera' });
  }

  const updatedTurn = await prisma.turn.update({
    where: { id: nextTurn.id },
    data: {
      status: 'CALLED',
      moduleId,
      calledAt: new Date(),
      calledCount: { increment: 1 },
    },
  });

  res.status(200).json(updatedTurn);
}
