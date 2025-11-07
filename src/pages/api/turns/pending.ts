// src/pages/api/turns/pending.ts
import { prisma } from '@/lib/prisma';
import { NextApiRequest, NextApiResponse } from 'next';

/** Rango de hoy en zona America/Bogota (inicio incluido, fin excluido) */
function getTodayRangeBogota() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const y = parts.find(p => p.type === 'year')!.value;
  const m = parts.find(p => p.type === 'month')!.value;
  const d = parts.find(p => p.type === 'day')!.value;

  // Colombia no usa DST; -05:00 estable
  const start = new Date(`${y}-${m}-${d}T00:00:00-05:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { serviceId } = req.query;

  if (!serviceId || typeof serviceId !== 'string') {
    return res.status(400).json({ message: 'Parámetro serviceId requerido' });
  }

  // ✅ NUEVO: filtrar por "creados hoy" en zona America/Bogota
  const { start, end } = getTodayRangeBogota();

  const count = await prisma.turn.count({
    where: {
      serviceId,
      status: 'PENDING',
      createdAt: { gte: start, lt: end }, // <-- añadido
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
