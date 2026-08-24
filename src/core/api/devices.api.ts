import { api } from "./client";
import {
  tableRequest,
  type ITDataTableFetchParamsPost,
} from "./table";

export interface DeviceType {
  id: string;
  code: string;
  name: string;
  prefix: string;
  contador: number;
  active: boolean;
  _count?: { devices: number };
}

export interface Device {
  id: string;
  typeId: string;
  type?: DeviceType;
  controlActivos: string;
  descripcion: string;
  marca: string;
  modelo: string;
  numeroSerie?: string | null;
  nombreEquipo?: string | null;
  area: string;
  estado: "DISPONIBLE" | "ASIGNADO" | "BAJA";
  history?: DeviceHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface DeviceHistoryEntry {
  id: string;
  deviceId: string;
  type: string;
  detail?: string | null;
  autor?: { id: string; name: string; username: string } | null;
  createdAt: string;
}

export const deviceTypesApi = {
  table: (params: ITDataTableFetchParamsPost) =>
    tableRequest<DeviceType>(`/device-types/query`, params),
  list: (includeInactive = false) =>
    api.get<DeviceType[]>(`/device-types${includeInactive ? "?includeInactive=true" : ""}`),
  peek: (id: string) => api.get<{ siguiente: string }>(`/device-types/${id}/peek`),
  peekCarta: (id: string) => api.get<{ siguiente: string }>(`/device-types/${id}/peek-carta`),
  get: (id: string) => api.get<DeviceType>(`/device-types/${id}`),
  create: (data: { code: string; name: string; prefix: string }) =>
    api.post<DeviceType>(`/device-types`, data),
  update: (id: string, data: { name?: string; prefix?: string; active?: boolean }) =>
    api.put<DeviceType>(`/device-types/${id}`, data),
  remove: (id: string) => api.delete<DeviceType>(`/device-types/${id}`),
};

export const devicesApi = {
  table: (params: ITDataTableFetchParamsPost) =>
    tableRequest<Device>(`/devices/query`, params),
  list: (filters: { typeId?: string; estado?: string; q?: string } = {}) => {
    const params = new URLSearchParams();
    if (filters.typeId) params.set("typeId", filters.typeId);
    if (filters.estado) params.set("estado", filters.estado);
    if (filters.q) params.set("q", filters.q);
    const qs = params.toString();
    return api.get<{ data: Device[]; total: number }>(`/devices${qs ? `?${qs}` : ""}`);
  },
  get: (id: string) => api.get<Device>(`/devices/${id}`),
  create: (data: {
    typeId: string;
    descripcion: string;
    marca: string;
    modelo: string;
    numeroSerie?: string;
    nombreEquipo?: string;
    area?: string;
    estado?: "DISPONIBLE" | "ASIGNADO" | "BAJA";
  }) => api.post<Device>(`/devices`, data),
  update: (id: string, data: Partial<{
    typeId: string;
    descripcion: string;
    marca: string;
    modelo: string;
    numeroSerie: string;
    nombreEquipo: string;
    area: string;
    estado: "DISPONIBLE" | "ASIGNADO" | "BAJA";
  }>) => api.put<Device>(`/devices/${id}`, data),
  remove: (id: string) => api.delete<Device>(`/devices/${id}`),
  getHistory: (id: string) => api.get<DeviceHistoryEntry[]>(`/devices/${id}/history`),
  addHistory: (id: string, data: { type: string; detail?: string }) =>
    api.post<DeviceHistoryEntry>(`/devices/${id}/history`, data),
};