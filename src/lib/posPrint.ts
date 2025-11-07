// lib/posPrint.ts
declare global { interface Window { qz: any } }

// ==== ESC/POS helpers ====

/** Tamaño (ancho x alto) 1..8 */
const sz = (w: number, h: number) =>
  String.fromCharCode(0x1D, 0x21, (((w - 1) << 4) | (h - 1)) & 0xff);

/** Feed n líneas (ESC d n) */
const feed = (n: number) => '\x1B\x64' + String.fromCharCode(Math.max(0, Math.min(255, n)));

/** Bytes → string binario para RAW */
function bytesToStr(bytes: number[] | Uint8Array): string {
  let out = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    const slice = (bytes as Uint8Array).subarray
      ? (bytes as Uint8Array).subarray(i, i + CHUNK)
      : (bytes as number[]).slice(i, i + CHUNK);
    out += String.fromCharCode(...(slice as any));
  }
  return out;
}

/** String binario → HEX seguro para QZ (evita re-codificaciones) */
const toHex = (s: string) =>
  Array.from(s, ch => ch.charCodeAt(0).toString(16).padStart(2, '0')).join('');

/**
 * Rasteriza PNG a ESC/POS (GS v 0) y recorta filas vacías (aire) del logo.
 */
async function escposRasterFromUrl(url: string, maxDots = 520): Promise<string | null> {
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = url + (url.includes('?') ? '&' : '?') + 'v=' + Date.now();
    });

    // Escalar al ancho máximo del cabezal (80mm ≈ 480–576 dots)
    const scale = Math.min(1, maxDots / img.width);
    const w = Math.max(1, Math.floor(img.width * scale));
    const h = Math.max(1, Math.floor(img.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, w, h);

    const { data } = ctx.getImageData(0, 0, w, h);

    // Detectar filas con tinta (umbral)
    const TH = 170;
    const hasInkRow = (y: number) => {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const a = data[i + 3];
        if (!a) continue;
        const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        if (lum < TH) return true;
      }
      return false;
    };

    // Recorte top/bottom vacío
    let yTop = 0;
    while (yTop < h && !hasInkRow(yTop)) yTop++;
    let yBottom = h - 1;
    while (yBottom > yTop && !hasInkRow(yBottom)) yBottom--;
    const cropH = Math.max(1, yBottom - yTop + 1);

    // Empaquetar a GS v 0
    const bytesPerRow = Math.ceil(w / 8);
    const xL = bytesPerRow & 0xff, xH = (bytesPerRow >> 8) & 0xff;
    const yL = cropH & 0xff, yH = (cropH >> 8) & 0xff;

    const out: number[] = [];
    out.push(0x1D, 0x76, 0x30, 0x00, xL, xH, yL, yH);

    for (let y = 0; y < cropH; y++) {
      const srcY = yTop + y;
      for (let xb = 0; xb < bytesPerRow; xb++) {
        let b = 0;
        for (let bit = 0; bit < 8; bit++) {
          const x = xb * 8 + bit;
          if (x < w) {
            const idx = (srcY * w + x) * 4;
            const a = data[idx + 3];
            const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
            if (a > 0 && lum < TH) b |= (0x80 >> bit); // 1 = negro
          }
        }
        out.push(b);
      }
    }
    return bytesToStr(out);
  } catch {
    return null;
  }
}

// ==== QZ Tray connect ====
let securityReady = false;

export async function qzConnect() {
  const qz = window.qz;
  if (!qz) throw new Error('QZ Tray no está cargado');

  if (!securityReady) {
    if (qz.security.setSignatureAlgorithm) qz.security.setSignatureAlgorithm('SHA256');
    qz.security.setCertificatePromise((resolve: any, reject: any) => {
      fetch('/api/qz/cert').then(r => r.text()).then(resolve).catch(reject);
    });
    qz.security.setSignaturePromise((toSign: string) => (resolve: any, reject: any) => {
      fetch('/api/qz/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: toSign,
      }).then(r => r.text()).then(resolve).catch(reject);
    });
    securityReady = true;
  }

  if (!qz.websocket.isActive()) await qz.websocket.connect();
}

// ==== Print ticket (compacto y seguro) ====
export async function printTurnE200i(data: {
  code: string;
  service?: { name?: string } | null;
  note?: string;
  website?: string;
}) {
  await qzConnect();

  const qz = window.qz;
  const printer = await qz.printers.getDefault();
  if (!printer) throw new Error('No se encontró impresora predeterminada');

  const cfg = await qz.configs.create(printer, { copies: 1 });

  // Logo ya recortado de espacios vacíos
  const logo = await escposRasterFromUrl('/sism-logo.png', 520);

  const fecha = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' });
  const SERVICE = (data?.service?.name ?? '').toUpperCase();

  let raw = '';
  raw += '\x1B\x40';      // init
  raw += '\x1B\x74\x10';  // CP1252
  raw += '\x1B\x4D\x00';  // Font A
  raw += '\x1B\x33' + String.fromCharCode(22); // interlineado compacto (22 dots)

  // Logo centrado
  if (logo) {
    raw += '\x1B\x61\x01'; // center
    raw += logo;           // GS v 0 (binario)
    raw += '\x1B\x64\x01'; // feed(1)
  }

  // TURNO
  raw += '\x1B\x61\x01';
  raw += '\x1B\x45\x01' + sz(2, 2) + 'TURNO\n' + '\x1B\x45\x00';

  // Código grande
  raw += '\x1B\x61\x01';
  raw += '\x1B\x45\x01' + sz(4, 4) + `${data.code}\n` + '\x1B\x45\x00';

  // Servicio (alto doble)
  if (SERVICE) raw += sz(1, 2) + `${SERVICE}\n` + sz(1, 1);

  // Fecha
  raw += `${fecha}\n`;

  // Nota (tu texto)
  raw += '\x1B\x45\x01' + sz(1, 1) + 'SU TURNO APARECE EN PANTALLA DEBE ESPERAR\n' + '\x1B\x45\x00';

  // Web
  raw += '\x1B\x45\x01' + sz(1, 1) + 'www.sism.com.co\n' + '\x1B\x45\x00';

  // ---------- AJUSTE DE CORTE (AQUÍ EL CAMBIO) ----------
  // Más líneas de respiro y corte al final.
  raw += '\x1B\x64\x11';   // feed(12) -> ajusta a 5–8 si quieres más aire
  raw += '\x1D\x56\x00';   // corte TOTAL (m=0) justo aquí
  // ------------------------------------------------------

  // Enviar como antes (tu QZ ya lo acepta)
  await qz.print(cfg, [{ type: 'raw', format: 'hex', data: Array.from(raw, ch => ch.charCodeAt(0).toString(16).padStart(2, '0')).join('') }]);
}
