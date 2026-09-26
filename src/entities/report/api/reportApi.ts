import { api } from "@shared/api/client";
import { API_CONSTANTS } from "@shared/api/constants/API_CONSTANTS";
import {
  tableRequest,
  type ITDataTableFetchParamsPost,
} from "@shared/api/table";
import type {
  AssignedDeviceRow,
  DeviceReportRow,
  ReportFilters,
  ReportRow,
} from "../model/types";

const buildQS = (filters: ReportFilters): string => {
  const p = new URLSearchParams();
  if (filters.start) p.set("start", filters.start);
  if (filters.end) p.set("end", filters.end);
  if (filters.department) p.set("department", filters.department);
  if (filters.employee) p.set("employee", filters.employee);
  const s = p.toString();
  return s ? `?${s}` : "";
};

export const reportsApi = {
  table: (params: ITDataTableFetchParamsPost) =>
    tableRequest<ReportRow>(`/reports/query`, params),
  get: (filters: ReportFilters) =>
    api.get<{ data: ReportRow[]; total: number }>(`/reports${buildQS(filters)}`),
  assigned: () =>
    api.get<{ data: AssignedDeviceRow[]; total: number }>(`/reports/assigned-devices`),
  devices: () =>
    api.get<{ data: DeviceReportRow[]; total: number }>(`/reports/devices`),
  csvUrl: (filters: ReportFilters) => {
    // devuelve la URL completa (sin auth — el navegador la manejará como link de descarga)
    return `${API_CONSTANTS.BASE_URL}/reports.csv${buildQS(filters)}`;
  },
};