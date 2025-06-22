// src/pages/api/turns/called.ts
import { prisma } from '@/lib/prisma';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const calledTurn = await prisma.turn.findFirst({
    where: { status: 'CALLED' },
    orderBy: { calledAt: 'desc' },
    include: { module: true },
  });

  res.status(200).json(calledTurn || null);
}
