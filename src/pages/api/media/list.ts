// src/pages/api/media/list.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const media = await prisma.media.findMany({
      where: { isActive: true },
      orderBy: [
        { order: 'asc' },
        { id: 'asc' },
      ],
    });

    return res.status(200).json(media);
  } catch (error) {
    console.error('Error fetching media list:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
