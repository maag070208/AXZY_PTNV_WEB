import { api } from "./client";
import {
  tableRequest,
  type ITDataTableFetchParamsPost,
} from "./table";

export interface Subarea {
  id: string;
  departmentId: string;
  name: string;
  active: boolean;
}

export interface Department {
  id: string;
  name: string;
  active: boolean;
  subareas: Subarea[];
  _count?: { users: number };
}

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
  remove: (id: string) => api.delete<Department>(`/departments/${id}`),
  addSubarea: (departmentId: string, name: string) =>
    api.post<Subarea>(`/departments/${departmentId}/subareas`, { name }),
  removeSubarea: (subareaId: string) =>
    api.delete<Subarea>(`/departments/subareas/${subareaId}`),
};