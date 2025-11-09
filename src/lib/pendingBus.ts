import { EventEmitter } from "events";

type PendingEvents = {
  changed: (serviceId: string) => void;
};

class TypedBus extends EventEmitter {
  emit<K extends keyof PendingEvents>(event: K, ...args: Parameters<PendingEvents[K]>) {
    return super.emit(event, ...args);
  }
  on<K extends keyof PendingEvents>(event: K, listener: PendingEvents[K]) {
    return super.on(event, listener);
  }
}

const g = globalThis as any;

export const pendingBus: TypedBus = g.__PENDING_BUS__ ?? new TypedBus();
if (!g.__PENDING_BUS__) g.__PENDING_BUS__ = pendingBus;

/** Notifica que la cantidad de PENDING pudo cambiar para ese serviceId */
export function notifyPendingChanged(serviceId: string) {
  pendingBus.emit("changed", serviceId);
}
