import { api } from "./client";
import type { Device, Location } from "./devices.api";

export type MovementType = "ENTRADA" | "SALIDA" | "TRASLADO" | "BAJA" | "PRESTAMO" | "DEVOLUCION";

export type CondicionType = "BUENO" | "ACEPTABLE" | "MALO" | "ROTO";

export interface InventoryMovement {
  id: string;
  deviceId: string;
  device: Device;
  locationId?: string | null;
  location?: Location | null;
  tipo: MovementType;
  notas?: string | null;
  userId: string;
  user: { id: string; name: string; username: string };
  createdAt: string;
  prestamoId?: string | null;
  prestamo?: InventoryMovement | null;
  prestadoA?: string | null;
  fechaRetornoEsperado?: string | null;
  condicion?: CondicionType | null;
  motivoBaja?: string | null;
}

export interface InventorySummary {
  locations: Location[];
  stats: {
    totalDevices: number;
    locatedDevices: number;
    unlocatedDevices: number;
  };
}

export const inventoryApi = {
  listMovements: (params?: {
    deviceId?: string;
    locationId?: string;
    start?: string;
    end?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.deviceId) searchParams.set("deviceId", params.deviceId);
    if (params?.locationId) searchParams.set("locationId", params.locationId);
    if (params?.start) searchParams.set("start", params.start);
    if (params?.end) searchParams.set("end", params.end);
    const qs = searchParams.toString();
    return api.get<InventoryMovement[]>(`/inventory/movements${qs ? `?${qs}` : ""}`);
  },
  getKardex: (deviceId: string) => api.get<{ device: Device; movements: InventoryMovement[] }>(`/inventory/kardex/${deviceId}`),
  registerMovement: (data: {
    deviceId: string;
    tipo: MovementType;
    locationId?: string;
    notas?: string;
    prestamoId?: string;
    prestadoA?: string;
    fechaRetornoEsperado?: string;
    condicion?: CondicionType;
    motivoBaja?: string;
  }) => api.post<InventoryMovement>(`/inventory/movements`, data),
  getSummary: () => api.get<InventorySummary>(`/inventory/summary`),
};
