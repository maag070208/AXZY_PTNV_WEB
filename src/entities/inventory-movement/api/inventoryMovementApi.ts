import { api } from "@core/api/client";
import type { Device } from "@entities/device";
import type {
  CondicionType,
  InventoryMovement,
  InventorySummary,
  MovementType,
} from "../model/types";

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