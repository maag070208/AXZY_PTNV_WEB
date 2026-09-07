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

export interface TicketAssignmentComment {
  id: string;
  assignmentId: string;
  autorId: string;
  autor: { id: string; name: string; username: string };
  texto: string;
  createdAt: string;
}

export type AssignmentStatus = "PENDIENTE" | "EN_PROGRESO" | "EN_REVISION" | "COMPLETADA";

export interface TicketAssignment {
  id: string;
  ticketId: string;
  userId: string;
  user: { id: string; name: string; username: string; numeroEmpleado?: string | null; puesto?: string | null };
  title: string;
  description: string;
  startDate?: string | null;
  dueDate?: string | null;
  status: AssignmentStatus;
  comments: TicketAssignmentComment[];
  createdAt: string;
  updatedAt: string;
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
  deletedAt?: string | null;
  assignments: TicketAssignment[];
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

export interface KanbanAssignment {
  id: string;
  ticketId: string;
  userId: string;
  user: { id: string; name: string; username: string; numeroEmpleado?: string | null; puesto?: string | null };
  title: string;
  description: string;
  startDate?: string | null;
  dueDate?: string | null;
  status: AssignmentStatus;
  createdAt: string;
  comments?: TicketAssignmentComment[];
  ticket: {
    id: string;
    titulo: string;
    status: "ABIERTO" | "EN_SEGUIMIENTO" | "CERRADO";
    priority: "BAJA" | "MEDIA" | "ALTA" | "URGENTE";
    deletedAt?: string | null;
    department?: { name: string } | null;
  };
}

export const ticketsApi = {
  table: (params: ITDataTableFetchParamsPost) =>
    tableRequest<Ticket>(`/tickets/query`, params),
  list: (search?: string) => {
    const qs = search ? `?q=${encodeURIComponent(search)}` : "";
    return api.get<{ data: Ticket[]; total: number }>(`/tickets${qs}`);
  },
  kanban: () => api.get<{ data: KanbanAssignment[]; total: number }>(`/tickets/kanban`),
  get: (id: string) => api.get<Ticket>(`/tickets/${id}`),
  create: (input: TicketInput) => api.post<Ticket>(`/tickets`, input),
  update: (id: string, data: Partial<{
    status: string;
    priority: string;
    asignadoAId: string | null;
    departmentId: string | null;
  }>) => api.put<Ticket>(`/tickets/${id}`, data),
  remove: (id: string) => api.delete<{ soft: boolean; data: Ticket }>(`/tickets/${id}`),
  addComment: (id: string, texto: string) =>
    api.post<TicketComment>(`/tickets/${id}/comments`, { texto }),
  addAssignment: (
    id: string,
    data: {
      userId: string;
      title: string;
      description?: string;
      startDate?: string | null;
      dueDate?: string | null;
    }
  ) => api.post<TicketAssignment>(`/tickets/${id}/assignments`, data),
  updateAssignment: (
    id: string,
    assignmentId: string,
    data: {
      title?: string;
      description?: string;
      status?: string;
      startDate?: string | null;
      dueDate?: string | null;
    }
  ) => api.put<TicketAssignment>(`/tickets/${id}/assignments/${assignmentId}`, data),
  removeAssignment: (id: string, assignmentId: string) =>
    api.delete<TicketAssignment>(`/tickets/${id}/assignments/${assignmentId}`),
  addAssignmentComment: (id: string, assignmentId: string, texto: string) =>
    api.post<TicketAssignmentComment>(`/tickets/${id}/assignments/${assignmentId}/comments`, {
      texto,
    }),
};
