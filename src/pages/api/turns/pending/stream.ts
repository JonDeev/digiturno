import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { pendingBus } from "@/lib/pendingBus";

/** Inicio y fin del día de Bogotá en UTC (sin DST) */
function getBogotaDayBounds(base = new Date()) {
  const tz = "America/Bogota";
  const y = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric" }).format(base);
  const m = new Intl.DateTimeFormat("en-CA", { timeZone: tz, month: "2-digit" }).format(base);
  const d = new Intl.DateTimeFormat("en-CA", { timeZone: tz, day: "2-digit" }).format(base);
  const start = new Date(`${y}-${m}-${d}T00:00:00.000-05:00`);
  const end = new Date(`${y}-${m}-${d}T23:59:59.999-05:00`);
  return { start, end };
}

export const config = { api: { bodyParser: false } };

function writeEvent(res: NextApiResponse, event: string, payload: any) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const serviceId = req.query.serviceId;
  if (typeof serviceId !== "string" || !serviceId) {
    res.status(400).end("serviceId requerido");
    return;
  }

  // Cabeceras SSE
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // Nginx: desactiva buffering

  // Snapshot inicial
  const { start, end } = getBogotaDayBounds();
  const [count, svc] = await Promise.all([
    prisma.turn.count({
      where: { serviceId, status: "PENDING", createdAt: { gte: start, lte: end } },
    }),
    prisma.service.findUnique({ where: { id: serviceId } }),
  ]);
  writeEvent(res, "snapshot", { count, name: svc?.name ?? "Servicio" });

  // Keep-alive
  const ping = setInterval(() => res.write(": ping\n\n"), 15000);

  // Debounce por si llegan ráfagas
  let scheduled = false;
  const schedulePush = () => {
    if (scheduled) return;
    scheduled = true;
    setTimeout(async () => {
      scheduled = false;
      const { start, end } = getBogotaDayBounds();
      const n = await prisma.turn.count({
        where: { serviceId, status: "PENDING", createdAt: { gte: start, lte: end } },
      });
      writeEvent(res, "count", { count: n });
    }, 60);
  };

  const listener = (sid: string) => {
    if (sid === serviceId) schedulePush();
  };

  pendingBus.on("changed", listener);

  req.on("close", () => {
    clearInterval(ping);
    pendingBus.off("changed", listener);
    res.end();
  });
}
