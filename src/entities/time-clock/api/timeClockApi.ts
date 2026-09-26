import { api, post } from "@shared/api/client";
import { tableRequest, type ITDataTableFetchParamsPost } from "@shared/api/table";
import type { AccessReportTableResponse } from "@entities/access";
import type {
  Checada,
  ChecadorEmpleado,
  ChecadorEmpleadosResponse,
  ChecadorImportacion,
  ChecadorDispositivo,
  ChecadorProgreso,
  ChecadorRelojConfig,
  ChecadorStatus,
} from "../model/types";

const empleadoPath = (numero: string) => `/checador/empleados/${encodeURIComponent(numero)}`;
const relojPath = (serie: string) => `/checador/relojes/${encodeURIComponent(serie)}`;

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

  /**
   * Drena del reloj todo lo que falte desde el cursor (el rezago completo; solo
   * LEE del reloj). Responde 202 con el avance inicial; la corrida sigue en
   * segundo plano y su avance sale en `status().enCurso`. 409 si ya hay una
   * sincronización en curso, 503 si el checador no está configurado.
   */
  sync: () => api.post<ChecadorProgreso>(`/checador/sync`),

  /**
   * Da de alta un reloj (solo ADMIN): la API se conecta, lee su identidad y
   * arranca su sincronización. Nunca le escribe al reloj. `url` acepta la IP o
   * la URL copiada del navegador; sin `nombre` se usa el configurado en el reloj.
   */
  registrarReloj: (input: { url: string; nombre?: string; asistencia?: boolean }) =>
    api.post<ChecadorDispositivo>(`/checador/relojes`, input),
  /** Cambia cómo lo usa el sistema (nombre, si cuenta para entradas/salidas); no toca el reloj. */
  actualizarReloj: (serie: string, cambios: { nombre?: string; asistencia?: boolean }) =>
    api.patch<ChecadorDispositivo>(relojPath(serie), cambios),
  /** Deja de sincronizar el reloj; sus checadas se quedan. */
  darDeBajaReloj: (serie: string) => api.delete<{ dispositivoSerie: string }>(relojPath(serie)),
  /** Configuración leída en vivo del reloj (solo lectura). */
  configuracionReloj: (serie: string) =>
    api.get<ChecadorRelojConfig>(`${relojPath(serie)}/configuracion`),

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
