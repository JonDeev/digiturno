// src/pages/api/turns/update-status.ts
import { prisma } from '@/lib/prisma'
import type { NextApiRequest, NextApiResponse } from 'next'
import { notifyPendingChanged } from '@/lib/pendingBus' // ⬅️ YA EXISTÍA
import { notifyRequeuedChanged } from '@/lib/requeuedBus' // ⬅️ NUEVO

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Método no permitido' })

  const { turnId, status, waitCalls } = req.body as {
    turnId?: string
    status?: 'ATTENDED' | 'SKIPPED' | 'REQUEUED' | 'ATTENDANCE' | 'PENDING' | 'CALLED'
    waitCalls?: number // opcional; por defecto 2 para REQUEUED
  }

  const validStatuses = ['ATTENDED', 'SKIPPED', 'REQUEUED', 'ATTENDANCE', 'PENDING', 'CALLED'] as const
  if (!turnId || !status || !validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Datos inválidos' })
  }

  try {
    // ⬅️ capturamos el estado anterior y serviceId
    const prev = await prisma.turn.findUnique({
      where: { id: turnId },
      select: { status: true, serviceId: true },
    })

    let updated
    if (status === 'REQUEUED') {
      // Espera N llamadas (default 2). Guardamos prioridad negativa.
      const wait = Math.max(1, Number.isFinite(Number(waitCalls)) ? Number(waitCalls) : 2)
      updated = await prisma.turn.update({
        where: { id: turnId },
        data: {
          status: 'REQUEUED',
          moduleId: null,               // vuelve a la cola general
          priority: { set: -wait },     // -2 => deberá “avanzar” dos call-next para ser elegible
        },
      })
    } else {
      // Actualización simple para otros estados
      updated = await prisma.turn.update({
        where: { id: turnId },
        data: { status },
      })
    }

    // ⬅️ notificar cambios en PENDING
    if ((prev?.status === 'PENDING') !== (updated.status === 'PENDING')) {
      notifyPendingChanged(updated.serviceId as string)
    }

    // ⬅️ NUEVO: notificar cambios en REQUEUED
    if ((prev?.status === 'REQUEUED') !== (updated.status === 'REQUEUED')) {
      notifyRequeuedChanged(updated.serviceId as string)
    }

    return res.status(200).json(updated)
  } catch (e) {
    console.error('Error en update-status:', e)
    return res.status(500).json({ message: 'Error actualizando estado del turno' })
  }
}
