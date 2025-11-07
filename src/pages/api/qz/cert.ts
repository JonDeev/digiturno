// pages/api/qz/cert.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  const cert = (process.env.QZ_PUBLIC_CERT || '').replace(/\\n/g, '\n');
  if (!cert) return res.status(500).send('Missing QZ_PUBLIC_CERT');
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.status(200).send(cert);
}
