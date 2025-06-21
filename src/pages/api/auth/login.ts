import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const { username, password, moduleId } = req.body;

  if (!username || !password || !moduleId) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    const module = await prisma.module.findUnique({ where: { id: moduleId } });

    if (!module || module.status !== 'AVAILABLE') {
      return res.status(400).json({ message: 'El módulo no está disponible' });
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { moduleId },
      }),
      prisma.module.update({
        where: { id: moduleId },
        data: { status: 'OCCUPIED' },
      }),
    ]);

    // Generar token
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        name: user.name,
        moduleId,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.status(200).json({ token });

  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}
