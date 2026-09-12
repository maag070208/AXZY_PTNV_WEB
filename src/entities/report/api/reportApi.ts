import { api } from "@core/api/client";
import {
  tableRequest,
  type ITDataTableFetchParamsPost,
} from "@core/api/table";
import type {
  AsignadoRow,
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
  asignados: () =>
    api.get<{ data: AsignadoRow[]; total: number }>(`/reports/asignados`),
  devices: () =>
    api.get<{ data: DeviceReportRow[]; total: number }>(`/reports/devices`),
  csvUrl: (filters: ReportFilters) => {
    // devuelve la URL completa (sin auth — el navegador la manejará como link de descarga)
    const base =
      ((import.meta as any).env?.VITE_API_URL as string | undefined) ?? "/api/v1";
    return `${base}/reports.csv${buildQS(filters)}`;
  },
};