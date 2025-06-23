// src/pages/api/turns/update-status.ts
import { prisma } from '@/lib/prisma';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { turnId, status } = req.body;

  const validStatuses = ['ATTENDED', 'SKIPPED', 'REQUEUED','ATTENDANCE'];

  if (!turnId || !validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Datos inválidos' });
  }

  const updated = await prisma.turn.update({
    where: { id: turnId },
    data: { status },
  });

  res.status(200).json(updated);
}
