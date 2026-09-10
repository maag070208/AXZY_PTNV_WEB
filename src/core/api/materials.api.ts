import { api } from "./client";
import { tableRequest, type ITDataTableFetchParamsPost } from "./table";

export interface MaterialHistoryEntry {
  id: string;
  materialId: string;
  type: string;
  detail?: string | null;
  autor?: { id: string; name: string; username: string } | null;
  createdAt: string;
}

export interface Material {
  id: string;
  categoria: string;
  modelo: string;
  descripcion: string;
  marca?: string | null;
  stock: number;
  unidad: string;
  active: boolean;
  history?: MaterialHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface MaterialSummary {
  total: number;
  categorias: number;
  stockTotal: number;
}

export interface MaterialImportResult {
  creados: number;
  actualizados: number;
  omitidos: { fila: number; motivo: string }[];
  detalle: { modelo: string; accion: "creado" | "sumado"; stockFinal: number }[];
}

export const materialsApi = {
  table: (params: ITDataTableFetchParamsPost) => tableRequest<Material>(`/materials/query`, params),
  summary: () => api.get<MaterialSummary>(`/materials/summary`),
  categorias: () => api.get<string[]>(`/materials/categorias`),
  list: (includeInactive = false) =>
    api.get<Material[]>(`/materials${includeInactive ? "?includeInactive=true" : ""}`),
  get: (id: string) => api.get<Material>(`/materials/${id}`),
  create: (data: {
    categoria: string;
    modelo: string;
    descripcion: string;
    marca?: string;
    stock?: number;
    unidad?: string;
  }) => api.post<Material>(`/materials`, data),
  update: (
    id: string,
    data: Partial<{
      categoria: string;
      modelo: string;
      descripcion: string;
      marca: string;
      stock: number;
      unidad: string;
      active: boolean;
    }>
  ) => api.put<Material>(`/materials/${id}`, data),
  remove: (id: string) => api.delete<{ soft: boolean; data: Material }>(`/materials/${id}`),
  parseImport: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post<{ rows: { modelo: string; descripcion: string; cantidad: number }[] }>(
      `/materials/import/parse`,
      form,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
  },
  import: (file: File, categoria: string) => {
    const form = new FormData();
    form.append("file", file);
    form.append("categoria", categoria);
    return api.post<MaterialImportResult>(`/materials/import`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};
