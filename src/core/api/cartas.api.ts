import { api } from "./client";
import {
  tableRequest,
  type ITDataTableFetchParamsPost,
} from "./table";
import type { CartaResponsiva, TICItem } from "@core/store/cartas/types";

export interface CartaItemInput {
  deviceId?: string;
  descripcion: string;
  marca: string;
  modelo: string;
  numeroSerie?: string;
  nombreEquipo?: string;
  controlActivos: string;
  area?: string;
}

export interface CartaInput {
  consecutivo?: string;
  fecha?: string;
  numeroEmpleado: string;
  empresa?: string;
  departamento?: string;
  areaBoss?: string;
  deliveryBy?: string;
  responsableId?: string;
  encargadoId?: string;
  item: CartaItemInput;
}

export interface ConsecutivoState {
  prefijo: string;
  contador: number;
  siguiente: string;
}

export interface GenerateCartaEntry extends CartaResponsiva {
  consecutivo: string;
}

export interface GenerateCartasResult {
  tipo: { code: string; name: string; prefix: string };
  contador: number;
  carta: GenerateCartaEntry;
}

export const cartasApi = {
  table: (params: ITDataTableFetchParamsPost) =>
    tableRequest<CartaResponsiva>(`/cartas/query`, params),
  list: (search?: string) => {
    const qs = search ? `?q=${encodeURIComponent(search)}` : "";
    return api.get<{ data: CartaResponsiva[]; total: number }>(`/cartas${qs}`);
  },
  get: (id: string) => api.get<CartaResponsiva>(`/cartas/${id}`),
  create: (input: CartaInput) =>
    api.post<CartaResponsiva>(`/cartas`, input),
  update: (id: string, input: Partial<CartaInput>) =>
    api.put<CartaResponsiva>(`/cartas/${id}`, input),
  remove: (id: string) => api.delete<void>(`/cartas/${id}`),
  return: (id: string, data: { returnedBy: string; returnCondition: string }) =>
    api.post<CartaResponsiva>(`/cartas/${id}/return`, data),
  undoReturn: (id: string) =>
    api.delete<CartaResponsiva>(`/cartas/${id}/return`),
  generate: (typeId: string) =>
    api.post<GenerateCartasResult>(`/cartas/generate`, { typeId }),
  getConsecutivo: () => api.get<ConsecutivoState>(`/cartas/consecutivo`),
  peekConsecutivo: () => api.get<{ siguiente: string }>(`/cartas/consecutivo/peek`),
  resetConsecutivo: () =>
    api.post<ConsecutivoState>(`/cartas/consecutivo/reset`),
};

export type { CartaResponsiva, TICItem };