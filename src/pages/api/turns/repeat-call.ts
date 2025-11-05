// src/pages/api/turns/repeat-call.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { authenticate, AuthenticatedRequest } from '@/middleware/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Método no permitido' })

  return authenticate(req as AuthenticatedRequest, res, async () => {
    const { turnId } = req.body as { turnId?: string }
    const user = (req as AuthenticatedRequest).user

    if (!turnId) return res.status(400).json({ message: 'turnId requerido' })
    if (!user?.moduleId) return res.status(400).json({ message: 'Módulo no asignado al asesor' })

    try {
      const result = await prisma.$transaction(async (tx) => {
        // 1) Traer el turno
        const turn = await tx.turn.findUnique({ where: { id: turnId } })
        if (!turn) return { code: 404 as const, body: { message: 'Turno no encontrado' } }

        // 2) Validaciones de negocio
        if (turn.moduleId !== user.moduleId) {
          return { code: 403 as const, body: { message: 'El turno no está asignado a tu módulo' } }
        }
        if (turn.status !== 'CALLED') {
          return { code: 409 as const, body: { message: 'Sólo puedes repetir llamado de un turno en estado CALLED' } }
        }

        // 3) Actualizar de forma segura (evitar carrera)
        const ok = await tx.turn.updateMany({
          where: { id: turnId, status: 'CALLED', moduleId: user.moduleId },
          data: {
            calledAt: new Date(),
            calledCount: { increment: 1 },
          },
        })
        if (ok.count === 0) {
          // alguien cambió el estado entre el read y el update
          return { code: 409 as const, body: { message: 'El turno cambió de estado. Intenta de nuevo.' } }
        }

        const updated = await tx.turn.findUnique({ where: { id: turnId }, include: { service: true } })
        return { code: 200 as const, body: updated! }
      })

      return res.status(result.code).json(result.body)
    } catch (e) {
      console.error('Error en repeat-call:', e)
      return res.status(500).json({ message: 'Error al repetir llamado' })
    }
  })
}
