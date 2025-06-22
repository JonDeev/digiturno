import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Método no permitido' });

  const { serviceId } = req.body;

  if (!serviceId) return res.status(400).json({ message: 'ID de servicio requerido' });

  try {
    // Buscar cuántos turnos hay hoy para ese servicio
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const count = await prisma.turn.count({
      where: {
        serviceId,
        createdAt: { gte: today },
      },
    });

    const number = count + 1;
    const code = `A${number.toString().padStart(3, '0')}`;

    const newTurn = await prisma.turn.create({
      data: {
        number,
        code,
        serviceId,
        status: 'PENDING',
      },
      include: {
        service: true,
      },
    });

    return res.status(200).json(newTurn);
  } catch (error) {
    console.error('Error creando turno:', error);
    return res.status(500).json({ message: 'Error al crear turno' });
  }
}
