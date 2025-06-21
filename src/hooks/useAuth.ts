import { useEffect } from 'react';
import { useRouter } from 'next/router';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXT_PUBLIC_JWT_SECRET || '';

export const useAuth = () => {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      router.push('/login');
      return;
    }

    try {
      // Validar que el token sea válido y no esté expirado
      const decoded = jwt.decode(token) as any;

      if (!decoded || decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem('token');
        router.push('/login');
      }
    } catch (error) {
      console.error('Token inválido', error);
      localStorage.removeItem('token');
      router.push('/login');
    }
  }, []);
};
