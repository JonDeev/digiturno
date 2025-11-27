// src/lib/requeuedBus.ts
import { EventEmitter } from "events";

type RequeuedEvents = {
  changed: (serviceId: string) => void;
};

class TypedBus extends EventEmitter {
  emit<K extends keyof RequeuedEvents>(event: K, ...args: Parameters<RequeuedEvents[K]>) {
    return super.emit(event, ...args);
  }
  on<K extends keyof RequeuedEvents>(event: K, listener: RequeuedEvents[K]) {
    return super.on(event, listener);
  }
}

const g = globalThis as any;

export const requeuedBus: TypedBus = g.__REQUEUED_BUS__ ?? new TypedBus();
if (!g.__REQUEUED_BUS__) g.__REQUEUED_BUS__ = requeuedBus;

/** Notifica que la cantidad de REQUEUED pudo cambiar para ese serviceId */
export function notifyRequeuedChanged(serviceId: string) {
  requeuedBus.emit("changed", serviceId);
}
