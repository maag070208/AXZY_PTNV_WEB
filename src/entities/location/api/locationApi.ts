import { api } from "@shared/api/client";
import {
  tableRequest,
  type ITDataTableFetchParamsPost,
} from "@shared/api/table";
import type { Location, Sublugar } from "../model/types";

export const locationsApi = {
  table: (params: ITDataTableFetchParamsPost) =>
    tableRequest<Location>(`/locations/query`, params),
  list: (includeInactive = false) =>
    api.get<Location[]>(`/locations${includeInactive ? "?includeInactive=true" : ""}`),
  get: (id: string) => api.get<Location>(`/locations/${id}`),
  create: (data: { lugar: string; descripcion?: string }) =>
    api.post<Location>(`/locations`, data),
  update: (id: string, data: { lugar?: string; descripcion?: string; active?: boolean }) =>
    api.put<Location>(`/locations/${id}`, data),
  remove: (id: string) =>
    api.delete<{ soft: boolean; data: Location }>(`/locations/${id}`),
  addSublugar: (locationId: string, name: string) =>
    api.post<Sublugar>(`/locations/${locationId}/sublugares`, { name }),
  removeSublugar: (id: string) =>
    api.delete<{ soft: boolean; data: Sublugar }>(`/locations/sublugares/${id}`),
};