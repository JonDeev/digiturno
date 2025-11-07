// pages/api/qz/sign.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

// Usaremos el body RAW para evitar modificaciones del texto a firmar
export const config = { api: { bodyParser: false } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const key = (process.env.QZ_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  if (!key) return res.status(500).send('Missing QZ_PRIVATE_KEY');

  try {
    // Lee el cuerpo crudo
    const chunks: Uint8Array[] = [];
    for await (const chunk of req as any) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString('utf8');

    // Si vino como JSON, extrae .request; si vino text/plain, es el string directo
    const ct = (req.headers['content-type'] || '').toLowerCase();
    const toSign = ct.includes('application/json')
      ? (JSON.parse(raw || '{}').request || '')
      : raw;

    if (!toSign) return res.status(400).send('missing-request');

    const signer = crypto.createSign('RSA-SHA256'); // algoritmo correcto
    signer.update(toSign, 'utf8');
    const signature = signer.sign(key, 'base64');

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.status(200).send(signature);
  } catch (e) {
    console.error('QZ sign error:', e);
    res.status(500).send('sign-error');
  }
}
