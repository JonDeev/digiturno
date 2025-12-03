// src/middleware/auth.ts
import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export interface AuthenticatedRequest extends NextApiRequest {
  user?: {
    userId: string;
    username: string;
    moduleId: string;
    role: string;
  };
}

export function authenticate(
  req: AuthenticatedRequest,
  res: NextApiResponse,
  next: () => void | Promise<void>
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedRequest['user'];
    req.user = decoded;
    return next(); // ⬅️ importante: devolver la promesa del callback
  } catch (err) {
    return res.status(403).json({ message: 'Token inválido o expirado' });
  }
}
