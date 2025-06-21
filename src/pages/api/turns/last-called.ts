// src/pages/api/turns/last-called.ts
import { prisma } from '@/lib/prisma';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { serviceId } = req.query;

  if (!serviceId || typeof serviceId !== 'string') {
    return res.status(400).json({ message: 'Parámetro serviceId requerido' });
  }

  try {
    const lastCalled = await prisma.turn.findFirst({
      where: {
        serviceId,
        status: 'CALLED',
      },
      orderBy: {
        calledAt: 'desc',
      },
    });

    res.status(200).json(lastCalled);
  } catch (error) {
    console.error('Error al obtener el último turno llamado:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}
