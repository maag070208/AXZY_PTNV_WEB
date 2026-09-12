import { api } from "@core/api/client";
import {
  tableRequest,
  type ITDataTableFetchParamsPost,
} from "@core/api/table";
import type {
  MaterialOutput,
  MaterialOutputInput,
  SalidaFilters,
  SalidaSuggestions,
} from "../model/types";

const buildQuery = (filters: SalidaFilters = {}): string => {
  const params = new URLSearchParams();
  if (filters.start) params.set("start", filters.start);
  if (filters.end) params.set("end", filters.end);
  if (filters.departamento) params.set("departamento", filters.departamento);
  if (filters.usuario) params.set("usuario", filters.usuario);
  if (filters.area) params.set("area", filters.area);
  if (filters.proyecto) params.set("proyecto", filters.proyecto);
  if (filters.q) params.set("q", filters.q);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
};

export const salidasApi = {
  table: (params: ITDataTableFetchParamsPost) =>
    tableRequest<MaterialOutput>(`/salidas/query`, params),
  list: (filters: SalidaFilters = {}) =>
    api.get<{ data: MaterialOutput[]; total: number }>(`/salidas${buildQuery(filters)}`),
  get: (id: string) => api.get<MaterialOutput>(`/salidas/${id}`),
  create: (data: MaterialOutputInput) => api.post<MaterialOutput>(`/salidas`, data),
  createBatch: (rows: MaterialOutputInput[]) =>
    api.post<{ data: MaterialOutput[]; total: number }>(`/salidas/batch`, { rows }),
  update: (id: string, data: Partial<MaterialOutputInput>) =>
    api.put<MaterialOutput>(`/salidas/${id}`, data),
  remove: (id: string) => api.delete<MaterialOutput>(`/salidas/${id}`),
  suggestions: () => api.get<SalidaSuggestions>(`/salidas/suggestions`),
};