import { api, post } from "@shared/api/client";
import { tableRequest, type ITDataTableFetchParamsPost } from "@shared/api/table";
import type {
  AsignacionRow,
  AsignadoPersona,
  HorasExtraResponse,
  Horario,
  HorarioInput,
} from "../model/types";

export const scheduleApi = {
  list: (includeInactive?: boolean) =>
    api.get<Horario[]>(`/horarios${includeInactive ? "?includeInactive=true" : ""}`),
  create: (input: HorarioInput) => api.post<Horario>(`/horarios`, input),
  update: (id: string, input: Partial<HorarioInput> & { activo?: boolean }) =>
    api.patch<Horario>(`/horarios/${id}`, input),
  remove: (id: string) =>
    api.delete<{ soft: boolean; data: Horario }>(`/horarios/${id}`),

  /** Asignación masiva: un horario → N personas desde una fecha. */
  asignar: (data: { horarioId: string; userIds: string[]; desde: string }) =>
    api.post<{ asignados: number; horario: string; desde: string }>(
      `/horarios/asignaciones`,
      data
    ),

  asignacionesTable: (params: ITDataTableFetchParamsPost) =>
    tableRequest<AsignacionRow>(`/horarios/asignaciones/query`, params),

  /** Personas con asignación vigente de un horario. */
  asignadosDeHorario: (id: string) =>
    api.get<AsignadoPersona[]>(`/horarios/${id}/asignados`),

  /** Quita (cierra la vigencia) la asignación de varias personas. */
  quitarAsignaciones: (data: { horarioId: string; userIds: string[] }) =>
    api.post<{ quitados: number }>(`/horarios/asignaciones/quitar`, data),

  horasExtra: (params: ITDataTableFetchParamsPost) =>
    post<HorasExtraResponse>(`/horarios/horas-extra/query`, params),

  /** Universo completo sin paginar (para CSV/KPIs). */
  horasExtraExport: (params: ITDataTableFetchParamsPost) =>
    post<HorasExtraResponse>(`/horarios/horas-extra/export`, params),
};
