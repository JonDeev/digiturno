import { useEffect, useState } from 'react';
// import jwt_decode from 'jwt-decode';
const jwt_decode = require('jwt-decode').default;



interface DecodedToken {
  userId: string;
  username: string;
  name: string;
  moduleId: string;
  role: string;
  exp: number;
}

export const useUser = () => {
  const [user, setUser] = useState<DecodedToken | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      // const decoded = jwt_decode<DecodedToken>(token);
      const decoded = jwt_decode(token); // ← Esto funcionará después de todo lo anterior
      setUser(decoded);
    } catch (error) {
      console.error('Error al decodificar token:', error);
    }
  }, []);

  return user;
};
