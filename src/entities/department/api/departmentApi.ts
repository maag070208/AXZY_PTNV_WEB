import { api } from "@core/api/client";
import {
  tableRequest,
  type ITDataTableFetchParamsPost,
} from "@core/api/table";
import type { Department, Subarea } from "../model/types";

export const departmentsApi = {
  table: (params: ITDataTableFetchParamsPost) =>
    tableRequest<Department>(`/departments/query`, params),
  list: (includeInactive = false) =>
    api.get<Department[]>(`/departments${includeInactive ? "?includeInactive=true" : ""}`),
  get: (id: string) => api.get<Department>(`/departments/${id}`),
  create: (data: { name: string }) =>
    api.post<Department>(`/departments`, data),
  update: (id: string, data: { name?: string; active?: boolean }) =>
    api.put<Department>(`/departments/${id}`, data),
  remove: (id: string) => api.delete<{ soft: boolean; data: Department }>(`/departments/${id}`),
  addSubarea: (departmentId: string, name: string) =>
    api.post<Subarea>(`/departments/${departmentId}/subareas`, { name }),
  removeSubarea: (subareaId: string) =>
    api.delete<{ soft: boolean; data: Subarea }>(`/departments/subareas/${subareaId}`),
};