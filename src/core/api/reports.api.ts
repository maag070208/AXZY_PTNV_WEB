import { api } from "./client";
import {
  tableRequest,
  type ITDataTableFetchParamsPost,
} from "./table";

export interface ReportFilters {
  start?: string;
  end?: string;
  department?: string;
  employee?: string;
}

export interface ReportRow {
  id: string;
  fecha: string;
  document_code: string;
  employee_no: string | null;
  responsible: string;
  department: string;
  subarea: string | null;
  area_boss: string | null;
  delivery_by: string;
  return_date: string | null;
  returned_by: string | null;
  return_condition: string | null;
  asset_code: string;
  description: string;
  cantidad: number;
  brand: string | null;
  model: string | null;
  serial: string | null;
  equipment_name: string | null;
  estado: string;
}

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
  csvUrl: (filters: ReportFilters) => {
    // devuelve la URL completa (sin auth — el navegador la manejará como link de descarga)
    const base =
      ((import.meta as any).env?.VITE_API_URL as string | undefined) ?? "/api/v1";
    return `${base}/reports.csv${buildQS(filters)}`;
  },
};