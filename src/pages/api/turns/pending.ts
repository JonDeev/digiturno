import { prisma } from '@/lib/prisma';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { serviceId } = req.query;

  if (!serviceId || typeof serviceId !== 'string') {
    return res.status(400).json({ message: 'Parámetro serviceId requerido' });
  }

  const count = await prisma.turn.count({
    where: {
      serviceId,
      status: 'PENDING',
    },
  });

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
  });

  res.status(200).json({
    count,
    name: service?.name || 'Servicio desconocido',
  });
}
