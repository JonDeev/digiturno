// src/pages/api/turns/called.ts
import { prisma } from '@/lib/prisma';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const calledTurns = await prisma.turn.findMany({
      where: { status: 'CALLED' },
      orderBy: { calledAt: 'desc' },
      take: 10,
      include: { module: true },
    });

    res.status(200).json(calledTurns);
  } catch (error) {
    console.error('Error fetching called turns:', error);
    res.status(500).json({ error: 'Error fetching called turns' });
  }
}

