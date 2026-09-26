import { post } from "@shared/api/client";
import type { ITDataTableFetchParamsPost } from "@shared/api/table";
import type {
  AssignedDevicesExportResponse,
  AssignedDevicesTableResponse,
  DevicesExportResponse,
  DevicesTableResponse,
} from "../model/types";

export const reportsApi = {
  /** Instantáneas server-side: paginación, filtros y orden se resuelven en el API. */
  assigned: (params: ITDataTableFetchParamsPost) =>
    post<AssignedDevicesTableResponse>(`/reports/assigned-devices`, params),
  devices: (params: ITDataTableFetchParamsPost) =>
    post<DevicesTableResponse>(`/reports/devices`, params),
  /** Universo filtrado para el PDF, con tope explícito y aviso de truncamiento. */
  assignedExport: (params: ITDataTableFetchParamsPost) =>
    post<AssignedDevicesExportResponse>(`/reports/assigned-devices/export`, params),
  devicesExport: (params: ITDataTableFetchParamsPost) =>
    post<DevicesExportResponse>(`/reports/devices/export`, params),
};
