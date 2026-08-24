import { api } from "./client";
import {
  tableRequest,
  type ITDataTableFetchParamsPost,
} from "./table";

export interface TicketComment {
  id: string;
  ticketId: string;
  autorId: string;
  autor: { id: string; name: string; username: string };
  texto: string;
  creadoEn: string;
}

export interface TicketHistoryEntry {
  id: string;
  ticketId: string;
  type: string;
  detail?: string | null;
  autor?: { id: string; name: string; username: string } | null;
  createdAt: string;
}

export interface Ticket {
  id: string;
  titulo: string;
  descripcion: string;
  status: "ABIERTO" | "EN_SEGUIMIENTO" | "CERRADO";
  priority: "BAJA" | "MEDIA" | "ALTA" | "URGENTE";
  category: "MANTENIMIENTO" | "EQUIPO" | "SISTEMA" | "OTRO";
  creadoPorId: string;
  creadoPor: { id: string; name: string; username: string; puesto?: string };
  asignadoAId?: string | null;
  asignadoA?: { id: string; name: string; username: string; puesto?: string } | null;
  departmentId?: string | null;
  department?: { id: string; name: string } | null;
  closedAt?: string | null;
  closedBy?: string | null;
  comments: TicketComment[];
  history: TicketHistoryEntry[];
  creadoEn: string;
  actualizadoEn: string;
}

export interface TicketInput {
  titulo: string;
  descripcion: string;
  priority?: string;
  category?: string;
  departmentId?: string;
  asignadoAId?: string;
}

export const ticketsApi = {
  table: (params: ITDataTableFetchParamsPost) =>
    tableRequest<Ticket>(`/tickets/query`, params),
  list: (search?: string) => {
    const qs = search ? `?q=${encodeURIComponent(search)}` : "";
    return api.get<{ data: Ticket[]; total: number }>(`/tickets${qs}`);
  },
  get: (id: string) => api.get<Ticket>(`/tickets/${id}`),
  create: (input: TicketInput) => api.post<Ticket>(`/tickets`, input),
  update: (id: string, data: Partial<{
    status: string;
    priority: string;
    asignadoAId: string | null;
    departmentId: string | null;
  }>) => api.put<Ticket>(`/tickets/${id}`, data),
  remove: (id: string) => api.delete<void>(`/tickets/${id}`),
  addComment: (id: string, texto: string) =>
    api.post<TicketComment>(`/tickets/${id}/comments`, { texto }),
};
