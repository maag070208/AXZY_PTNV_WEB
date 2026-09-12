import { api } from "@core/api/client";
import { tableRequest, type ITDataTableFetchParamsPost } from "@core/api/table";
import type {
  Device,
  DeviceHistoryEntry,
  DeviceSummary,
  LoteSharedUpdate,
  LoteUnitUpdate,
} from "../model/types";

export const deviceApi = {
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
    return api.post<{
      rows: { modelo: string; descripcion: string; cantidad: number; marca?: string; tipo?: string }[];
      errors?: string[];
    }>(
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
  addUnits: (id: string, cantidad: number) =>
    api.post<{ loteId: string; data: Device[]; total: number }>(
      `/devices/${id}/add-units`,
      { cantidad }
    ),
  remove: (id: string, force?: boolean) =>
    api.delete<{ soft: boolean; forced?: boolean; data: Device }>(
      `/devices/${id}${force ? "?force=true" : ""}`
    ),
  getHistory: (id: string) => api.get<DeviceHistoryEntry[]>(`/devices/${id}/history`),
  addHistory: (id: string, data: { type: string; detail?: string }) =>
    api.post<DeviceHistoryEntry>(`/devices/${id}/history`, data),
};
