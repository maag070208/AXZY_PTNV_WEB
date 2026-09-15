import { api } from "@shared/api/client";
import {
  tableRequest,
  type ITDataTableFetchParamsPost,
} from "@shared/api/table";
import type { Device } from "@entities/device";
import type {
  CondicionType,
  InventoryMovement,
  InventorySummary,
  MovementType,
} from "../model/types";

export const inventoryApi = {
  table: (params: ITDataTableFetchParamsPost) =>
    tableRequest<InventoryMovement>(`/inventory/movements/query`, params),
  listMovements: (params?: {
    deviceId?: string;
    departmentId?: string;
    start?: string;
    end?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.deviceId) searchParams.set("deviceId", params.deviceId);
    if (params?.departmentId) searchParams.set("departmentId", params.departmentId);
    if (params?.start) searchParams.set("start", params.start);
    if (params?.end) searchParams.set("end", params.end);
    const qs = searchParams.toString();
    return api.get<InventoryMovement[]>(`/inventory/movements${qs ? `?${qs}` : ""}`);
  },
  getKardex: (deviceId: string) => api.get<{ device: Device; movements: InventoryMovement[] }>(`/inventory/kardex/${deviceId}`),
  registerMovement: (data: {
    deviceId: string;
    tipo: MovementType;
    departmentId?: string;
    notas?: string;
    prestamoId?: string;
    prestadoA?: string;
    fechaRetornoEsperado?: string;
    condicion?: CondicionType;
    motivoBaja?: string;
  }) => api.post<InventoryMovement>(`/inventory/movements`, data),
  getSummary: () => api.get<InventorySummary>(`/inventory/summary`),
};