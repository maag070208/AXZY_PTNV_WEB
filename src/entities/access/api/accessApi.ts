import { api } from "@shared/api/client";
import { tableRequest, type ITDataTableFetchParamsPost } from "@shared/api/table";
import type { AccessEvent, Site } from "../model/types";

export const accessApi = {
  /** Tabla server-side (`{ page, limit, filters, sort }` → `{ data, total }`). */
  table: (params: ITDataTableFetchParamsPost) =>
    tableRequest<AccessEvent>(`/access/query`, params),
  get: (id: string) => api.get<AccessEvent>(`/access/${id}`),
  sites: () => api.get<Site[]>(`/access/sites`),
  void: (id: string, reason: string) =>
    api.post<AccessEvent>(`/access/${id}/void`, { reason }),
};
