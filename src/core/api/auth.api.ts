import { api } from "./client";
import {
  tableRequest,
  type ITDataTableFetchParamsPost,
} from "./table";

export type UserRole = "ADMIN" | "GERENTE" | "JEFE_DE_AREA" | "EMPLEADO";

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface User extends AuthUser {
  active: boolean;
  puesto?: string;
  area?: string;
  numeroEmpleado?: string;
  departmentId?: string | null;
  subareaId?: string | null;
}

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
  empleados: (departmentId?: string) => {
    const qs = departmentId ? `?departmentId=${encodeURIComponent(departmentId)}` : "";
    return api.get<User[]>(`/users/empleados${qs}`);
  },
  create: (data: {
    username: string;
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
  delete: (id: string) => api.delete<{ id: string; active: boolean }>(`/users/${id}`),
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