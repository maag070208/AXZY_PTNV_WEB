import { api, post } from "@shared/api/client";
import { tableRequest, type ITDataTableFetchParamsPost } from "@shared/api/table";
import type {
  AccessEvent,
  AccessReportTableResponse,
  AccessStats,
  Site,
} from "../model/types";

export const accessApi = {
  /** Tabla server-side (`{ page, limit, filters, sort }` → `{ data, total }`). */
  table: (params: ITDataTableFetchParamsPost) =>
    tableRequest<AccessEvent>(`/access/query`, params),
  /** Conteos (eventos, entradas, salidas, anulados) para los mismos filtros. */
  stats: (params: ITDataTableFetchParamsPost) =>
    post<AccessStats>(`/access/stats`, params),
  get: (id: string) => api.get<AccessEvent>(`/access/${id}`),
  sites: () => api.get<Site[]>(`/access/sites`),
  void: (id: string, reason: string) =>
    api.post<AccessEvent>(`/access/${id}/void`, { reason }),
  /** Página del reporte por persona + `summary` global (contrato ITDataTable). */
  report: (params: ITDataTableFetchParamsPost) =>
    post<AccessReportTableResponse>(`/access/report`, params),
  /** Universo completo sin paginar, para el PDF. Mismos filtros y `summary`. */
  reportExport: (params: ITDataTableFetchParamsPost) =>
    post<AccessReportTableResponse>(`/access/report/export`, params),
};
