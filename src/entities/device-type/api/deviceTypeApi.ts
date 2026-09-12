import { api } from "@core/api/client";
import { tableRequest, type ITDataTableFetchParamsPost } from "@core/api/table";
import type { DeviceFieldConfig, DeviceType } from "../model/types";

export const deviceTypeApi = {
  table: (params: ITDataTableFetchParamsPost) =>
    tableRequest<DeviceType>(`/device-types/query`, params),
  list: (includeInactive = false) =>
    api.get<DeviceType[]>(`/device-types${includeInactive ? "?includeInactive=true" : ""}`),
  peek: (id: string) => api.get<{ siguiente: string }>(`/device-types/${id}/peek`),
  peekCarta: (id: string) => api.get<{ siguiente: string }>(`/device-types/${id}/peek-carta`),
  get: (id: string) => api.get<DeviceType>(`/device-types/${id}`),
  create: (data: { code: string; name: string; prefix: string; fieldConfig?: DeviceFieldConfig }) =>
    api.post<DeviceType>(`/device-types`, data),
  update: (id: string, data: { name?: string; prefix?: string; active?: boolean; fieldConfig?: DeviceFieldConfig }) =>
    api.put<DeviceType>(`/device-types/${id}`, data),
  remove: (id: string) => api.delete<DeviceType>(`/device-types/${id}`),
};
