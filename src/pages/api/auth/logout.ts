import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      moduleId: string;
    };

    // Marcar módulo como disponible y quitarlo del usuario
    await prisma.$transaction([
      prisma.user.update({
        where: { id: decoded.userId },
        data: { moduleId: null },
      }),
      prisma.module.update({
        where: { id: decoded.moduleId },
        data: { status: 'AVAILABLE' },
      }),
    ]);

    return res.status(200).json({ message: 'Logout exitoso' });
  } catch (error) {
    console.error('Error en logout:', error);
    return res.status(403).json({ message: 'Token inválido o expirado' });
  }
}
