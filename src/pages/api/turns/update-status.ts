// src/pages/api/turns/update-status.ts
import { prisma } from '@/lib/prisma'
import type { NextApiRequest, NextApiResponse } from 'next'
import { notifyPendingChanged } from '@/lib/pendingBus'
import { notifyRequeuedChanged } from '@/lib/requeuedBus'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Método no permitido' })

  const { turnId, status, waitCalls } = req.body as {
    turnId?: string
    status?: 'ATTENDED' | 'SKIPPED' | 'REQUEUED' | 'ATTENDANCE' | 'PENDING' | 'CALLED'
    waitCalls?: number
  }

  const validStatuses = ['ATTENDED', 'SKIPPED', 'REQUEUED', 'ATTENDANCE', 'PENDING', 'CALLED'] as const
  if (!turnId || !status || !validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Datos inválidos' })
  }

  try {
    const prev = await prisma.turn.findUnique({
      where: { id: turnId },
      select: {
        status: true,
        serviceId: true,
        attentionStartedAt: true,
        attentionFinishedAt: true, // ⬅️ NUEVO
      },
    })

    if (!prev) {
      return res.status(404).json({ message: 'Turno no encontrado' })
    }

    const now = new Date()
    let updated

    if (status === 'REQUEUED') {
      const wait = Math.max(1, Number.isFinite(Number(waitCalls)) ? Number(waitCalls) : 2)
      updated = await prisma.turn.update({
        where: { id: turnId },
        data: {
          status: 'REQUEUED',
          moduleId: null,
          priority: { set: -wait },
        },
      })
    } else if (status === 'ATTENDANCE') {
      // INICIO DE ATENCIÓN
      updated = await prisma.turn.update({
        where: { id: turnId },
        data: {
          status: 'ATTENDANCE',
          ...(prev.attentionStartedAt ? {} : { attentionStartedAt: now }),
        },
      })
    } else if (status === 'ATTENDED') {
      // FIN DE ATENCIÓN
      updated = await prisma.turn.update({
        where: { id: turnId },
        data: {
          status: 'ATTENDED',
          ...(prev.attentionFinishedAt ? {} : { attentionFinishedAt: now }),
        },
      })
    } else {
      // Otros estados sin lógica especial
      updated = await prisma.turn.update({
        where: { id: turnId },
        data: { status },
      })
    }

    if ((prev.status === 'PENDING') !== (updated.status === 'PENDING')) {
      notifyPendingChanged(updated.serviceId as string)
    }

    if ((prev.status === 'REQUEUED') !== (updated.status === 'REQUEUED')) {
      notifyRequeuedChanged(updated.serviceId as string)
    }

    return res.status(200).json(updated)
  } catch (e) {
    console.error('Error en update-status:', e)
    return res.status(500).json({ message: 'Error actualizando estado del turno' })
  }
}
