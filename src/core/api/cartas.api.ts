import { api } from "./client";
import {
  tableRequest,
  type ITDataTableFetchParamsPost,
} from "./table";
import type { CartaResponsiva, TICItem } from "@core/store/cartas/types";

export interface CartaItemInput {
  deviceId?: string;
  descripcion?: string;
  marca?: string;
  modelo?: string;
  numeroSerie?: string;
  nombreEquipo?: string;
  controlActivos?: string;
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

// Ajusta la respuesta del backend al shape que espera el frontend:
// - Renombra `consecutive` → `consecutivo` (la BD Prisma está en inglés)
// - Aplana `responsable.department.name` → `responsable.area`
//   y `encargado.department.name` → `encargado.area`
// - Garantiza los campos `area` y `numeroEmpleado` en ambos firmantes.
export const normalizeCarta = (raw: any): CartaResponsiva => {
  if (!raw) return raw;
  const c: any = { ...raw };
  if (raw.consecutive != null && raw.consecutivo == null) {
    c.consecutivo = raw.consecutive;
  }
  if (raw.responsable) {
    const { department, area, numeroEmpleado, ...rest } = raw.responsable;
    c.responsable = {
      ...rest,
      area: area ?? department?.name ?? null,
      numeroEmpleado: numeroEmpleado ?? null,
    };
  }
  if (raw.encargado) {
    const { department, area, numeroEmpleado, ...rest } = raw.encargado;
    c.encargado = {
      ...rest,
      area: area ?? department?.name ?? null,
      numeroEmpleado: numeroEmpleado ?? null,
    };
  }
  return c as CartaResponsiva;
};

const normalizeList = <T extends { data?: any[] } | any[]>(res: T): T => {
  if (Array.isArray(res)) {
    return (res as any[]).map(normalizeCarta) as unknown as T;
  }
  if (res && Array.isArray((res as any).data)) {
    return {
      ...(res as any),
      data: (res as any).data.map(normalizeCarta),
    } as T;
  }
  return res;
};

export const cartasApi = {
  table: async (params: ITDataTableFetchParamsPost) => {
    const res = await tableRequest<CartaResponsiva>(`/cartas/query`, params);
    return {
      ...res,
      data: res.data.map(normalizeCarta),
    };
  },
  list: async (search?: string) => {
    const qs = search ? `?q=${encodeURIComponent(search)}` : "";
    const res = await api.get<{ data: CartaResponsiva[]; total: number }>(
      `/cartas${qs}`
    );
    return normalizeList(res);
  },
  get: async (id: string) => {
    const res = await api.get<CartaResponsiva>(`/cartas/${id}`);
    return normalizeCarta(res);
  },
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