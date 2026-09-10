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

export interface Location {
  id: string;
  lugar?: string | null;
  subLugar?: string | null;
  numero?: string | null;
  descripcion?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { devices: number };
  devices?: Device[];
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
  locationId?: string | null;
  location?: Location | null;
  // Especificaciones técnicas (TIC) — solo aplican a PC / TABLET / LAPTOP
  ip?: string | null;
  macAddress?: string | null;
  sistemaOp?: string | null;
  ram?: string | null;
  almacenamiento?: string | null;
  // Lote (alta por cantidad): dispositivos dados de alta juntos comparten loteId
  loteId?: string | null;
  loteSize?: number;
  loteCount?: { disponible: number; asignado: number; baja: number };
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

export interface DeviceSummary {
  total: number;
  disponible: number;
  asignado: number;
  baja: number;
  tipos: number;
}

export interface LoteSharedUpdate {
  descripcion?: string;
  marca?: string;
  modelo?: string;
  sistemaOp?: string;
  ram?: string;
  almacenamiento?: string;
}

export interface LoteUnitUpdate {
  id: string;
  numeroSerie?: string;
  nombreEquipo?: string;
  ip?: string;
  macAddress?: string;
  area?: string;
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
  summary: () => api.get<DeviceSummary>(`/devices/summary`),
  getLote: (loteId: string) => api.get<{ data: Device[]; total: number }>(`/devices/lotes/${loteId}`),
  updateLote: (loteId: string, data: LoteSharedUpdate & { units: LoteUnitUpdate[] }) =>
    api.put<{ data: Device[]; total: number }>(`/devices/lotes/${loteId}`, data),
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
    ip?: string;
    macAddress?: string;
    sistemaOp?: string;
    ram?: string;
    almacenamiento?: string;
  }) => api.post<Device>(`/devices`, data),
  createBatch: (data: {
    typeId: string;
    descripcion: string;
    marca: string;
    modelo: string;
    area?: string;
    estado?: "DISPONIBLE" | "ASIGNADO" | "BAJA";
    sistemaOp?: string;
    ram?: string;
    almacenamiento?: string;
    units: Array<{
      numeroSerie?: string;
      nombreEquipo?: string;
      ip?: string;
      macAddress?: string;
    }>;
  }) => api.post<{ data: Device[]; total: number }>(`/devices/batch`, data),
  importParse: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post<{ rows: { modelo: string; descripcion: string; cantidad: number }[] }>(
      `/devices/import/parse`,
      form,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
  },
  update: (id: string, data: Partial<{
    typeId: string;
    descripcion: string;
    marca: string;
    modelo: string;
    numeroSerie: string;
    nombreEquipo: string;
    area: string;
    estado: "DISPONIBLE" | "ASIGNADO" | "BAJA";
    ip: string;
    macAddress: string;
    sistemaOp: string;
    ram: string;
    almacenamiento: string;
  }>) => api.put<Device>(`/devices/${id}`, data),
  remove: (id: string, force?: boolean) =>
    api.delete<{ soft: boolean; forced?: boolean; data: Device }>(
      `/devices/${id}${force ? "?force=true" : ""}`
    ),
  getHistory: (id: string) => api.get<DeviceHistoryEntry[]>(`/devices/${id}/history`),
  addHistory: (id: string, data: { type: string; detail?: string }) =>
    api.post<DeviceHistoryEntry>(`/devices/${id}/history`, data),
};