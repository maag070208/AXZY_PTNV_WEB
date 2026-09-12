import { api } from "@core/api/client";
import {
  tableRequest,
  type ITDataTableFetchParamsPost,
} from "@core/api/table";
import type { AuthUser, LoginResponse, User, UserRole } from "../model/types";

export const authApi = {
  login: (username: string, password: string) =>
    api.post<LoginResponse>(`/auth/login`, { username, password }),
  me: () => api.get<AuthUser>(`/auth/me`),
};

export const usersApi = {
  table: (params: ITDataTableFetchParamsPost) =>
    tableRequest<User>(`/users/query`, params),
  list: (role?: UserRole) => {
    const qs = role ? `?role=${role}` : "";
    return api.get<User[]>(`/users${qs}`);
  },
  get: (id: string) => api.get<User>(`/users/${id}`),
  empleados: (departmentId?: string, q?: string) => {
    const params = new URLSearchParams();
    if (departmentId) params.set("departmentId", departmentId);
    if (q) params.set("q", q);
    const qs = params.toString();
    return api.get<User[]>(`/users/empleados${qs ? `?${qs}` : ""}`);
  },
  empleadosPorRoles: (roles: UserRole[], departmentId?: string, q?: string) => {
    const params = new URLSearchParams();
    if (roles.length) params.set("roles", roles.join(","));
    if (departmentId) params.set("departmentId", departmentId);
    if (q) params.set("q", q);
    const qs = params.toString();
    return api.get<User[]>(`/users/empleados${qs ? `?${qs}` : ""}`);
  },
  create: (data: {
    username: string;
    email?: string;
    password: string;
    name: string;
    role: UserRole;
    puesto?: string;
    area?: string;
    numeroEmpleado?: string;
    departmentId?: string;
    subareaId?: string;
  }) => api.post<User>(`/users`, data),
  update: (
    id: string,
    data: {
      username?: string;
      email?: string | null;
      name?: string;
      role?: UserRole;
      active?: boolean;
      puesto?: string;
      area?: string;
      numeroEmpleado?: string;
      departmentId?: string | null;
      subareaId?: string | null;
    }
  ) => api.put<User>(`/users/${id}`, data),
  changePassword: (id: string, password: string) =>
    api.put<void>(`/users/${id}/password`, { password }),
  import: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post<{
      creados: number;
      omitidos: { fila: number; username: string; motivo: string }[];
    }>(`/users/import`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  delete: (id: string, force?: boolean) =>
    api.delete<{ soft: boolean; forced?: boolean; data: User }>(
      `/users/${id}${force ? "?force=true" : ""}`
    ),
  history: (id: string) =>
    api.get<Array<{
      id: string;
      type: string;
      title: string;
      detail: string;
      timestamp: string;
      refId?: string;
    }>>(`/users/${id}/history`),
};