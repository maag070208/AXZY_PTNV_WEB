import { api } from "@shared/api/client";
import { tableQuery, tableRequest, type ITDataTableFetchParamsPost } from "@shared/api/table";
import type { AccessReportTableResponse, PeopleAttendanceResponse } from "@entities/access";
import type {
  TimeClockPunch,
  TimeClockEmployee,
  TimeClockEmployeesResponse,
  TimeClockImport,
  TimeClockDevice,
  TimeClockProgress,
  TimeClockConfig,
  TimeClockStatus,
  TimeClockSyncHistory,
} from "../model/types";
import type { RemovalCategoryRow, RosterRemovalInput, RosterRunResult, TimeClockRoster } from "../model/roster";

const employeePath = (number: string) => `/time-clock/employees/${encodeURIComponent(number)}`;
const clockPath = (serial: string) => `/time-clock/clocks/${encodeURIComponent(serial)}`;

export const timeClockApi = {
  /** Catálogo de motivos de baja (activos). */
  removalCategories: () => api.get<RemovalCategoryRow[]>(`/time-clock/removal-categories`),
  /** Padrón del reloj: nuevos, bajas pendientes y reapariciones (solo lee la base). */
  roster: () => api.get<TimeClockRoster>(`/time-clock/roster`),
  /** Revisa el padrón contra los relojes que cuentan (solo LEE de los relojes). */
  runRoster: () => api.post<RosterRunResult>(`/time-clock/roster/run`),
  /** Aplica la baja pendiente con motivo; da de baja al usuario. */
  applyRemoval: (number: string, input: RosterRemovalInput) =>
    api.post<{ employeeNumber: string }>(`/time-clock/roster/employees/${encodeURIComponent(number)}/removal`, input),
  /** Descarta la baja pendiente sin motivo. */
  dismissRemoval: (number: string) =>
    api.post<{ employeeNumber: string }>(`/time-clock/roster/employees/${encodeURIComponent(number)}/dismiss`),
  /**
   * Timeline de un reloj: sus últimos intentos de sincronización (falló,
   * reintentó, conectó) con su resumen. Es lo que ve soporte al abrir el
   * detalle de un reloj.
   */
  clockEvents: (serial: string, limit = 50) =>
    api.get<TimeClockSyncHistory>(`${clockPath(serial)}/events?limit=${limit}`),

  /** Tabla server-side (`{ page, limit, filters, sort }` → `{ data, total }`). */
  table: (params: ITDataTableFetchParamsPost) =>
    tableRequest<TimeClockPunch>(`/time-clock/query`, params),
  status: () => api.get<TimeClockStatus>(`/time-clock/status`),
  /**
   * Importa del reloj las checadas de un rango de días (solo LEE del reloj).
   * Responde de inmediato; la importación sigue en segundo plano y su avance
   * sale en `status().importacion`. 409 si ya hay una en curso.
   */
  startImport: (input: { from: string; to: string; tz?: string }) =>
    api.post<TimeClockImport>(`/time-clock/import`, input),

  /**
   * Drena del reloj todo lo que falte desde el cursor (el rezago completo; solo
   * LEE del reloj). Responde 202 con el avance inicial; la corrida sigue en
   * segundo plano y su avance sale en `status().enCurso`. 409 si ya hay una
   * sincronización en curso, 503 si el checador no está configurado.
   */
  sync: () => api.post<TimeClockProgress>(`/time-clock/sync`),

  /**
   * Da de alta un reloj (solo ADMIN): la API se conecta, lee su identidad y
   * arranca su sincronización. Nunca le escribe al reloj. `url` acepta la IP o
   * la URL copiada del navegador; sin `nombre` se usa el configurado en el reloj.
   */
  registerClock: (input: { url: string; name?: string; countsAttendance?: boolean }) =>
    api.post<TimeClockDevice>(`/time-clock/clocks`, input),
  /** Cambia cómo lo usa el sistema (nombre, si cuenta para entradas/salidas); no toca el reloj. */
  updateClock: (serial: string, changes: { name?: string; countsAttendance?: boolean }) =>
    api.patch<TimeClockDevice>(clockPath(serial), changes),
  /** Deja de sincronizar el reloj; sus checadas se quedan. */
  retireClock: (serial: string) => api.delete<{ clockSerial: string }>(clockPath(serial)),
  /** Configuración leída en vivo del reloj (solo lectura). */
  clockSettings: (serial: string) =>
    api.get<TimeClockConfig>(`${clockPath(serial)}/settings`),

  /** Entradas/salidas del reloj: mismo contrato que `/access/report`. */
  report: (params: ITDataTableFetchParamsPost) =>
    tableQuery<AccessReportTableResponse>(`/time-clock/report`, params),
  reportExport: (params: ITDataTableFetchParamsPost) =>
    tableQuery<AccessReportTableResponse>(`/time-clock/report/export`, params),
  /** Entradas/salidas por persona con cada día contra su horario (módulo de horarios). */
  people: (params: ITDataTableFetchParamsPost) =>
    tableQuery<PeopleAttendanceResponse>(`/schedules/attendance/time-clock`, params),

  /** Empleados del reloj con su vínculo o sugerencia (filtros: `q`, `estado`). */
  employees: (params: ITDataTableFetchParamsPost) =>
    tableQuery<TimeClockEmployeesResponse>(`/time-clock/employees/query`, params),
  linkEmployee: (employeeNumber: string, userId: string) =>
    api.put<TimeClockEmployee>(employeePath(employeeNumber), { userId }),
  unlinkEmployee: (employeeNumber: string) =>
    api.delete<{ employeeNumber: string }>(employeePath(employeeNumber)),
  /** Vincula de un jalón las sugerencias `ALTA`. */
  linkSuggested: () =>
    api.post<{ linkedCount: number }>(`/time-clock/employees/link-suggested`),
};
