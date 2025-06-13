// /src/pages/api/modules/available.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const availableModules = await prisma.module.findMany({
      where: { status: 'AVAILABLE' },
      select: { id: true, name: true },
    });

    return res.status(200).json(availableModules);
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener módulos disponibles' });
  }
}
