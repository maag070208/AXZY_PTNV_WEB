import { api } from "@shared/api/client";
import { tableRequest, type ITDataTableFetchParamsPost } from "@shared/api/table";
import type {
  AmenityControlDetail,
  AmenityControlRow,
  AmenityControlSaveInput,
  AmenityLowStockItem,
  AmenityPreview,
  SpaDaily,
} from "../model/amenityTypes";

const BASE = "/hotel/linen/amenities";

export const amenityApi = {
  preview: (warehouseId: string, weekFrom: string) =>
    api.get<AmenityPreview>(`${BASE}/weekly/preview?warehouseId=${encodeURIComponent(warehouseId)}&weekFrom=${weekFrom}`),
  table: (params: ITDataTableFetchParamsPost) => tableRequest<AmenityControlRow>(`${BASE}/weekly/table`, params),
  get: (id: string) => api.get<AmenityControlDetail>(`${BASE}/weekly/${id}`),
  save: (input: AmenityControlSaveInput) => api.post<AmenityControlDetail>(`${BASE}/weekly`, input),
  submit: (id: string) => api.post<AmenityControlDetail>(`${BASE}/weekly/${id}/submit`, {}),
  review: (id: string) => api.post<AmenityControlDetail>(`${BASE}/weekly/${id}/review`, {}),
  acknowledge: (id: string) => api.post<AmenityControlDetail>(`${BASE}/weekly/${id}/acknowledge`, {}),
  lowStock: () => api.get<AmenityLowStockItem[]>(`${BASE}/low-stock`),
  spaDaily: (date?: string) => api.get<SpaDaily>(`${BASE}/spa/daily${date ? `?date=${date}` : ""}`),
};
