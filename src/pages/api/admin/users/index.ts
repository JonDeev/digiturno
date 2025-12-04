import type { NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { authenticate, AuthenticatedRequest } from '@/middleware/auth'

export default async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ message: 'Método no permitido' })
  }

  return authenticate(req, res, async () => {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'No autorizado' })
    }

    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          username: true,
          numberId: true,
          role: true,
          createdAt: true,
          module: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      return res.status(200).json(
        users.map(u => ({
          id: u.id,
          name: u.name,
          username: u.username,
          numberId: u.numberId,
          role: u.role,
          createdAt: u.createdAt,
          module: u.module ? { id: u.module.id, name: u.module.name } : null,
        })),
      )
    } catch (error) {
      console.error('Error en /api/admin/users:', error)
      return res.status(500).json({ message: 'Error interno del servidor' })
    }
  })
}
