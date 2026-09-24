import { api, post } from "@shared/api/client";
import { tableRequest, type ITDataTableFetchParamsPost } from "@shared/api/table";
import type { AccessReportTableResponse } from "@entities/access";
import type {
  Checada,
  ChecadorEmpleado,
  ChecadorEmpleadosResponse,
  ChecadorImportacion,
  ChecadorStatus,
} from "../model/types";

const empleadoPath = (numero: string) => `/checador/empleados/${encodeURIComponent(numero)}`;

export const checadorApi = {
  /** Tabla server-side (`{ page, limit, filters, sort }` → `{ data, total }`). */
  table: (params: ITDataTableFetchParamsPost) =>
    tableRequest<Checada>(`/checador/query`, params),
  status: () => api.get<ChecadorStatus>(`/checador/status`),
  /**
   * Importa del reloj las checadas de un rango de días (solo LEE del reloj).
   * Responde de inmediato; la importación sigue en segundo plano y su avance
   * sale en `status().importacion`. 409 si ya hay una en curso.
   */
  importar: (input: { desde: string; hasta: string; tz?: string }) =>
    api.post<ChecadorImportacion>(`/checador/import`, input),

  /** Entradas/salidas del reloj: mismo contrato que `/access/report`. */
  report: (params: ITDataTableFetchParamsPost) =>
    post<AccessReportTableResponse>(`/checador/report`, params),
  reportExport: (params: ITDataTableFetchParamsPost) =>
    post<AccessReportTableResponse>(`/checador/report/export`, params),

  /** Empleados del reloj con su vínculo o sugerencia (filtros: `q`, `estado`). */
  empleados: (params: ITDataTableFetchParamsPost) =>
    post<ChecadorEmpleadosResponse>(`/checador/empleados/query`, params),
  vincular: (numeroEmpleado: string, userId: string) =>
    api.put<ChecadorEmpleado>(empleadoPath(numeroEmpleado), { userId }),
  desvincular: (numeroEmpleado: string) =>
    api.delete<{ numeroEmpleado: string }>(empleadoPath(numeroEmpleado)),
  /** Vincula de un jalón las sugerencias `ALTA`. */
  vincularSugeridos: () =>
    api.post<{ vinculados: number }>(`/checador/empleados/vincular-sugeridos`),
};
