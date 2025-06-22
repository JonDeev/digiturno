// src/pages/api/turns/call-next.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { authenticate, AuthenticatedRequest } from '@/middleware/auth';
import { prisma } from '@/lib/prisma';

// Encapsulamos handler con autenticación
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return authenticate(req as AuthenticatedRequest, res, async () => {
    const user = (req as AuthenticatedRequest).user;

    if (!user?.moduleId) {
      return res.status(400).json({ message: 'Módulo no asignado al asesor' });
    }

    try {
      // Obtener el módulo del asesor
      const module = await prisma.module.findUnique({
        where: { id: user.moduleId },
        include: { turns: true },
      });

      if (!module) {
        return res.status(404).json({ message: 'Módulo no encontrado' });
      }

      // Encontrar el siguiente turno pendiente del servicio asociado a ese módulo
      const nextTurn = await prisma.turn.findFirst({
        where: {
          status: 'PENDING',
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'asc' },
        ],
        include: {
          service: true,
        },
      });

      if (!nextTurn) {
        return res.status(404).json({ message: 'No hay turnos pendientes' });
      }

      // Marcar el turno como llamado y asociarlo al módulo
      const updatedTurn = await prisma.turn.update({
        where: { id: nextTurn.id },
        data: {
          status: 'CALLED',
          moduleId: user.moduleId,
          calledAt: new Date(),
          calledCount: { increment: 1 },
        },
        include: {
          service: true,
        },
      });

      return res.status(200).json(updatedTurn);
    } catch (error) {
      console.error('Error al llamar siguiente turno:', error);
      return res.status(500).json({ message: 'Error al procesar el turno' });
    }
  });
}
