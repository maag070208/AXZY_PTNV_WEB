import { api } from "@shared/api/client";
import {
  tableRequest,
  type ITDataTableFetchParamsPost,
} from "@shared/api/table";
import type {
  MaterialOutput,
  MaterialOutputInput,
  MaterialOutputFilters,
  MaterialOutputSuggestions,
} from "../model/types";

const buildQuery = (filters: MaterialOutputFilters = {}): string => {
  const params = new URLSearchParams();
  if (filters.start) params.set("start", filters.start);
  if (filters.end) params.set("end", filters.end);
  if (filters.departmentName) params.set("departmentName", filters.departmentName);
  if (filters.userName) params.set("userName", filters.userName);
  if (filters.area) params.set("area", filters.area);
  if (filters.project) params.set("project", filters.project);
  if (filters.reason) params.set("reason", filters.reason);
  if (filters.q) params.set("q", filters.q);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
};

export const materialOutputsApi = {
  table: (params: ITDataTableFetchParamsPost) =>
    tableRequest<MaterialOutput>(`/material-outputs/query`, params),
  list: (filters: MaterialOutputFilters = {}) =>
    api.get<{ data: MaterialOutput[]; total: number }>(`/material-outputs${buildQuery(filters)}`),
  get: (id: string) => api.get<MaterialOutput>(`/material-outputs/${id}`),
  create: (data: MaterialOutputInput) => api.post<MaterialOutput>(`/material-outputs`, data),
  createBatch: (rows: MaterialOutputInput[]) =>
    api.post<{ data: MaterialOutput[]; total: number }>(`/material-outputs/batch`, { rows }),
  update: (id: string, data: Partial<MaterialOutputInput>) =>
    api.put<MaterialOutput>(`/material-outputs/${id}`, data),
  remove: (id: string) => api.delete<MaterialOutput>(`/material-outputs/${id}`),
  suggestions: () => api.get<MaterialOutputSuggestions>(`/material-outputs/suggestions`),
};