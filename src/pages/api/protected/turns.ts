import type { NextApiResponse } from 'next';
import { authenticate, AuthenticatedRequest } from '@/middleware/auth';

export default function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  authenticate(req, res, () => {
    // Ahora puedes acceder a req.user
    res.status(200).json({
      message: 'Acceso autorizado',
      user: req.user,
    });
  });
}
