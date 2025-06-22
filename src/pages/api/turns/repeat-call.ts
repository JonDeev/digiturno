// src/pages/api/turns/repeat-call.ts
import { prisma } from '@/lib/prisma';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { turnId } = req.body;

  if (!turnId) {
    return res.status(400).json({ message: 'turnId requerido' });
  }

  const repeated = await prisma.turn.update({
    where: { id: turnId },
    data: {
      calledAt: new Date(),
      calledCount: { increment: 1 },
    },
  });

  res.status(200).json(repeated);
}
