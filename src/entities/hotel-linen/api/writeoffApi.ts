import { api } from "@shared/api/client";
import { tableRequest, type ITDataTableFetchParamsPost } from "@shared/api/table";
import type {
  StocktakeCaptureLine,
  StocktakeDetail,
  StocktakeSummary,
  WeeklyWriteoffReport,
  WriteoffCreateInput,
  WriteoffDetail,
  WriteoffDisposition,
  WriteoffRow,
} from "../model/writeoffTypes";

const BASE = "/hotel/linen";

export const writeoffApi = {
  table: (params: ITDataTableFetchParamsPost) => tableRequest<WriteoffRow>(`${BASE}/writeoffs/table`, params),
  detail: (id: string) => api.get<WriteoffDetail>(`${BASE}/writeoffs/${id}`),
  /** Multipart: fotos en `photos` y los renglones como JSON en `lines`. Crea una baja por motivo. */
  create: (input: WriteoffCreateInput) => {
    const form = new FormData();
    form.append("warehouseId", input.warehouseId);
    if (input.locationId) form.append("locationId", input.locationId);
    if (input.notes) form.append("notes", input.notes);
    form.append("lines", JSON.stringify(input.lines));
    input.photos.forEach((file) => form.append("photos", file));
    return api.post<WriteoffDetail[]>(`${BASE}/writeoffs`, form, { headers: { "Content-Type": "multipart/form-data" } });
  },
  review: (id: string, body: { notes?: string | null; cosignToken?: string | null } = {}) =>
    api.post<WriteoffDetail>(`${BASE}/writeoffs/${id}/review`, body),
  approve: (id: string, body: { disposition: WriteoffDisposition; notes?: string | null; cosignToken?: string | null }) =>
    api.post<WriteoffDetail>(`${BASE}/writeoffs/${id}/approve`, body),
  reject: (id: string, body: { notes: string; cosignToken?: string | null }) =>
    api.post<WriteoffDetail>(`${BASE}/writeoffs/${id}/reject`, body),
  /** La foto exige sesión: se descarga como blob. */
  evidence: (id: string, evidenceId: string) =>
    api.get<Blob>(`${BASE}/writeoffs/${id}/evidence/${evidenceId}`, { responseType: "blob" }),
  weekly: (from: string, to: string) =>
    api.get<WeeklyWriteoffReport>(`${BASE}/writeoffs/weekly?from=${from}&to=${to}`),

  // Conteo físico (endpoints de /hotel/stocktakes con grados A–E)
  stocktakes: () => api.get<StocktakeSummary[]>("/hotel/stocktakes"),
  stocktake: (id: string) => api.get<StocktakeDetail>(`/hotel/stocktakes/${id}`),
  createStocktake: (input: { warehouseId: string; notes?: string | null; blind?: boolean }) =>
    api.post<StocktakeSummary>("/hotel/stocktakes", input),
  startStocktake: (id: string) => api.post<StocktakeSummary>(`/hotel/stocktakes/${id}/start`, {}),
  captureStocktake: (id: string, lines: StocktakeCaptureLine[]) =>
    api.put<StocktakeDetail>(`/hotel/stocktakes/${id}/lines`, { lines }),
  closeStocktake: (id: string) => api.post<StocktakeSummary>(`/hotel/stocktakes/${id}/close-count`, {}),
  approveStocktake: (id: string) => api.post<StocktakeSummary>(`/hotel/stocktakes/${id}/approve`, {}),
  cancelStocktake: (id: string) => api.post<StocktakeSummary>(`/hotel/stocktakes/${id}/cancel`, {}),
};
