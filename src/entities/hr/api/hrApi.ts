import { api } from "@shared/api/client";
import { tableRequest, type ITDataTableFetchParamsPost } from "@shared/api/table";
import { API_CONSTANTS } from "@shared/api/constants/API_CONSTANTS";
import type {
  PersonalProfile,
  PersonalProfileUpdateInput,
  PersonalStats,
  EmployeeDiscount,
  EmployeeDocument,
  TipoDocumento,
  Genero,
  TipoSangre,
  ActaAdministrativa,
  ActaAdministrativaCreateInput,
} from "../model/types";

export const personalApi = {
  table: (params: ITDataTableFetchParamsPost) =>
    tableRequest<PersonalProfile>(`/personal/query`, params),
  stats: () => api.get<PersonalStats>(`/personal/stats`),
  get: (id: string) => api.get<PersonalProfile>(`/personal/${id}`),
  updateProfile: (id: string, data: PersonalProfileUpdateInput) =>
    api.patch<PersonalProfile>(`/personal/${id}/perfil`, data),
  setDiscounts: (id: string, discounts: EmployeeDiscount[]) =>
    api.put<PersonalProfile>(`/personal/${id}/descuentos`, { discounts }),

  uploadPhoto: (id: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post<{ fotoUrl: string }>(`/personal/${id}/foto`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  fotoRawUrl: (id: string) => `${API_CONSTANTS.BASE_URL}/personal/${id}/foto/raw`,

  documents: (id: string) => api.get<EmployeeDocument[]>(`/personal/${id}/documentos`),
  uploadDocument: (id: string, tipoDocumentoId: string, file: File) => {
    const form = new FormData();
    form.append("tipoDocumentoId", tipoDocumentoId);
    form.append("file", file);
    return api.post<EmployeeDocument>(`/personal/${id}/documentos`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  removeDocument: (id: string, docId: string) =>
    api.delete<{ id: string }>(`/personal/${id}/documentos/${docId}`),

  /** Dispara el correo de "Alta de personal" con los documentos adjuntos. */
  notificarAlta: (id: string) =>
    api.post<{ enviado: boolean; adjuntos: number }>(`/personal/${id}/notificar-alta`, {}),

  documentTypes: (includeInactive?: boolean) =>
    api.get<TipoDocumento[]>(`/personal/catalogos/tipos-documento${includeInactive ? "?includeInactive=true" : ""}`),
  createDocumentType: (nombre: string) =>
    api.post<TipoDocumento>(`/personal/catalogos/tipos-documento`, { nombre }),
  updateDocumentType: (id: string, data: { nombre?: string; activo?: boolean }) =>
    api.patch<TipoDocumento>(`/personal/catalogos/tipos-documento/${id}`, data),
  removeDocumentType: (id: string) =>
    api.delete<{ soft: boolean; data: TipoDocumento }>(`/personal/catalogos/tipos-documento/${id}`),

  generos: (includeInactive?: boolean) =>
    api.get<Genero[]>(`/personal/catalogos/generos${includeInactive ? "?includeInactive=true" : ""}`),
  crearGenero: (nombre: string) =>
    api.post<Genero>(`/personal/catalogos/generos`, { nombre }),
  actualizarGenero: (id: string, data: { nombre?: string; activo?: boolean }) =>
    api.patch<Genero>(`/personal/catalogos/generos/${id}`, data),
  eliminarGenero: (id: string) =>
    api.delete<{ soft: boolean; data: Genero }>(`/personal/catalogos/generos/${id}`),

  tiposSangre: (includeInactive?: boolean) =>
    api.get<TipoSangre[]>(`/personal/catalogos/tipos-sangre${includeInactive ? "?includeInactive=true" : ""}`),
  crearTipoSangre: (nombre: string) =>
    api.post<TipoSangre>(`/personal/catalogos/tipos-sangre`, { nombre }),
  actualizarTipoSangre: (id: string, data: { nombre?: string; activo?: boolean }) =>
    api.patch<TipoSangre>(`/personal/catalogos/tipos-sangre/${id}`, data),
  eliminarTipoSangre: (id: string) =>
    api.delete<{ soft: boolean; data: TipoSangre }>(`/personal/catalogos/tipos-sangre/${id}`),

  actas: (params: ITDataTableFetchParamsPost) =>
    tableRequest<ActaAdministrativa>(`/personal/actas/query`, params),
  actasByEmployee: (id: string) => api.get<ActaAdministrativa[]>(`/personal/actas/empleado/${id}`),
  acta: (id: string) => api.get<ActaAdministrativa>(`/personal/actas/${id}`),
  crearActa: (data: ActaAdministrativaCreateInput) =>
    api.post<ActaAdministrativa>(`/personal/actas`, data),
  eliminarActa: (id: string) => api.delete<{ id: string }>(`/personal/actas/${id}`),
};
