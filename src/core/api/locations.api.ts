import { api } from "./client";
import type { Location } from "./devices.api";

export const locationsApi = {
  list: () => api.get<Location[]>(`/locations`),
  get: (id: string) => api.get<Location>(`/locations/${id}`),
  create: (data: {
    lugar?: string;
    subLugar?: string;
    numero?: string;
    descripcion?: string;
  }) => api.post<Location>(`/locations`, data),
  update: (id: string, data: {
    lugar?: string;
    subLugar?: string;
    numero?: string;
    descripcion?: string;
  }) => api.put<Location>(`/locations/${id}`, data),
  remove: (id: string) => api.delete<{ success: boolean }>(`/locations/${id}`),
};
